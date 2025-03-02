const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const config = require(path.resolve('./config/config'));
const { waterfallPromise } = require(path.resolve('./config/lib/util'));
const errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

const User = mongoose.model('User');
const smtpTransport = nodemailer.createTransport(config.mailer.options);

const createRandomBytesForForgot = async ({ req, res }) => {
  return new Promise((resolve, reject) => {
    const size = 20;
    crypto.randomBytes(size, (err, buffer) => {
      if (err) {
        return reject(err);
      }
      const token = buffer.toString('hex');
      resolve({ req, res, token });
    });
  });
};

const findUserForForgot = async ({ req, res, token }) => {
  const user = await User.findOne({
    username: req.body.username.toLowerCase()
  }, '-salt -password');
  if (!user) {
    return res.status(400).send({
      message: 'No account with that username has been found'
    });
  } else if (user.provider !== 'local') {
    return res.status(400).send({
      message: 'It seems like you signed up using your ' + user.provider + ' account'
    });
  } else {
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    const userData = user
      .save()
      .catch(err => {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      });
    return { req, res, user: userData, token };
  }
};

const showEmailPageForForgot = async ({ req, res, user, token }) => {
  return new Promise((resolve, reject) => {
    let httpTransport = 'http://';
    if (config.secure && config.secure.ssl === true) {
      httpTransport = 'https://';
    }
    res.render(path.resolve('modules/users/server/templates/reset-password-email'), {
      name: user.displayName,
      appName: config.app.title,
      url: httpTransport + req.headers.host + '/api/auth/reset/' + token
    }, (err, emailHTML) => {
      if (err) {
        return reject(err);
      } else {
        resolve({ emailHTML, user });
      }
    });
  });
};

const sendEmailForForgot = async ({ emailHTML, user }) => {
  return new Promise((resolve, reject) => {
    const mailOptions = {
      to: user.email,
      from: config.mailer.from,
      subject: 'Password Reset',
      html: emailHTML
    };
    smtpTransport.sendMail(mailOptions, (err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
};

const findUserForReset = async (req, res) => {
  const passwordDetails = req.body;
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: {
      $gt: Date.now()
    }
  });
  if (passwordDetails.newPassword === passwordDetails.verifyPassword) {
    user.password = passwordDetails.newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    return user.save()
      .then(() => new Promise((resolve, reject) => {
        req.login(user, (err) => {
          if (err) {
            reject(err);
          } else {
            // Remove sensitive data before return authenticated user
            user.password = undefined;
            user.salt = undefined;

            res.json(user);
            resolve({ res, user });
          }
        });
      }));
  } else {
    throw new Error('Passwords do not match');
  }
};

const showPageForReset = async ({ res, user }) => {
  return new Promise((resolve, reject) => {
    res.render(path.resolve('modules/users/server/templates/reset-password-confirm-email'), {
      name: user.displayName,
      appName: config.app.title
    }, (err, emailHTML) => {
      if (err) {
        return reject(err);
      }
      resolve({ emailHTML, user });
    });
  });
};

const sendEmailForReset = async ({ emailHTML, user }) => {
  return new Promise((resolve, reject) => {
    const mailOptions = {
      to: user.email,
      from: config.mailer.from,
      subject: 'Your password has been changed',
      html: emailHTML
    };

    smtpTransport.sendMail(mailOptions, (err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
};

/**
 * Forgot for reset password (forgot POST)
 */
exports.forgot = async (req, res, next) => {
  return waterfallPromise([
    createRandomBytesForForgot,
    findUserForForgot,
    showEmailPageForForgot,
    sendEmailForForgot
  ], { req, res })
    .catch(err => res.status(400).send({
      message: errorHandler.getErrorMessage(err)
    }));
};

/**
 * Reset password GET from email token
 */
exports.validateResetToken = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: {
      $gt: Date.now()
    }
  });
  if (!user) {
    return res.redirect('/password/reset/invalid');
  }

  res.redirect('/password/reset/' + req.params.token);
};

/**
 * Reset password POST from email token
 */
exports.reset = (req, res) => {
  return waterfallPromise([
    findUserForReset,
    showPageForReset,
    sendEmailForReset,
  ], { req, res })
    .catch(err => res.status(400).send({
      message: errorHandler.getErrorMessage(err)
    }));
};

/**
 * Change Password
 */
exports.changePassword = async (req, res) => {
  // Init Variables
  const passwordDetails = req.body;
  let message = null;

  if (req.user) {
    if (passwordDetails.newPassword) {
      return User.findById(req.user.id)
          .then(user => {
            if (user) {
              if (user.authenticate(passwordDetails.currentPassword)) {
                if (passwordDetails.newPassword === passwordDetails.verifyPassword) {
                  user.password = passwordDetails.newPassword;

                  user.save((err) => {
                    if (err) {
                      return res.status(400).send({
                        message: errorHandler.getErrorMessage(err)
                      });
                    } else {
                      req.login(user, (err) => {
                        if (err) {
                          res.status(400).send(err);
                        } else {
                          res.send({
                            message: 'Password changed successfully'
                          });
                        }
                      });
                    }
                  });
                } else {
                  res.status(400).send({
                    message: 'Passwords do not match'
                  });
                }
              } else {
                res.status(400).send({
                  message: 'Current password is incorrect'
                });
              }
            }
          })
          .catch(() => res.status(400).send({
            message: 'User is not found'
          }));
    } else {
      res.status(400).send({
        message: 'Please provide a new password'
      });
    }
  } else {
    res.status(400).send({
      message: 'User is not signed in'
    });
  }
};
