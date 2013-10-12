Researcher
==========

Ultimate plan
=============

Allow user to run parameterised web queries. The results can then be held for use in further queries later.

Parameters passed to web queries as a json dictionary. The order matters as they will be merged so later ones take priority over earlier.

All results are returned as json dictionary.

This means the results can be dragged into a bin off to one side. A new query can be selected and previous results dragged in to
parameterise the new query.

The list of queries used to get to a result is also held in the object.

Proof of concept
================
Create front end to allow user to enter json string for query. Submit to a query runner that returns results. Render the results on screen.

Setup
======
Get latest node:
sdo apt-get uninstall nodejs
sudo apt-get install software-properties-common
sudo apt-add-repository ppa:chris-lea/node.js-legacy
sudo apt-get update
sudo apt-get install nodejs

install express:
create package.json
run sudo npm install -g

