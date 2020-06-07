'use strict';

const paymentService = require("./paymentService");
const util = require("../services/util");

module.exports.handler = async (event, context, callback) => {
  console.log("Request: " + JSON.stringify(event));
  var result = null;
  var functionName = event.path.substring(event.path.lastIndexOf('/') + 1);

  var postParams = null;
  if (event.httpMethod === "POST") {
    var body = event.body;
    if (event.isBase64Encoded) {
      body = Buffer.from(body, "base64").toString()
    }
    postParams = body ? JSON.parse(body) : null;
  }
  console.log("Request: " + JSON.stringify(postParams));
  
  var paymentNumber = null;
  if(event.queryStringParameters) {
    paymentNumber = event.queryStringParameters.paymentNumber;
  }

  if (functionName == "start") {
    result = await paymentService.start(postParams);
  } else if (functionName == "getDetails") {
    result = await paymentService.getDetails(paymentNumber);
  } else if (functionName == "getStatus") {
    result = await paymentService.getStatus(paymentNumber);
  }
  
  return util.returnResponse(result);
};
