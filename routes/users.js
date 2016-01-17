var Models  = require('../models')
  , auth  = require('../middlewares/auth.js')
  , users = {};

users.get = function(req, res) {
  // The user info is already pulled from DB when checking the access-token
  res.json(req.user);
};

users.create = function(req, res) {
  // TODO: check if email is valid

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
    res.json(result);
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
      throw new Error('You need to leave all groups before you can delete your account.');
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

module.exports = users;
