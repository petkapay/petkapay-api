PetkaPay API
============================
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

PetkaPay API is a free and open-source crypto payment processor. 
Start accepting and processing Bitcoin payments with 0 fees.

Deploy on your own Amazon AWS account or use a free hosted service provided by petkapay.com 
The software is built in Javascript and uses AWS Lambda, Gateway API and DynamoDb. 
AWS offers generous free tier.

Released under the terms of the MIT licence.

## Requirements  

* nodejs [download node](https://nodejs.org/en/download/)
* AWS account, Access Key, Access Secret
* [https://www.blockcypher.com](https://www.blockcypher.com/) API token  

### Instalation  

Duplicate 'secrets.v1.template.yml' and rename to secrets.v1.yml. Update file with your secrets.  

Run

```
npm install -g serverless  
serverless config credentials --provider aws --key YOUR_KEY --secret YOUR_SECRET  
serverless deploy --stage v1 --region eu-central-1  
```

## Usage, Integration  

Use prepared [PetkaPay WooCommerce plugin](https://github.com/petkapay/petkapay-woocommerce-plugin)

or

1. Get the all endpoints as an output to 'serverless deploy' command.


>Endpoints:  
  GET  - https://xxxx.execute-api.eu-central-1.amazonaws.com/v1/html/paymentFrame.html  
  GET  - https://xxxx.execute-api.eu-central-1.amazonaws.com/v1/html/test.html  
  GET  - https://xxxx.execute-api.eu-central-1.amazonaws.com/v1/html/register.html  
  POST - https://xxxx.execute-api.eu-central-1.amazonaws.com/v1/payment/start  
  GET  - https://xxxx.execute-api.eu-central-1.amazonaws.com/v1/payment/getDetails  
  GET  - https://xxxx.execute-api.eu-central-1.amazonaws.com/v1/payment/getStatus  
  POST - https://xxxx.execute-api.eu-central-1.amazonaws.com/v1/paymentProcess/processOpen  
  POST - https://xxxx.execute-api.eu-central-1.amazonaws.com/v1/merchant/create  
>
>Replace 'xxxx' with your Gateway API path. 
>Replace 'v1' with your stage.



2. Navigate to https://xxxx.execute-api.eu-central-1.amazonaws.com/v1/html/register.html  

3. Enter your address and click create. Copy Merchant ID.  
>** Use testnet address for testing purpuse!! ** 
>
>https://en.bitcoin.it/wiki/List_of_address_prefixes  


4. Update staticFiles/test.html. Set variable merchantId.

5. Redeploy service  
```
    serverless deploy --stage v1 --region eu-central-1 
``` 

5. Navigate to https://xxxx.execute-api.eu-central-1.amazonaws.com/v1/html/test.html  
Click 'Pay 20 EUR' and follow on screen instructions.




## Custom domain  
https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-custom-domains.html

* Log into your AWS account.   
* Go to API Gateway panel.  
* Click on 'Custom domain names'  
* Click 'Create'  
* Fill in details  
* Configure 'API mappings'  
* Select API, select Stage, enter stage as Path  
* Create CNAME record in your DNS for 'API Gateway domain name:'



## Contributing    

Pull requests are welcome.

## License

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

