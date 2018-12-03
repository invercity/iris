const _ = require('lodash');
const Acl = require('acl');

// Using the memory backend
const acl = new Acl(new Acl.memoryBackend());

exports.invokeRolesPolicies = () => {
  acl.allow([{
    roles: ['admin'],
    allows: [{
      resources: '/api/goods',
      permissions: '*'
    }, {
      resources: '/api/goods/:goodId',
      permissions: '*'
    }]
  }, {
    roles: ['user'],
    allows: [{
      resources: '/api/goods',
      permissions: ['get', 'post']
    }, {
      resources: '/api/goods/:goodId',
      permissions: ['get']
    }]
  }, {
    roles: ['guest'],
    allows: [{
      resources: '/api/goods',
      permissions: ['get']
    }, {
      resources: '/api/goods/:goodId',
      permissions: ['get']
    }]
  }]);
};

/**
 * Check If Goods Policy Allows
 */
exports.isAllowed = (req, res, next) => {
  const roles = (req.user) ? req.user.roles : ['guest'];

  const id = _.get(req.good, 'user.id');

  if (req.good && req.user && id === req.user.id) {
    return next();
  }

  // Check for user roles
  acl.areAnyRolesAllowed(roles, req.route.path, req.method.toLowerCase(), (err, isAllowed) => {
    if (err) {
      // An authorization error occurred.
      return res.status(500).send('Unexpected authorization error');
    } else {
      if (isAllowed) {
        // Access granted! Invoke next middleware
        return next();
      } else {
        return res.status(403).json({
          message: 'User is not authorized'
        });
      }
    }
  });
};
