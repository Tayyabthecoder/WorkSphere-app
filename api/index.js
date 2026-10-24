let app;
try {
  app = require('../backend/dist/server.js');
} catch (e1) {
  try {
    app = require('./backend/dist/server.js');
  } catch (e2) {
    throw new Error('Failed to load backend server: ' + (e1?.message || e1) + ' / ' + (e2?.message || e2));
  }
}

module.exports = app;
module.exports.default = app;
