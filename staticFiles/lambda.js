let fs = require("fs");
const util = require('util');

// Convert fs.readFile into Promise version of same    
const readFile = util.promisify(fs.readFile);



exports.handler = async (event) => {
  console.log(process.env.PAYMENT_API)
  console.log(event)
  var filename = event.path.substring(event.path.lastIndexOf('/') + 1);
  // Solution is to use absolute path using `__dirname`
  var fileContent = await readFile(__dirname + "/" + filename);

  var contentType = getContentType(event.path);
  var base64 = false;

  if (contentType === "image/png" || contentType === "image/jpg") {
    fileContent = Buffer.from(fileContent).toString('base64');
    base64 = true;
  } else {
    fileContent = Buffer.from(fileContent).toString()
    fileContent = fileContent.replace(/%paymentApi%/g, process.env.PAYMENT_API);
    fileContent = fileContent.replace(/%gatewayAPI%/g, 'https://' + event['headers']['Host'] + '/' + event['requestContext']['stage']);
  }
  const response = {
    statusCode: 200,
    headers: {
      "Content-Type": contentType
    },
    body: fileContent,
    isBase64Encoded: base64

  };

  return response;
};

function getContentType(path)
{
  var response = "text/plain";
  const ext = path.split('.').pop();
  if (ext == "js") {
    response = "application/javascript";
  } else if (ext == "html") {
    response = "text/html";
  } else if (ext == "css") {
    response = "text/css";
  } else if (ext == "svg") {
    response = "image/svg+xml";
  } else if (ext == "jpg") {
    response = "image/jpg";
  } else if (ext == "png") {
    response = "image/png";
  }

  return response;
}
