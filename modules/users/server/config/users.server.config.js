const path = require('path');
const passport = require('passport');
const User = require('mongoose').model('User');
const config = require(path.resolve('./config/config'));

module.exports = (app, db) => {
  // Serialize sessions
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize sessions
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findOne({
        _id: id
      }, '-salt -password').exec();
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  });

  // Initialize strategies
  config.utils.getGlobbedPaths(path.join(__dirname, './strategies/**/*.js')).forEach((strategy) => {
    require(path.resolve(strategy))(config);
  });

  // Add passport's middleware
  app.use(passport.initialize());
  app.use(passport.session());
};
