var Base = require('./base');
    Projects = require('../models/projects');

module.exports = Base.extend({
  model: Projects
});
module.exports.id = 'Projects';