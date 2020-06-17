'use strict';

const blockcypherToken = process.env.BLOCKCYPHER_TOKEN;
const got = require('got');
const util = require('./util');

async function findTrx(trxHash, test = 0) {
  let network = getNetwork(test);
  var url = "https://api.blockcypher.com/v1/" + "btc" + "/" + network + "/txs/" + trxHash + "?limit=1&token=" + blockcypherToken;
  console.log("url: " + url);
  let data = await got(url).json();
  console.log("findTrx: " + (data ? JSON.stringify(data) : ""));

  if (data && data.error) {
    //wait and retry
    util.sleep(300);
    console.log("retry findTrx");
    data = await got(url).json();
    console.log("findTrx: " + (data ? JSON.stringify(data) : ""));
  }

  return data && data.error ? null : data;
}

async function getBalance(publicKey, test = 0) {
  var minConfirmations = 0;
  let network = getNetwork(test);
  var url = "https://api.blockcypher.com/v1/" + "btc" + "/" + network + "/addrs/" + publicKey + "?confirmations=" + minConfirmations + "&limit=1&token=" + blockcypherToken;
  console.log("url: " + url);
  let data = await got(url).json();
  console.log("getBalance: " + (data ? JSON.stringify(data) : ""));
  
  if (data && data.error) {
    //wait and retry
    util.sleep(300);
    console.log("retry getBalance");
    data = await got(url).json();
    console.log("getBalance: " + (data ? JSON.stringify(data) : ""));
  }

  return data && data.error ? null : data;
}

async function getUnspentOutputs(publicKey, test = 0) {
  var minConfirmations = 0;
  let network = getNetwork(test);
  var url = "https://api.blockcypher.com/v1/" + "btc" + "/" + network + "/addrs/" + publicKey + "?confirmations=" + minConfirmations + "&unspentOnly=true&token=" + blockcypherToken;

  console.log("url: " + url);
  let data = await got(url).json();
  console.log("getUnspentOutputs: " + (data ? JSON.stringify(data) : ""));
  
  if (data && data.error) {
    //wait and retry
    util.sleep(300);
    console.log("retry getUnspentOutputs");
    data = await got(url).json();
    console.log("getUnspentOutputs: " + (data ? JSON.stringify(data) : ""));
  }

  return data && data.error ? null : data;
}

async function pushTrx(rawHash, test = 0) {
  let network = getNetwork(test);
  var url = "https://api.blockcypher.com/v1/" + "btc" + "/" + network + "/txs/push?token=" + blockcypherToken;
  console.log("url: " + url);
  let data = await got.post(url, {json: {tx: rawHash}}).json();
  console.log("pushResponse: " + (data ? JSON.stringify(data) : ""));
  
  if (data && data.error) {
    //wait and retry
    util.sleep(300);
    console.log("retry pushResponse");
    data = await got.post(url, {json: {tx: rawHash}}).json();
    console.log("pushResponse: " + (data ? JSON.stringify(data) : ""));
  }

  return data && data.error ? null : data;
}

function getLastTxHash(data) {
  var lastTxRef = getTxRef(data);

  return lastTxRef && lastTxRef.length > 0 ? lastTxRef[0].tx_hash : null;
}

function getTxRef(data) {
  var txRef = null;

  var unconfirmedTxRef = data.unconfirmed_txrefs;
  if (unconfirmedTxRef && unconfirmedTxRef.length > 0)
  {
    txRef = unconfirmedTxRef;
  }

  if (txRef === null)
  {
    txRef = data.txrefs;
  }

  return txRef;
}

async function getFeePerByte() {
  //fastestFee, halfHourFee, hourFee
  var urlFee = "https://bitcoinfees.earn.com/api/v1/fees/recommended";
  const feeObj = await got(urlFee).json();
  const feePerByte = feeObj.hourFee + 1;
  console.log(JSON.stringify(feeObj));

  return feePerByte;
}

function getNetwork(isTest) {
  let network = "main";
  if(isTest == 1) {
    network = "test3";
  } else {
    //TODO
  }
  
  return network;
}

module.exports = {
  findTrx,
  getBalance,
  getUnspentOutputs,
  pushTrx,
  getFeePerByte,
  getTxRef,
  getLastTxHash
};
