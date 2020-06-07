var bitcoin = require('bitcoinjs-lib');

function createWallet(network) {
  var btcNetwork = bitcoin.networks.bitcoin
  if (network == "test") {
    btcNetwork = bitcoin.networks.testnet
  }
  const keyPair = bitcoin.ECPair.makeRandom({network: btcNetwork})

  const {address} = bitcoin.payments.p2wpkh({pubkey: keyPair.publicKey, network: btcNetwork})

  return {pubkey: address, privateKey: keyPair.toWIF()}
}

function signTx(inputs, outputs, network) {
  var tx = createTx(inputs, outputs, network)

  return {rawHash: tx.toHex(), hash: tx.getId(), size: tx.virtualSize()}
}

function createTx(inputs, outputs, network) {
  console.log("createTx")
  var btcNetwork = bitcoin.networks.bitcoin
  if (network == "test") {
    btcNetwork = bitcoin.networks.testnet
  }
  if (process.env.DEBUG) {
    console.log("inputs: " + JSON.stringify(inputs))
    console.log("outputs: " + JSON.stringify(outputs))
    console.log("network: " + network)
  }

  const psbt = new bitcoin.Psbt({network: btcNetwork});

  inputs.forEach(function (inputObj) {
    const keyPair = bitcoin.ECPair.fromWIF(inputObj.privateKey, btcNetwork)
    const p2wpkh = bitcoin.payments.p2wpkh({pubkey: keyPair.publicKey, network: btcNetwork})
    
    psbt.addInput({
      hash: inputObj.txHash,
      index: inputObj.txIndex,
      witnessUtxo: {script: Buffer.from(p2wpkh.output, 'hex'), value: inputObj.amount}
    }) // Alice's previous transaction output, has 15000 satoshis
    console.log("signTx: Added input")
  });
  outputs.forEach(function (outputObj) {
    psbt.addOutput({
      address: outputObj.publicKey,
      value: outputObj.amount,
    })
    //amount in satoshi like 12000
    // (in)15000 - (out)12000 = (fee)3000, this is the miner fee
    console.log("signTx: Added output")
  });

  inputs.forEach(function (inputObj, index) {
    console.log("signTx: signing: prepare")
    const keyPair = bitcoin.ECPair.fromWIF(inputObj.privateKey, btcNetwork)

    console.log("signTx: signing")
    psbt.signInput(index, keyPair);
    console.log("signTx: signed")
  });

  console.log("signTx: build")
  psbt.finalizeAllInputs();
  const tx = psbt.extractTransaction();
  console.log(JSON.stringify(tx))

  return tx
}

module.exports = {
  createWallet,
  signTx
};