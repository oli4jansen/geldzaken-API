var jwt = require('jwt-simple');
var User = require('../models/user.js');

/* Private methods */

function genToken(user) {
    var expires = expiresIn(100);
    var token = jwt.encode({
        exp: expires,
        email: user.email
    }, require('../config/secret')());
    return {
        token: token,
        expires: expires,
        user: user
    };
}

function expiresIn(numDays) {
    var dateObj = new Date();
    return dateObj.setDate(dateObj.getDate() + numDays);
}

/* Object to export */

var auth = {
    /* Log in met email en wachtwoord om een token te ontvangen */
    login: function(req, res) {
        var email    = req.body.email || undefined;
        var password = req.body.password || undefined;

        var user = auth.validate(email, password, function (err, user) {
            if (err) {
                res.status(401);
                res.json(err);
            } else {
                res.json(genToken(user));
            }
        });
    },
    validate: function(email, password, callback) {
        /* Checkt of email voorkomt en bij het password hoort. */
        User.findOne({ '_id': email }, function (err, user) {
            if (err) {
                console.log(err);
                callback(err, false)
            } else if (!user) {
                callback("E-mail is niet bij ons bekend.", false);
            } else {
                user.verifyPassword(password, function(err, valid) {
                    if (err) {
                        callback("Wachtwoord kon niet op geldigheid gecontroleerd worden.", false)
                    } else if (!valid) {
                        callback("Wachtwoord ongeldig", false)
                    } else {
                        callback(false, {
                            name: user.name.full,
                            email: user.email
                        });
                    }
                });
            }
        })
    },
    isUser: function(email, callback) {
        /* Checkt of email in de DB staat */
        User.findOne({ '_id': email }, function (err, user) {
            if (err) {
                console.log(err);
                callback(err, false)
            } else if (!user) {
                callback("E-mail is niet bij ons bekend.", false);
            } else {
                callback(false, user);
            }
        });
    },
}

module.exports = auth;
