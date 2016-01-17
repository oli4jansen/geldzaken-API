var _       = require('lodash')
  , Promise = require('bluebird');

module.exports = {
  calculateBalances: function (members, payments) {

    var balances = {};
    // Initialize all balances to zero
    _.forEach(members, function (m) {
      balances[m.email] = 0
    });

    // Lets look at all payments in this group
    for (var i = 0; i < payments.length; i++ ) {
      // Save current payment as 'payment'
      var payment = payments[i];
      // Add all weights of the payment-participants together
      // This is the factor by which we divide the total amount to find the share.
      var sharedBy = _.sum(_.map(payment.participants), function (p) {
        return p.paymentParticipation.weight;
      });
      // Calculate the share per weight.
      var share = payment.amount / sharedBy;

      // For each participant..
      for (var j = 0; j < payment.participants.length; j++ ) {
        var participant = payment.participants[j];
        var weight = participant.paymentParticipation.weight;
        // Subtract the share from all payment participants
        balances[participant.email] -= share * weight;
      }
      // Add the payed amount to the group member that payed.
      balances[payment.payedBy.email] += payment.amount;
    }

    return balances;
  }
};
