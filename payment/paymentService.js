'use strict';

const paymentDb = require("../db/payment");
const paymentProcessDb = require("../db/paymentProcess");
const merchantDb = require("../db/merchant");

const {v4: uuidv4} = require('uuid');
const crypto = require('crypto');
const bitcoinCreateWalletService = require("../btc/bitcoinCreateWalletService");
const paymentProcessService = require("../paymentProcess/paymentProcessService");
const exchangeService = require("../services/exchangeRate");

async function start(request) {

  if (!request) {
    console.log("Request is null")
    return null;
  }

  //check mandatory params
  if (!request.merchantId) {
    return {error: "Missing param: merchantId"}
  }
  if (!request.amount) {
    return {error: "Missing param: amount"}
  }
  if (!request.currency) {
    return {error: "Missing param: currency"}
  }
  if (!request.payCurrency) {
    return {error: "Missing param: payCurrency"}
  }
  if (!request.refNumber) {
    return {error: "Missing param: refNumber"}
  }
  if (!request.signature) {
    return {error: "Missing param: signature"}
  }

  let id = uuidv4(); // ⇨ '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'
  console.log("New payment id: " + id);

  const merchantId = request.merchantId;
  const merchantModel = await merchantDb.getRow(merchantId);

  if (!merchantModel) {
    return {error: "Invalid merchant"};
  }

  var test = merchantModel.test;
  var minConfirmations = 6;

  const signData = "" + merchantId + request.amount + request.currency + request.refNumber;


  //merchantApi verify
  if (!test || "test" !== request.signature)
  {
    var hash = crypto.createHmac('SHA256', merchantModel.secretKey).update(signData).digest('hex');
    if (hash !== request.signature) {
      console.log("Hash: " + hash + " Signature: " + request.signature);
      return {error: "Invalid signature"};
    }
    
    console.log("Signature is valid");
  }

//generate new payment address
  var wallet = await bitcoinCreateWalletService.createWallet(test ? "test" : "");
  console.log("wallet: " + JSON.stringify(wallet));
  var publicKey = wallet.pubkey;


  //calculate payAmount from amount and exchangeRate
  let payAmountObj = await exchangeService.getBuyPrice(request.currency, request.payCurrency, request.amount / Math.pow(10, 2));
  if(!payAmountObj) {
    console.log("Failed to calculate exchange rate. request: " + JSON.stringify(request));
    return null;
  }
  let payAmount = payAmountObj.cryptoAmount;
  var exchangeRate = payAmountObj.exchangePrice;
  var exchangeRateProviderId = payAmountObj.providerId;

  var paymentModel = {
    id: id,
    merchantId: merchantId,
    paymentNumber: id,
    paymentTimeMs: new Date().getTime(),
    refNumber: request.refNumber,
    status: "NEW", //NEW
    currency: request.currency, //EUR, CHF, USD
    amount: request.amount, //without decimal. 10 EUR = 1000
    payCurrency: request.payCurrency, //BTC, ETH
    payAmount: payAmount, //how much must customer pay in BTC
    exchangeRate: exchangeRate,
    exchangeRateProviderId: exchangeRateProviderId,
    publicKey: publicKey, //address where customer should pay
    test: test,
    minConfirmations: minConfirmations,
    callbackUrl: request.callbackUrl,
    successUrl: request.successUrl,
    cancelUrl: request.cancelUrl
  };

  console.log(paymentModel);

  var success = await paymentDb.updateRow(paymentModel);

  success = false; //store both or error

  var paramsProcess = {
    id: id
  };
  success = await paymentProcessDb.updateRow(paramsProcess);

  if (!success) {
    return null;
  } else {
    return {paymentNumber: id};
  }
}

async function getDetails(paymentNumber) {

  var paymentModel = await paymentDb.getRow(paymentNumber);
  if (!paymentModel) {
    return null;
  }
  
  let status = paymentModel.status;
  if (status === "FORWARDED" || status === "FORWARDED_CONFIRMED" || status === "PAID_CONFIRMED") {
    status = "PAID";
  }

  return {
    paymentNumber: paymentModel.paymentNumber,
    refNumber: paymentModel.refNumber,
    amount: paymentModel.amount,
    amountFormatted: (paymentModel.amount / Math.pow(10, 2)) + " " + paymentModel.currency,
    currency: paymentModel.currency,
    publicKey: paymentModel.publicKey,
    payAmount: paymentModel.payAmount,
    payAmountDecimal: paymentModel.payAmount / Math.pow(10, 8),
    payAmountFormatted: (paymentModel.payAmount / Math.pow(10, 8)) + " " + paymentModel.payCurrency,
    payCurrency: paymentModel.payCurrency,
    test: paymentModel.test,
    status: status,
    successUrl: paymentModel.successUrl,
    cancelUrl: paymentModel.cancelUrl,
    merchantCompanyName: paymentModel.merchantCompanyName
  };
}

async function getStatus(paymentNumber) {

  var paymentModel = await paymentDb.getRow(paymentNumber);
  if (!paymentModel) {
    return null;
  }

  if (paymentModel.status === "NEW") {
    await paymentProcessService.processSingle(paymentModel);

    paymentModel = await paymentDb.getRow(paymentNumber);
    if (!paymentModel) {
      return null;
    }
  }

  let status = paymentModel.status;
  if (status === "FORWARDED" || status === "FORWARDED_CONFIRMED" || status === "PAID_CONFIRMED") {
    status = "PAID";
  }

  return {
    paymentNumber: paymentModel.paymentNumber,
    status: status
  };
}

module.exports = {
  start,
  getDetails,
  getStatus
};

//NEW(1), EXPIRED(2), PARTIAL(3), PAID(4), PAID_CONFIRMED(5), 
//FORWARDED(6), FORWARDED_CONFIRMED(7), 
//DONE(10);