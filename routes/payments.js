var _       = require('underscore')
  , Models  = require('../models')
  , Promise = require('bluebird');

var payments = {};

payments.create = function(req, res) {
  var payedBy      = req.body.payedBy      || req.user.email
    , participants = req.body.participants || {}

  var participants = _.indexBy(participants, 'email');

  // THIS SHOULD BE A TRANSACTION

  Models.Group
  .findById(req.params.group)
  .bind({})
  .then(function (group) {
    if (!group) throw new Error('Deze groep bestaat niet.');
    this.group = group;
    return this.group.hasMember(req.user);
  })
  .then(function (isMember) {
    if (!isMember) throw new Error('Je bent geen lid van deze groep.');
    return Models.User.findById(payedBy);
  })
  .then(function (user) {
    if (!user) throw new Error('De betaler is niet bekend.');
    this.user = user;
    // Betaler is gevonden, check of ie lid is van de groep
    return this.group.hasMember(user);
  })
  .then(function (isMember) {
    if (!isMember) throw new Error('De betaler is geen lid van deze groep.');
    // Betaler is lid, zoek nu de delers vd betaling
    return Models.User
    .findAll({
      where: { email: { $in: _.keys(participants) } }
    });
  })
  .then(function (users) {
    if (!users) throw new Error('Kon de deelnemers van deze betaling niet vinden.');
    if (users.length !== _.keys(participants).length) {
      throw new Error('Niet alle deelnemers zijn bekend.');
    }
    this.users = users;
    // Delers gevonden, check of ze lid zijn van de groep
    return this.group.hasMembers(this.users);
  })
  .then(function (areMember) {
    if (!areMember) throw new Error('Deelnemers zijn niet allemaal lid van deze groep.');
    return Models.Payment
    .create({
      amount:      req.body.amount      || 0,
      description: req.body.description || ''
    });
  })
  .then(function (payment) {
    if (!payment) throw new Error('Kon betaling niet aanmaken.');
    this.payment = payment;
    console.log(payment);
    return this.payment.setPayedBy(this.user);
  })
  .then(function (result) {
    if (!result) throw new Error('Kan betaler niet koppelen aan de betaling.');

    var promises = [];
    for (var i = 0; i < this.users.length; i++) {
      promises.push(this.payment.addParticipant(this.users[i], {
        weight: participants[this.users[i].email].weight
      }));
    }
    return Promise.all(promises);
  })
  .then(function (result) {
    if (!result) throw new Error('Kon de deelnemers niet koppelen aan de betaling.');
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
  var payedBy      = req.body.payedBy      || req.user.email
    , participants = req.body.participants || {}

  var participants = _.indexBy(participants, 'email');

  Models.Group
  .findById(req.params.group)
  .bind({})
  .then(function (group) {
    if (!group) throw new Error('Deze groep bestaat niet.');
    this.group = group;
    return Models.Payment.findById(req.params.id);
  })
  .then(function (payment) {
    if (!payment) throw new Error('Deze betaling bestaat niet.');
    this.payment = payment;
    return this.group.hasPayment(this.payment);
  })
  .then(function (hasPayment) {
    if (!hasPayment) throw new Error('Deze betaling hoort niet bij deze groep.');
    return this.group.hasMember(req.user);
  })
  .then(function (isMember) {
    if (!isMember) throw new Error('Je bent geen lid van deze groep.');
    return Models.User.findById(payedBy);
  })
  .then(function (user) {
    if (!user) throw new Error('De betaler is niet bekend.');
    this.user = user;
    // Betaler is gevonden, check of ie lid is van de groep
    return this.group.hasMember(user);
  })
  .then(function (isMember) {
    if (!isMember) throw new Error('De betaler is geen lid van deze groep.');
    // Betaler is lid, zoek nu de delers vd betaling
    return Models.User
    .findAll({
      where: { email: { $in: _.keys(participants) } }
    });
  })
  .then(function (users) {
    if (!users) throw new Error('Kon de deelnemers van deze betaling niet vinden.');
    if (users.length !== _.keys(participants).length) {
      throw new Error('Niet alle deelnemers zijn bekend.');
    }
    this.users = users;
    // Delers gevonden, check of ze lid zijn van de groep
    return this.group.hasMembers(this.users);
  })
  .then(function (areMember) {
    if (!areMember) throw new Error('Deelnemers zijn niet allemaal lid van deze groep.');
    return this.payment.setPayedBy(this.user);
  })
  .then(function (result) {
    if (!result) throw new Error('Kan betaler niet koppelen aan de betaling.');
    for (var i = 0; i < this.users.length; i++) {
      this.users[i].paymentParticipation = {
        weight: participants[this.users[i].email].weight
      }
    }
    return this.payment.setParticipants(this.users);
  })
  .then(function (result) {
    if (!result) throw new Error('Kon de deelnemers niet koppelen aan de betaling.');
    return this.payment.update({
      amount: req.body.amount,
      description: req.body.description
    }, {
      fields: ['description', 'amount']
    });
  })
  .then(function (updated) {
    if (!updated) throw new Error('Kon betaling niet updaten.');
    res.json(updated);
  })
  .catch(function (err) {
    res.status(500);
    res.json(err.message);
  })
};

payments.delete = function (req, res) {
  Models.Group
  .findById(req.params.group)
  .bind({})
  .then(function (group) {
    if (!group) throw new Error('Deze groep bestaat niet.');
    this.group = group;
    return Models.Payment.findById(req.params.id);
  })
  .then(function (payment) {
    if (!payment) throw new Error('Deze betaling bestaat niet.');
    this.payment = payment;
    return this.group.hasPayment(this.payment);
  })
  .then(function (hasPayment) {
    if (!hasPayment) throw new Error('Deze betaling hoort niet bij deze groep.');
    return this.group.hasMember(req.user);
  })
  .then(function (isMember) {
    if (!isMember) throw new Error('Je bent geen lid van deze groep.');
    return this.payment.destroy();
  })
  .then(function (deleted) {
    if (!deleted) throw new Error('Kon betaling niet verwijderen.');
    res.json(this.payment);
  })
  .catch(function (err) {
    res.status(500);
    res.json(err.message);
  })
};

module.exports = payments;
