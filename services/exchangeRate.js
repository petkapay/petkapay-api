'use strict';
const got = require('got');

async function getBuyPrice(currencyFrom, currencyTo, fiatAmount) {
  //Price must be taken for whole amount. Last buy order could be buying less BTC then we want to sell.
  let url = "https://www.bitstamp.net/api/v2/order_book/" + currencyTo.toLowerCase() + currencyFrom.toLowerCase() + "/";

  console.log("url: " + url);
  let data = await got(url).json();
  if (!data) {
    return null;
  }

  const result = readBuyOrders(data, currencyFrom, currencyTo, fiatAmount);
  console.log("getBuyPrice: " + JSON.stringify(result));
  
  return result;
}

function readBuyOrders(data, currencyFrom, currencyTo, fiatAmount) {
  let bidAmount = 0;
  let bidQuantity = 0;
  let btcAmount = 0;
  for (let bid of data.bids)
  {
    bidAmount = parseFloat(bid[0]);
    bidQuantity += parseFloat(bid[1]);

    //calculate BTC for first bid
    btcAmount = fiatAmount / bidAmount;
    
    //compare with bigger amount so we have enough buyers in 1 hour when we are selling
    if (bidQuantity > (btcAmount * 3)) {
      break;
    }
  }

  if (btcAmount === 0) {
    return null;
  }

  if(currencyTo === "BTC") {
    btcAmount = btcAmount.toFixed(8); //limit to 8 decimals
    //convert to satoshi
    btcAmount = btcAmount * Math.pow(10, 8);
  }
  

  return {
    providerId: 1,
    exchangePrice: Math.trunc(bidAmount),
    cryptoAmount: Math.trunc(btcAmount)
  };
}

module.exports = {
  getBuyPrice
};


