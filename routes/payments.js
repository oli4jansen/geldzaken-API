var _       = require('underscore')
  , Models  = require('../models')
  , Promise = require('bluebird');

var payments = {};

payments.create = function(req, res) {
  var payedBy      = req.body.payedBy      || req.user.email
    , participants = req.body.participants || {}

  var participants = _.indexBy(participants, 'email');

  // THIS SHOULD BE A TRANSACTION

  // Zoek de groep
  Models.Group
  .findById(req.params.group)
  .bind({})
  .then(function (group) {
    if (!group) throw new Error('This group does not exist.');
    this.group = group;
    // Groep is gevonden, zoek de betaler
    return Models.User.findById(payedBy);
  })
  .then(function (user) {
    if (!user) throw new Error('Payed by ID is invalid.');
    this.user = user;
    // Betaler is gevonden, check of ie lid is van de groep
    return this.group.hasMember(user);
  })
  .then(function (isMember) {
    if (!isMember) throw new Error('You are not a member of this group.');
    // Betaler is lid, zoek nu de delers vd betaling
    return Models.User
    .findAll({
      where: { email: { $in: _.keys(participants) } }
    });
  })
  .then(function (users) {
    if (!users) throw new Error('Could not find participants');
    if (users.length !== _.keys(participants).length) {
      throw new Error('Not all participants are known.');
    }
    this.users = users;
    // Delers gevonden, check of ze lid zijn van de groep
    return this.group.hasMembers(this.users);
  })
  .then(function (areMember) {
    if (!areMember) throw new Error('Participants are not all members of group.');
    return Models.Payment
    .create({
      amount:      req.body.amount      || 0,
      description: req.body.description || ''
    });
  })
  .then(function (payment) {
    if (!payment) throw new Error('Could not create payment');
    this.payment = payment;
    console.log(payment);
    return this.payment.setPayedBy(this.user);
  })
  .then(function (result) {
    if (!result) throw new Error('Can\'t add payment to payedBy.');

    var promises = [];
    for (var i = 0; i < this.users.length; i++) {
      promises.push(this.payment.addParticipant(this.users[i], {
        weight: participants[this.users[i].email].weight
      }));
    }
    return Promise.all(promises);
  })
  .then(function (result) {
    if (!result) throw new Error('Could not add participants to payment.');
    return this.group.addPayment(this.payment);
  })
  .then(function (result) {
    res.json(result);
  })
  .catch(function (err) {
    res.status(500);
    res.json(err.message);
  })
};

payments.update = function (req, res) {
  res.json(false);
};

payments.delete = function (req, res) {
  res.json(false);
};

module.exports = payments;
