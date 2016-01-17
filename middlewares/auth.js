var jwt     = require('jwt-simple')
  , Models  = require('../models')
  , Promise = require("bluebird");

var auth = {
  // Log in met email en wachtwoord om een token te ontvangen
  validateRequestWithPassword: function (req, res, next) {
    // Email addresses are being used as id's in the database
    var email    = req.body.email    || undefined;
    var password = req.body.password || undefined;

    Models.User
    .findById(email)
    .then(function(user) {
      if (!user) {
        throw new Error("Gebruiker is niet bij ons bekend.");
      } else if (!user.validPassword(password)) {
        throw new Error("Wachtwoord ongeldig.");
      } else {
        req.token = user.generateToken(email);
        req.user  = user;
        next();
      }
    }).catch(function (err) {
      res.status(401);
      res.json(err.message);
    });
  },
  validateRequestWithToken: function (req, res, next) {
    // We skip the token auth for OPTIONS requests.
    if (req.method == 'OPTIONS') next();

    try {
      // Save the token and key and decrypted version of token
      var token   = req.headers['x-access-token']
        , key     = req.headers['x-key']
        , decoded = jwt.decode(token, require('../config/secret')());

      // Check if we have a token, if it isn't expired and if the info matches the key
      if (!token)                    throw new Error("No token provided")
      if (decoded.exp <= Date.now()) throw new Error("Token Expired")
      if (key !== decoded.key)       throw new Error("Corrupted token")

      Models.User
      .findById(decoded.key)
      .then(function(user) {
        if (!user) {
          throw new Error("Gebruiker niet bekend.");
        } else {
          req.user = user;
          next();
        }
      }).catch(function (err) {
        res.status(401);
        res.json(err.message);
      });
    } catch (err) {
      res.status(401);
      res.json(err.message);
    }
  }
}

module.exports = auth;
