var Models  = require('../models')
  , config  = require('../config')
  , mailer  = require('express-mailer')
  , auth    = require('../middlewares/auth.js')
  , users   = {};

users.get = function(req, res) {
  // The user info is already pulled from DB when checking the access-token
  res.json(req.user);
};

users.create = function(req, res) {

  // TODO: send verification email (should I really do this?)

  Models.User
  .create({
    email: req.body.email,
    password: req.body.password,
    name: req.body.name,
    bankAccount: req.body.bankAccount
  })
  .then(function(user) {
    res.json(user);
  }).catch(function(err) {
    // If this happens, the model validation probably failed.
    res.status(400);
    console.log(err);
    res.json(err.message);
  })
};

users.login = function (req, res) {
  // In routes, this controller requires auth.validateRequestWithPassword
  res.json(req.token);
};

users.update = function(req, res) {
  req.user
  .update(req.body, {
    fields: ['name', 'bankAccount', 'password']
  })
  .then(function (result) {
    res.json({
      name: result.name,
      email: result.email,
      bankAccount: result.bankAccount
    });
  })
  .catch(function (err) {
    // If this happens, the model validation probably failed.
    res.status(400);
    res.json(err.message);
  });
};

users.delete = function(req, res) {
  req.user
  .getGroups()
  .then(function (groups) {
    if (groups.length == 0) {
      return req.user.destroy();
    } else {
      throw new Error('Je dient alle groepen te verlaten voordat je je account kunt verwijderen.');
    }
  })
  .then(function (result) {
    if (!result) throw new Error(result);
    res.json(result);
  })
  .catch(function (err) {
    res.status(401);
    res.json(err.message);
  });
};

users.requestPasswordReset = function(req, res) {
  Models.User
  .findById(req.params.id)
  .then(function(user) {
    if (!user) throw new Error('Deze gebruiker bestaat niet.');
    // This will generate a new password reset token
    user.passwordResetToken = (new Date()).getSeconds();
    return user.save();
  })
  .then(function (user) {
    if (!user) throw new Error('Kon geen token aanmaken.');
    res.mailer.send('resetPassword', {
      to: user.email,
      subject: 'Wachtwoord resetten',
      user: user,
      clientUrl: config.clientUrl
    }, function (err) {
      if (err) throw new Error(err);
      res.json(true);
    });
    res.json(user.passwordResetToken);
  }).catch(function(err) {
    // If this happens, the model validation probably failed.
    res.status(500);
    res.json(err.message);
  })
};

users.passwordReset = function(req, res) {
  Models.User
  .findById(req.params.id)
  .then(function(user) {
    if (!user)
      throw new Error('Deze gebruiker bestaat niet.');
    if (!req.body.token || user.passwordResetToken !== req.body.token)
      throw new Error('Je token is ongeldig of verlopen.');
    user.password = req.body.password;
    return user.save();
  })
  .then(function (user) {
    if (!user) throw new Error('Kon nieuwe wachtwoord niet opslaan.');
    res.json(user);
  }).catch(function(err) {
    // If this happens, the model validation probably failed.
    res.status(500);
    res.json(err.message);
  })
};

module.exports = users;
