const hakki = require('hakki')();

exports.invokeRolesPolicies = async () => {
  return hakki.allow([{
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
exports.isAllowed = async (req, res, next) => {
  const roles = req.user ? req.user.roles : ['guest'];

  const id = req.good ? req.good.user.id : '';

  if (req.good && req.user && id === req.user.id) {
    return next();
  }

  // Check for user roles
  return hakki.areAnyRolesAllowed(roles, req.route.path, [req.method.toLowerCase()])
    .then((isAllowed) => {
      if (isAllowed) {
        // Access granted! Invoke next middleware
        return next();
      } else {
        return res.status(403).json({
          message: 'User is not authorized'
        });
      }
    })
    .catch(() => res.status(500).send('Unexpected authorization error'));
};
