var _        = require('underscore')
  , mailer   = require('express-mailer')
  , Models   = require('../models')
  , bluebird = require('bluebird')
  , money    = require('../utils/money');

var groups = {};

groups.getAll = function (req, res) {
  req.user.getGroups({
    include: [{
      model: Models.User,
      as: 'members',
      through: {
        where: {
          active: true
        }
      }
    }, {
        model: Models.Payment,
        as: 'payments',
        include: [{
          model: Models.User,
          as: 'participants'
        }, {
          model: Models.User,
          as: 'payedBy'
        }]
      }]
  })
  .then(function (groups) {
    res.json(groups);
  })
  .catch(function (err) {
    res.status(500);
    res.json(err.message);
  });
};

groups.get = function (req, res) {
  Models.Group
  .find({
    where: {
      id: req.params.id
    },
    include: [{
        model: Models.User,
        as: 'members',
        through: {
          where: {
            active: true
          }
        }
      }, {
        model: Models.Payment,
        as: 'payments',
        include: [{
          model: Models.User,
          as: 'participants'
        }, {
          model: Models.User,
          as: 'payedBy'
        }]
      }]
  })
  .bind({})
  .then(function (group) {
    if (!group) {
      throw new Error('Group does not exist.');
    } else {
      this.group = group
      return group.hasMember(req.user);
    }
  })
  .then(function (isMember) {
    if (!isMember) {
      throw new Error("User is not a member of requested group.");
    } else {
      res.json(this.group);
    }
  })
  .catch(function (err) {
    res.status(500);
    res.json(err.stack);
  });
};

groups.create = function (req, res) {
  // THIS HAS TO BE AN TRANSACTION
  Models.Group
  .create({
    name: req.body.name
  })
  .bind({})
  .then(function (group) {
    this.group = group;
    return group.addMember(req.user, { active: true });
  })
  .then(function (result) {
    if (!result) throw new Error('Could not add user to created group.');
    res.json(this.group);
  })
  .catch(function (err) {
    res.status(500);
    res.json(err.message);
  });
};

groups.update = function (req, res) {
  Models.Group
  .findById(req.params.id)
  .bind({})
  .then(function (group) {
    if (!group) throw new Error('This group does not exist.');
    this.group = group;
    return group.hasMember(req.user);
  })
  .then(function (isMember) {
    if (!isMember) throw new Error('You are not a member of this group.');
    return this.group.update(req.body, {fields: ['name']});
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

groups.delete = function (req, res) {

  // TODO

  res.json(false);
};

groups.settle = function (req, res) {
  Models.Group
  .findById(req.params.id)
  .bind({})
  .then(function (group) {
    if (!group) throw new Error('Group does not exist.');
    this.group = group;
    return this.group.getMembers();
  })
  .then(function (members) {
    if (!members) throw new Error('This group doesn\'t have any members.');
    this.members = members;
    return this.group.getPayments({
      include: [{
        model: Models.User,
        as: 'participants'
      }, {
        model: Models.User,
        as: 'payedBy'
      }]
    });
  })
  .then(function (payments) {
    this.payments = payments
    if (!payments || payments.length == 0) {
      throw new Error('This group doesn\'t have any payments yet.')
    }
    balances = money.calculateBalances(this.members, payments)

    // Maak lege lijsten aan
    this.transactions = []
    var creditors = []
      , debitors  = []

    // Vul de creditors en debitors lijsten
    this.members.forEach(function (p) {
      if      (balances[p.email] > 0) creditors.push(p)
      else if (balances[p.email] < 0) debitors.push(p)
    })

    function balanceSort (a, b) {
      return balances[a.email] - balances[b.email];
    }

    // Sorteer beide lijsten
    creditors.sort(balanceSort);
    debitors.sort(balanceSort);

    // Zolang we nog debiteuren en crediteuren hebben, zoeken we naar mogelijke
    // transacties.
    while (debitors.length > 0 && creditors.length > 0) {
      // Neem de balans van de eerste debiteur. Dit is de grootste schuld
      // aangezien de lijsten gesorteerd zijn.
      var debBal = balances[debitors[0].email]
      // Zolang hij nog schulden heeft, gaan we zoeken naar crediteuren om
      // schulden bij af te lossen.
      while (debBal < 0) {
        // Als de balans van de eerste crediteur de schuld van de debiteur
        // volledig op kan nemen en er nog krediet over blijft..
        if (balances[creditors[0].email] + debBal > 0) {
          // Maak dan een transactie aan met de schuld als hoeveelheid.
          this.transactions.push({
            from: {
              name: debitors[0].name,
              email: debitors[0].email,
              bankAccount: debitors[0].bankAccount },
            to: {
              name: creditors[0].name,
              email: creditors[0].email,
              bankAccount: creditors[0].bankAccount },
            amount: -1 * debBal
          });

          // Administratief: voeg de schuld (negatief) toe aan het krediet van
          // de krediteur.
          balances[creditors[0].email] += debBal
          // Hersorteer de krediteuren
          creditors.sort(balanceSort);
          debBal = 0
          debitors.splice(0, 1);
        // Als de schuld groter is dan het hoogste krediet
        } else {
          this.transactions.push({
            from: {
              name: debitors[0].name,
              email: debitors[0].email,
              bankAccount: debitors[0].bankAccount },
            to: {
              name: creditors[0].name,
              email: creditors[0].email,
              bankAccount: creditors[0].bankAccount },
            amount: balances[creditors[0].email]
          });

          debBal = debBal + balances[creditors[0].email];
          //creditors[i].setBalance(0)
          creditors.splice(0, 1);
          balances[debitors[0].email] = debBal;
          creditors.sort(balanceSort);
          debitors.sort(balanceSort);
          break;
        }
      }
    }

    var paymentIds = _.map(this.payments, function (p) {
      return p.id
    });
    return Models.Payment.destroy({
      where: {id: paymentIds}
    });
  })
  .then(function (result) {
    var adresses = _.map(this.members, function (member) {
      return member.email;
    })

    res.mailer.send('email', {
      to: adresses,
      subject: 'Afrekening van ' + this.group.name,
      group: this.group,
      members: this.members,
      balances: balances,
      transactions: this.transactions
    }, function (err) {
      if (err) throw new Error(err);
      res.json(this.transactions);
    });
  })
  .catch(function (err) {
    res.status(500);
    res.json(err.message);
  });

};

module.exports = groups;
