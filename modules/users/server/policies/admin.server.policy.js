const hakki = require('hakki')();

/**
 * Invoke Admin Permissions
 */
exports.invokeRolesPolicies = async () => {
  return hakki.allow([{
    roles: ['admin'],
    allows: [{
      resources: '/api/users',
      permissions: '*'
    }, {
      resources: '/api/users/:userId',
      permissions: '*'
    }]
  }]);
};

/**
 * Check If Admin Policy Allows
 */
exports.isAllowed = async (req, res, next) => {
  const roles = (req.user) ? req.user.roles : ['guest'];

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
    .catch(() => {
      return res.status(500).send('Unexpected authorization error');
    });
};
