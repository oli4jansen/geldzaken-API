var _ = require('underscore');
var mailer = require('express-mailer');
var User = require('../models/user.js');
var Group = require('../models/group.js');

var groups = {
    getAll: function(req, res) {
        Group.find({
            participants: {$elemMatch: {user: req.user._id}}
        })
        .exec(function (err, group) {
            if (err) {
                console.log(err);
                res.json(false);
            } else {
                res.json(group);
            }
        })
    },
    get: function(req, res) {
        var id = req.params.id;
        Group.findOne({ '_id': id })
        .populate('payments.participants', '_id name')
        .populate('payments.payer', '_id name')
        .populate('participants.user', '_id name')
        .exec(function (err, group) {
            if (err) {
                console.log(err);
                res.json(false);
            } else {
                res.json(group);
            }
        })
    },
    settle: function (req, res) {
        var id = req.params.id;
        Group.findOne({ '_id': id })
        .populate('participants.user', '_id name')
        .exec(function (err, group) {
            if (err) {
                console.log(err);
                res.json(false);
            } else {
                // Maak lege lijsten aan
                var transactions = []
                var creditors = [];
                var debitors = [];

                // Vul de creditors en debitors lijsten
                group.participants.forEach(function (p) {
                    if      (p.balance > 0) creditors.push(p);
                    else if (p.balance < 0) debitors.push(p);
                });

                // Sorteer beide lijsten
                creditors.sort(function (a, b) { return a.balance - b.balance; });
                debitors.sort(function (a, b) { return a.balance - b.balance; });

                while (debitors.length > 0 && creditors.length > 0) {
                    var i = 0;
                    var b = debitors[0].balance
                    while (b < 0) {
                        if (creditors[i].balance + b >= 0) {
                            var transaction = {
                                from: debitors[0].user,
                                to: creditors[i].user,
                                amount: -1 * b
                            }
                            transactions.push(transaction);

                            if (creditors[i].balance + b == 0) {
                                //creditors[i].balance = 0;
                                creditors.splice(i, 1);
                            } else {
                                creditors[i].balance += b
                            }
                            //debitors[0].balance = 0;
                            creditors.sort(function (a, b) { return a.balance - b.balance; });
                            b = 0
                            debitors.splice(0, 1);
                        } else {
                            transaction = {
                                from: debitors[0].user,
                                to: creditors[0].user,
                                amount: creditors[0].balance
                            };
                            transactions.push(transaction);

                            b = b + creditors[0].balance;
                            //creditors[i].setBalance(0)
                            creditors.splice(i, 1);
                            debitors[0].balance = b;
                            debitors.sort(function (a, b) { return a.balance - b.balance; });
                            creditors.sort(function (a, b) { return a.balance - b.balance; });
                            break;
                        }
                    }
                }

                res.mailer.send('email', {
                    to: 'oli4jansen.nl@gmail.com',
                    subject: 'Checkout of' + group.name,
                    group: group,
                    transactions: transactions
                }, function (err) {
                    if (err) {
                        console.log(err);
                    }
                    res.json(transactions);
                });
            }
        })
    },
    create: function(req, res) {
        var group = new Group({
            name: req.body.name
        });
        group.participants.push({ user: req.user._id });
        group.save(function (err, group) {
            if (err) {
                res.status(400);
                res.json(err);
            } else {
                res.json(group);
            }
        });
    },
    update: function(req, res) {

        /* TODO */

        res.json(false);
    },
    delete: function(req, res) {

        /* TODO */

        Group.remove({}, function(err) {
            console.log('collection removed')
        });
        res.json(false);
    },
    invite: function(req, res) {
        var id = req.params.id;
        var email = req.body.email;
        if (email == undefined || email == '' || email == req.user._id) {
            res.status(400);
            res.json("Invalid request.");
        } else {
            User.findOne({ '_id': email }, function (err, user) {
                if (err || !user) {
                    res.status(404);
                    res.json("Email is not signed up for Geldzaken.");
                } else {
                    Group.findOne({ '_id': id }, 'participants', function (err, group) {
                        if (err) {
                            res.status(500);
                            res.json(err);
                        } else if (group == null) {
                            res.status(404);
                            res.json("Group does not exist.");
                        } else {
                            var groupParticipants = _.map(group.participants, function (p) {
                                return p.user
                            });
                            if (!_.contains(groupParticipants, email) && _.contains(groupParticipants, req.user._id)) {
                                group.participants.push({ user: email });
                                group.save(function (err, group) {
                                    if (err) {
                                        res.status(500);
                                        res.json(err);
                                    } else {
                                        res.status(200);
                                        res.json("YES");
                                    }
                                });
                            } else {
                                res.status(400);
                                res.json("Cannot add this user to this group.");
                            }
                        }
                    });
                }
            });
        }
    }
};

module.exports = groups;
