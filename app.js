// -----------------------------------------------------------------------------
// Create an express app
var paypal_sdk = require('paypal-rest-sdk');
var fs = require('fs');
var xml2js = require('xml2js');
var punycode = require('punycode');
var cheerio = require('cheerio');
var http = require('http');
var url = require('url');
var express = require('express');
var Handlebars = require('handlebars');
var app = express();

// Trust X-Forwardedi-* fields
app.enable('trust proxy')

// No environment specific stuff yet
app.set('title', 'CommunityChest');
process.title = '*** CommunityChest ***'

// Paypal
paypal_sdk.configure({
  'host': 'api.sandbox.paypal.com',
  'client_id': 'AcpOchAW4iH1IQMhdJu7989ZyS4wEO29saJwDA0k-SoV1GW2oJvsceXQmGuO',
  'client_secret': 'EAiMwhBJ872QVI2iTAuRCvwu6KrgAwWT1iNJ9DP6hDb_HYlArRVDycy5Tc5r' });
paypal_sdk.generate_token(function(error, token){
  if(error){
    console.error(error);
  } else {
    console.log(token);
  }
});

// -----------------------------------------------------------------------------
// Database mapping table
var mysql      = require('mysql');
var projects   = new Array();
function dbConnection()
{
  var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'pete',
    password : 'password',
  });
  return connection;
}

var projectTemplate = fs.readFileSync(__dirname + '/templates/project.hbs');
var template = Handlebars.compile(projectTemplate.toString());

var connection = dbConnection();
connection.connect();
connection.query('SELECT * FROM communitychest.project', function(err, rows, fields) {
  if (err) throw err;
  // read in project objects and key on the id
  rows.forEach(function(r) {
    console.log(r.data);
    prj = JSON.parse(r.data);
    prj.id = r.id;
    projects[r.id] = prj;
  });
  connection.end();
});

// -----------------------------------------------------------------------------
// App functions

// convert table object to html
// must have table.columns, table.rows
function sendResultAsTable(res, table) {
  var columns = table.columns;

  res.write('<table class="table table-condensed table-hover"><thead><tr>');
  columns.forEach(function(i) {
    res.write('<th>' + i + '</th>');
  });
  res.write('</thead><tbody>');

  table.rows.forEach(function(row) {
    res.write('<tr>');
    row.forEach(function(field) {
      res.write('<td>' + field + '</td>');
    });
    res.write('</tr>');
  });
  res.write('</tbody></table>');
  res.end();
}

function onLogin(req, res, next) {
//  app.use(express.cookieSession());
  res.sendfile('gui/findOrCreate.html');
};

function onRegister(req, res, next) {
  res.sendfile('gui/index.html');
}

function onNewProject(req, res, next) {
  GenericRequestProcessor(req, res, NewProject);
}

function NewProject(res, name)
{
  // Clone project 1 as a template
  name = JSON.parse(name);
  var newProject = JSON.parse(JSON.stringify(projects[1]));
  newProject.name = name;

  // Insert get id
  console.log("Saving " + newProject);
  var db = dbConnection();
  db.connect();
  var data = { data : JSON.stringify(newProject) };
  db.query("REPLACE INTO communitychest.project SET ?", data, function(err, result) {
    db.end();

    // Store in cache
    newProject.id = result.insertId;
    projects[result.insertId] = newProject;

    // go to project page
    res.write("http://www.intrepiduniverse.com/communitychest/project/" + result.insertId);
    res.end();
  });
}

function onProject(req, res, next) {
  GenericRequestProcessor(req, res, ProjectDisplay);
}

function ProjectDisplay(res, empty) {
  if (res.req.params.id) {
    var data = projects[res.req.params.id];
    var result = template(data);
    res.write(result);
  } else {
    
    // return 404 error
    res.status(404).send('<h1>Error</h1>');
  }
  res.end();
}

// Send HTTP request where body is json dictionary:
//  title : containsThisTitlte
function onFind(req, res, next) {
  GenericRequestProcessor(req, res, ProjectQuery);
}

function GenericRequestProcessor(req, res, clazz)
{
  var body = '';
  req.on('data', function (data) {
    body += data;
  });
  req.on('end', function () {
    try {
      var work = new clazz(res, body);
    } catch (e) {
      res.write('<tbody><tr><td>Error parsing query</td></tr></tbody>');
      res.end();
      console.error('error running query %s: %s', body, e);
    }
  });
}

function onSaveProject(req, res, next) {
  GenericRequestProcessor(req, res, SaveProject);
}

function SaveProject(res, project)
{
  console.log("Saving " + project);
  var db = dbConnection();
  var prj = JSON.parse(project);
  db.connect();
  var data = {id : prj.id, data : project };
  projects[data.id] = prj;
  db.query("REPLACE INTO communitychest.project SET ?", data, function(err) {
    db.end();
    res.end();
  });
}

function ProjectQuery(res, searchParameters)
{
  searchParameters = JSON.parse(searchParameters);

  // filter projects by name
  var table = {};
  table.columns = ['title'];
  table.rows = new Array();
  for (var key in projects) {
    if (key == 1) {
      continue;
    }
    var p = projects[key];
    if (p.name.indexOf(searchParameters.title) != -1) {
      var r = new Array("<a href='project/" + key + "'>" + p.name + "</a>");
      table.rows.push(r);
    }
  };

  // return resuts in a table with hyper links to project page
  sendResultAsTable(res, table);
};

function onProjects(req, res, next) {
  res.write(JSON.stringify(projects));
  res.end();
}

function onPayment(req, res, next) {
  GenericRequestProcessor(req, res, mkPayment);
}

function mkPayment(res, prj)
{
  prj = JSON.parse(prj);
  var amount = prj.amount;
  prj = projects[prj.id];
  prj.amount = String(parseFloat(prj.amount) + parseFloat(amount));

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
        "total": amount,
        "currency": "GBP",
        "details": {
          "subtotal": amount,
          "tax": "0.00",
          "shipping": "0.00"}},
      "description": prj.title }]};

  console.log(payment_details);

  paypal_sdk.payment.create(payment_details, function(error, payment){
    if(error){
      console.error(error);
    } else {
      console.log(payment);
    }
    SaveProject(res, JSON.stringify(prj));
  });
}

// -----------------------------------------------------------------------------
// Setup Middleware and endpoints then start serving

// Log all requests
app.use(express.logger());

// Endpoints
app.use('/login', onLogin);
app.use('/register', onRegister);
app.use('/newProject', onNewProject);
app.use('/saveProject', onSaveProject);
app.get('/project/:id', onProject);
app.use('/find', onFind);
app.use('/payment', onPayment);
app.use('/projects', onProjects);

// send remaining requests to the gui folder
app.use(express.static(__dirname + '/gui'));

/* Start serving */
console.info('Starting up.');
app.listen(8200);
