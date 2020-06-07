'use strict';
const paymentDb = require("../db/payment");
const paymentProcessDb = require("../db/paymentProcess");
const merchantDb = require("../db/merchant");
const blockchain = require("../services/blockchain");
const merchantNotification = require("../services/merchantNotification");
const bitcoinSignTrxService = require("../btc/bitcoinSignTrxService");

const maxPaymentTimeMs = 1000 * 60 * 60 * 1; //1h
const absoluteMaxPaymentTimeMs = 1000 * 60 * 60 * 24; //24h

async function processOpen() {

  var records = await paymentProcessDb.getRows();
  if (!records) {
    return null;
  }

  var processed = 0;
  for (const paymentProcessModel of records) {
    console.log("processOpen paymentProcessModel :" + JSON.stringify(paymentProcessModel));
    //get payment
    var paymentModel = await paymentDb.getRow(paymentProcessModel.id);
    if (!paymentModel) {
      continue;
    }

    processed++;

    await processSingle(paymentModel);
  }

  return {result: processed};

}

async function processSingle(paymentModel) {
  try {
    //check if we can stop processing this payment
    let now = new Date().getTime();
    const paymentTimeMs = paymentModel.paymentTimeMs + absoluteMaxPaymentTimeMs;
    if (now > paymentTimeMs) {
      //remove process
      console.log("absoluteMaxPaymentTimeMs reached for " + paymentModel.id);
      await paymentProcessDb.deleteRow(paymentModel.id);
    }
    //get balance
    if (paymentModel.status === "FORWARDED") {
      //forwarded. Find trx and if more than 6 confirmations, inform merchant

      const trxOnNetwork = await blockchain.findTrx(paymentModel.forwardHash);
      if (trxOnNetwork && trxOnNetwork.confirmations >= paymentModel.minConfirmations) {
        //payment is done
        //notify merchant
        //remove from process

        paymentModel.status = "FORWARDED_CONFIRMED";
        paymentModel.forwardConfirmedTime = new Date().getTime();
        await paymentDb.updateRow(paymentModel);

        await paymentProcessDb.deleteRow(paymentModel.id);

        const merchantModel = await merchantDb.getRow(paymentModel.merchantId);
        if (merchantModel) {
          let response = await merchantNotification.notifyMerchant(merchantModel, paymentModel);
          paymentModel.notifyConfirmedRequest = response.notifyRequest;
          paymentModel.notifyConfirmedResponse = response.notifyResponse;
          paymentModel.notifyConfirmedTime = new Date().getTime();
          await paymentDb.updateRow(paymentModel);
        }
      }

      return true;
    }

    const data = await blockchain.getBalance(paymentModel);
    if (!data) {
      return false;
    }

    //TODO check if total_sent > 0 (forwarded) and set status forwarded
    //this case is only as fallback if status was not stored properly

    var balance = data.balance + data.unconfirmed_balance;
    console.log("balance: " + balance);
    if (balance > 0) {
      if (paymentModel.status === "PAID") {//paid
        //forward
        const merchantModel = await merchantDb.getRow(paymentModel.merchantId);
        const {pushResponse, tx} = await forwardPayment(paymentModel, merchantModel.btcAddress);

        if (pushResponse && pushResponse.tx) {
          //save push, update status
          //
          console.log("Mark FORWARDED :" + paymentModel.id);

          paymentModel.status = "FORWARDED";
          paymentModel.forwardHash = pushResponse.tx.hash;
          paymentModel.forwardTime = new Date().getTime();
          paymentModel.forwardProvider = 1; //blockcypher.com
          paymentModel.forwardTx = JSON.stringify(tx);
          paymentModel.forwardResponseTx = JSON.stringify(pushResponse.tx);
          await paymentDb.updateRow(paymentModel);
        }

      } else {
        if (paymentModel.payAmount === balance) {
          let lastTxHash = blockchain.getLastTxHash(data);

          console.log("Mark PAID :" + paymentModel.id);
          //mark paid
          paymentModel.status = "PAID";
          paymentModel.paidAmount = balance;
          paymentModel.paidTimeMs = new Date().getTime();
          paymentModel.paidHash = lastTxHash;
          await paymentDb.updateRow(paymentModel);

          //send notification to merchant callback
          const merchantModel = await merchantDb.getRow(paymentModel.merchantId);
          if (merchantModel) {
            let response = await merchantNotification.notifyMerchant(merchantModel, paymentModel);
            paymentModel.notifyPaidRequest = response.notifyRequest;
            paymentModel.notifyPaidResponse = response.notifyResponse;
            paymentModel.notifyPaidTime = new Date().getTime();
            await paymentDb.updateRow(paymentModel);
          }
        } else {
          //return payment
          console.log("Balance too high or low");
          let lastTxHash = blockchain.getLastTxHash(data);

          let findTrx = await blockchain.findTrx(lastTxHash);
          if (findTrx) {
            console.log(JSON.stringify(findTrx));
            if (findTrx.inputs && findTrx.inputs.length > 0) {
              let inputs = findTrx.inputs[0];
              if (inputs.addresses && inputs.addresses.length > 0) {
                let returnToBtcAddress = inputs.addresses[0];
                console.log("Returning BTC to " + returnToBtcAddress)
                const {pushResponse, tx} = await forwardPayment(paymentModel, returnToBtcAddress);

                if (pushResponse && pushResponse.tx) {
                  //save push, update status
                  //
                  console.log("Mark RETURNED :" + paymentModel.id);

                  paymentModel.status = "RETURNED";
                  paymentModel.returnHash = pushResponse.tx.hash;
                  paymentModel.returnTime = new Date().getTime();
                  paymentModel.returnProvider = 1; //blockcypher.com
                  paymentModel.returnTx = JSON.stringify(tx);
                  paymentModel.returnResponseTx = JSON.stringify(pushResponse.tx);
                  await paymentDb.updateRow(paymentModel);

                  const merchantModel = await merchantDb.getRow(paymentModel.merchantId);
                  let response = await merchantNotification.notifyMerchant(merchantModel, paymentModel);
                  paymentModel.notifyReturnedRequest = response.notifyRequest;
                  paymentModel.notifyReturnedResponse = response.notifyResponse;
                  paymentModel.notifyReturnedTime = new Date().getTime();
                  await paymentDb.updateRow(paymentModel);
                  
                  await paymentProcessDb.deleteRow(paymentModel.id);
                }
              }
            }
          }


        }
      }
    } else {
      console.log("check if we can stop processing this payment: " + paymentModel.id);
      //check if we can stop processing this payment
      let now = new Date().getTime();
      const paymentTimeMs = paymentModel.paymentTimeMs + maxPaymentTimeMs;
      if (now > paymentTimeMs) {
        //remove process
        console.log("maxPaymentTimeMs reached for " + paymentModel.id);
        await paymentProcessDb.deleteRow(paymentModel.id);
      }
    }

  } catch (e) {
    console.log(e);
    return false;
  }

  return true;
}

