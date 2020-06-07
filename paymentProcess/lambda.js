'use strict';

const paymentProcessService = require("./paymentProcessService");
const util = require("../services/util");

module.exports.handler = async (event, context, callback) => {
  console.log("Request: " + JSON.stringify(event));
  
  const  result = await paymentProcessService.processOpen();

  return util.returnResponse(result);
};
