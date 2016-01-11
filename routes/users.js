var User = require('../models/user.js')
  , users = {};

users.get = function(req, res) {
    User.findOne({ '_id': req.params.id }, 'name email', function (err, user) {
        if (err) {
            console.log(err);
            res.json(false);
        } else {
            res.json(user);
        }
    })
};

users.create = function(req, res) {
    var user = new User({
        _id: req.body.email,
        name: {
            first: req.body.name.first,
            last: req.body.name.last
        },
        email: req.body.email,
        password: req.body.password
    });

    user.save(function (err, user) {
        if (err) {
            res.status(400);
            res.json(err);
        } else {
            res.json(user);
        }
    });
};

users.update = function(req, res) {
    var id = req.params.id;
    res.json(false);
};

users.delete = function(req, res) {
    /* Delete account maar pas als hij/zij uit alle lijsten is */
    var id = req.params.id;
    User.remove({}, function(err) {
        console.log('collection removed')
    });
    res.json(false);
};

module.exports = users;