async function forwardPayment(paymentModel, toAddress) {

  const data = await blockchain.getUnspentOutputs(paymentModel);
  if (!data) {
    return;
  }

  var outputs = [];
  var txRef = blockchain.getTxRef(data);
  if (txRef && txRef.length > 0)
  {
    for (const tx of txRef)
    {
      outputs.push({
        txHash: tx.tx_hash,
        txIndex: tx.tx_output_n,
        amount: tx.value
      });
    }
  }

  if (!outputs.length) {
    return;
  }

  //fee
  const feePerByte = await blockchain.getFeePerByte();

  var trxInputs = [];
  var totalAmount = 0;
  for (const output of outputs)
  {
    trxInputs.push({
      txHash: output.txHash,
      txIndex: output.txIndex,
      amount: output.amount,
      publicKey: paymentModel.publicKey
    });
    totalAmount += output.amount;
  }

  var trxOutputs = [
    {
      publicKey: toAddress, //To address
      amount: totalAmount
    }
  ];

  var network = paymentModel.test ? "test" : "";

  //sign trx
  //{rawHash: ..., hash: ...}
  const signResult = await bitcoinSignTrxService.prepareAndsignTx(trxInputs, trxOutputs, network, feePerByte);
  console.log(signResult);

  //push trx
  const pushResponse = await blockchain.pushTrx(signResult.rawHash);

  return {pushResponse: pushResponse, tx: signResult};
}


module.exports = {
  processOpen,
  processSingle
};

//NEW(1), EXPIRED(2), PARTIAL(3), PAID(4), PAID_CONFIRMED(5), 
//FORWARDED(6), FORWARDED_CONFIRMED(7), 
//DONE(10), RETURNED(11);