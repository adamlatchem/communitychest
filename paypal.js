console.log("ook");

var paypal_sdk = require('paypal-rest-sdk');
paypal_sdk.configure({
  'host': 'api.sandbox.paypal.com',
  'client_id': 'CLIENT_ID',
  'client_secret': 'CLIENT_SECRET' });
paypal_sdk.generate_token(function(error, token){
  if(error){
    console.error(error);
  } else {
    console.log(token);
  }
});

var payment_details = {
  "intent": "sale",
  "payer": {
    "payment_method": "credit_card",
    "funding_instruments": [{
      "credit_card": {
        "type": "visa",
        "number": "4417119669820331",
        "expire_month": "11",
        "expire_year": "2018",
        "cvv2": "874",
        "first_name": "Joe",
        "last_name": "Shopper",
        "billing_address": {
          "line1": "52 N Main ST",
          "city": "Johnstown",
          "state": "OH",
          "postal_code": "43210",
          "country_code": "US" }}}]},
  "transactions": [{
    "amount": {
      "total": "7.47",
      "currency": "USD",
      "details": {
        "subtotal": "7.41",
        "tax": "0.03",
        "shipping": "0.03"}},
    "description": "This is the payment transaction description." }]};


paypal_sdk.payment.create(payment_details, function(error, payment){
  if(error){
    console.error(error);
  } else {
    console.log(payment);
  }
});

	