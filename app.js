// -----------------------------------------------------------------------------
// Create an express app
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

// -----------------------------------------------------------------------------
// Database mapping table
var mysql      = require('mysql');
var projects   = new Array();
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'pete',
  password : 'password',
});

var projectTemplate = fs.readFileSync(__dirname + '/templates/project.hbs');
var template = Handlebars.compile(projectTemplate.toString());

connection.connect();
connection.query('SELECT * FROM communitychest.project', function(err, rows, fields) {
  if (err) throw err;
  // read in project objects and key on the id
  rows.forEach(function(r) {
    console.log(r.data);
    prj = JSON.parse(r.data);
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

function onLogin(req, res, nextt) {
//  app.use(express.cookieSession());
  res.sendfile('gui/findOrCreate.html');
};

function onRegister(req, res, next) {
  res.sendfile('gui/index.html');
}

function onNewProject(req, res, next) {
  res.sendfile('gui/index.html');
}

function onProject(req, res, next) {
  if (req.id) {
    var data = projects[req.id];
    var result = template(data);
    res.write(result);
  } else {
    
    // return 404 error
    res.status(404);
    res.send('<h1>Error</h1>');
  }
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

function ProjectQuery(res, searchParameters)
{
  searchParameters = JSON.parse(searchParameters);

  // filter projects by name
  var table = {};
  table.columns = ['title'];
  table.rows = new Array();
  for (var key in projects) {
    var p = projects[key];
    if (p.name.indexOf(searchParameters.title) != -1) {
      var r = new Array("<a href='project/" + key + "'>" + p.name + "</a>");
      table.rows.push(r);
    }
  };

  // return resuts in a table with hyper links to project page
  sendResultAsTable(res, table);
};

// -----------------------------------------------------------------------------
// Setup Middleware and endpoints then start serving

// Log all requests
app.use(express.logger());

app.param('id', function(req, res, next, id) {
  req.id = id;
});

// Endpoints
app.use('/login', onLogin);
app.use('/register', onRegister);
app.use('/newProject', onNewProject);
app.use('/project/:id', onProject)
app.use('/find', onFind);

// send remaining requests to the gui folder
app.use(express.static(__dirname + '/gui'));

/* Start serving */
console.info('Starting up.');
app.listen(8200);
