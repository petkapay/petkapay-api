'use strict';

const merchantDb = require("../db/merchant");
const got = require('got');
const crypto = require('crypto');
const util = require("../services/util");

async function notifyMerchant(merchantModel, paymentModel) {
  console.log("notifyMerchant: " + paymentModel.callbackUrl)
  if (paymentModel.callbackUrl && paymentModel.callbackUrl.startsWith("http")) {
    const signData = "" + paymentModel.merchantId + paymentModel.amount + paymentModel.currency + paymentModel.paymentNumber;
    var hash = crypto.createHmac('SHA256', merchantModel.secretKey).update(signData).digest('hex');

    let status = paymentModel.status;
    if (status === "FORWARDED" || status === "FORWARDED_CONFIRMED" || status === "PAID_CONFIRMED" || status === "DONE") {
      status = "PAID_CONFIRMED";
    } else if (status === "PAID") {
      status = "PAID";
    } else if (status === "RETURNED") {
      status = "RETURNED";
    } else {
      status = "NEW";
    }

    let notification = {
      refNumber: paymentModel.refNumber,
      signature: hash,
      merchantId: paymentModel.merchantId,
      paymentNumber: paymentModel.paymentNumber,
      amount: paymentModel.amount,
      currency: paymentModel.currency,
      status: status
    };

    console.log("Notify merchant url: " + paymentModel.callbackUrl + " POST: " + util.encodePOSTParams(notification));
    let notifyResponse = await got.post(paymentModel.callbackUrl, {
      headers: {
        'Content-type': 'application/x-www-form-urlencoded'
      },
      body: util.encodePOSTParams(notification),
      timeout: 3000});
    console.log("" + notifyResponse);

    return {
      notifyRequest: JSON.stringify(notification),
      notifyResponse: "" + notifyResponse.statusCode + "::" + notifyResponse.body
    };
  }

  return null;
}

module.exports = {
  notifyMerchant
};
