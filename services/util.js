'use strict';

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function encodePOSTParams(obj) {
  var str = [];
  for (var p in obj)
    if (obj.hasOwnProperty(p)) {
      str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
    }
  return str.join("&");
}

function returnResponse(result) {
  console.log("Response:\n" + JSON.stringify(result));

  const response = {
    statusCode: !result || result.error ? 400 : 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify(result)
  };

  return response;
}

module.exports = {
  sleep,
  encodePOSTParams,
  returnResponse
};
