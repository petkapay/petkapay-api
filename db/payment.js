'use strict';

const AWS = require("aws-sdk");
const documentClient = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.paymentsTable;

async function getRow(paymentNumber) {

  var params = {
    TableName: tableName,
    Key: {'id': paymentNumber}
  };

  var data = await documentClient.get(params).promise();
  var record = data && data.Item !== undefined ? data.Item : null;
  console.log("Get " + tableName + " DynamoDB: " + JSON.stringify(record));

  return record;
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
      console.log("Error updatePayment DynamoDB", err);
    } else {
      console.log("Stored " + tableName + " in DynamoDB");
      success = true;
    }
  }).promise();

  return success;
}


module.exports = {
  getRow,
  updateRow
};