const bitcoinService = require("./bitcoinService");
const aes = require("../services/aes");
const db = require("../db/keys");

async function createWallet(network) {
  console.log("createWallet: " + network)
  var wallet = bitcoinService.createWallet(network);
  console.log("createWallet: wallet created");

  var encryptResult = aes.encrypt(wallet.privateKey);
  console.log("createWallet: wallet encypted");

  const model = {
    publicKey: wallet.pubkey,
    privateKey: encryptResult,
    insertedTime: new Date().getTime(),
    network: network,
    currency: "BTC"
  };

  let success = await db.updateRow(model);

  if (!success) {
    return null;
  } else {
    return wallet;
  }

}

module.exports = {
  createWallet
};