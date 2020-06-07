'use strict';

const crypto = require("crypto");
const merchantDb = require("../db/merchant");

async function create(request) {

  if (!request) {
    console.log("Request is null")
    return null;
  }

  let secretKey = crypto.randomBytes(32).toString('hex');

  const btcAddress = request.btcAddress;
  let isTest = false;
  if (btcAddress.startsWith("tb1") ||
          btcAddress.startsWith("tpub") ||
          btcAddress.startsWith("2") ||
          btcAddress.startsWith("m") ||
          btcAddress.startsWith("n")) {
    isTest = true;
  }

  let refNumber = request.refNumber;
  if (!refNumber) {
    refNumber = crypto.randomBytes(6).toString('hex');;
  }

  // generate new merchant id
  let existingModel = null;
  let id = null;
  do {
    id = crypto.randomBytes(6).toString('hex');

    existingModel = await merchantDb.getRow(id);
  } while (existingModel !== null)

  let model = {
    id: id,
    btcAddress: btcAddress,
    test: isTest,
    secretKey: secretKey,
    refNumber: refNumber,
    createdTime: new Date().getTime(),
  };

  console.log(model);

  var success = await merchantDb.updateRow(model);

  if (!success) {
    return null;
  } else {
    return model;
  }
}

module.exports = {
  create
};
