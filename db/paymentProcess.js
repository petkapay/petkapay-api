'use strict';

const AWS = require("aws-sdk");
const documentClient = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.paymentsProcessTable;

async function getRows() {

  var params = {
    TableName: tableName
  };

  var records = null;
  await documentClient.scan(params, function (err, data) {
    if (err) {
      console.log("Error DynamoDB", err);
    } else {
      console.log("Get " + tableName + " DynamoDB: " + JSON.stringify(data.Items));
      records = data.Items;
    }
  }).promise();

  return records;
}

async function updateRow(model) {
  var params = {
    TableName: tableName,
    Item: model
  };

  console.log(model);

  var success = false;
  await documentClient.put(params, function (err, data) {
    if (err) {
      console.log("Error updatePaymentProcess DynamoDB", err);
    } else {
      console.log("Stored " + tableName + " in DynamoDB");
      success = true;
    }
  }).promise();

  return success;
}

async function deleteRow(paymentNumber) {
  var params = {
    TableName: tableName,
    Key: {'id': paymentNumber}
  };

  console.log(paymentNumber);

  var success = false;
  await documentClient.delete(params, function (err, data) {
    if (err) {
      console.log("Error deletePaymentProcess DynamoDB", err);
    } else {
      console.log("Deleted " + tableName + " in DynamoDB");
      success = true;
    }
  }).promise();

  return success;
}

module.exports = {
  getRows,
  updateRow,
  deleteRow
};