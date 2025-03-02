/**
 * Render the main application page
 */
exports.renderIndex = (req, res) => {
  res.render('modules/core/server/views/index', {
    user: req.user || null
  });
};

/**
 * Render the server error page
 */
exports.renderServerError = (req, res) => {
  res.status(500).render('modules/core/server/views/500', {
    error: 'Oops! Something went wrong...'
  });
};

/**
 * Render the server not found responses
 * Performs content-negotiation on the Accept HTTP header
 */
exports.renderNotFound = (req, res) => {
  res.status(404).format({
    'text/html': () => res.render('modules/core/server/views/404', {
      url: req.originalUrl
    }),
    'application/json': () => res.json({
      error: 'Path not found'
    }),
    'default': () => res.send('Path not found'),
  });
};

exports.version = (req, res) => {
  const path = require('path');
  const { version } = require(path.resolve('./package'));
  res.send({ version });
};
