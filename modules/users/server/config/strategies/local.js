const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('mongoose').model('User');

module.exports = () => {
  // Use local strategy
  passport.use(
    new LocalStrategy({
      usernameField: 'username',
      passwordField: 'password'
    },
    (username, password, done) => {
      User
          .findOne({
            username: username.toLowerCase()
          })
          .exec()
          .then((user) => {
              if (!user || !user.authenticate(password)) {
                return done(null, false, {
                  message: 'Invalid username or password'
                });
              }

              return done(null, user);
          })
          .catch(err => done(err));
    }));
};
