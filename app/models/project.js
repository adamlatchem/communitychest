var Base = require('./base');

module.exports = Base.extend({
  "url": "/projects/:name",
  "name":"New Project",
  "location_lat":0,
  "location_long":0, 
  "body":"",
  "keywords":"",
  "header":"",
  "icon":"http://www.iconarchive.com/show/shimmer-icons-by-creative-freedom/Folder-New-icon.html" 
});
module.exports.id = 'Project';