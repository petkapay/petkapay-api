'use strict';

const service = require("./merchantService");
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

  if (functionName === "create") {
    result = await service.create(postParams);
  }
  
  return util.returnResponse(result);
};
