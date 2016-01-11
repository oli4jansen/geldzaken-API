var _ = require('underscore');
//var Payment = require('../models/payment.js');
var Group   = require('../models/group.js');

var payments = {
    create: function(req, res) {
        var payment = {
            payer:        req.body.payer || req.user._id,
            amount:       req.body.amount || 0,
            participants: req.body.participants || {},
            description: req.body.description || ''
        };

        Group.findOne({ '_id': req.params.group }, function (err, group) {
            if (err) {
                console.log(err);
                res.status(500);
            } else {
                var groupParticipants = _.map(group.participants, function (p) { return p.user })
                var payerInGroup = _.contains(groupParticipants, payment.payer);
                var participantsInGroup = _.every(payment.participants, function (p) {
                    return _.contains(groupParticipants, p);
                });

                if(payerInGroup && participantsInGroup && payment.participants.length) {
                    var share = parseFloat(payment.amount) / payment.participants.length;
                    // Ga alle leden van de groep langs als p
                    _.each(group.participants, function (p) {
                        // Check of p in de deelnemers van de betaling zit
                        if (_.contains(payment.participants, p.user))
                            // Zo ja, verlaag de balans
                            p.balance -= share;
                        if (payment.payer == p.user)
                            p.balance += parseFloat(payment.amount);
                    });

                    group.payments.push(payment);

                    group.save(function (err, group) {
                        if (err) {
                            res.status(400);
                            res.json(err);
                        } else {
                            res.status(200);
                            res.json();
                        }
                    });
                } else {
                    res.status(400);
                    res.json("Payer or participants are not in group.");
                }
            }
        })
    },
    update: function(req, res) {

        /* TODO */

        res.json(false);
    },
    delete: function(req, res) {

        /* TODO */

        Payment.remove({}, function(err) {
            console.log('collection removed')
        });
        res.json(false);
    }
};

module.exports = payments;
