const bitcoinService = require("./bitcoinService");
const aes = require("../services/aes");
const db = require("../db/keys");

async function prepareAndsignTx(inputs, outputs, network, feePerByte) {
  console.log("prepareAndsignTx");
  for (var i = 0; i < inputs.length; i++) {
    const inputIndex = i;
    const keyRow = await db.getRow(inputs[inputIndex].publicKey);
    if(!keyRow) {
      return;
    }
    inputs[inputIndex].privateKey = aes.decrypt(keyRow.privateKey);
    console.log("prepareAndsignTx: decrypted. " + inputs[inputIndex].privateKey);
    
  }

  const tx = bitcoinService.signTx(inputs, outputs, network)
  const vSize = tx.size;
  console.log("prepareAndsignTx: vSize: " + vSize);
  feeSatoshi = feePerByte * vSize;
  console.log("prepareAndsignTx: feeSatoshi: " + feeSatoshi);
  
  if (!feeSatoshi) {
    console.log("prepareAndsignTx: feeSatoshi is empty")
    return null;
  }
  const outLength = outputs.length;
  const feePerOutput = feeSatoshi / outLength;
  for (var i = 0; i < outLength; i++) {
    outputs[i].amount = outputs[i].amount - feePerOutput;
    console.log("prepareAndsignTx: outputs[i].amount: " + outputs[i].amount);
  }

  return bitcoinService.signTx(inputs, outputs, network);
}

module.exports = {
  prepareAndsignTx
};