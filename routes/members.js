var _        = require('underscore')
  , mailer   = require('express-mailer')
  , Models   = require('../models')
  , bluebird = require('bluebird');

var members = {};

members.addMember = function (req, res) {
  var groupId = req.params.id;
  var email   = req.body.email || undefined;

  if (!email || email == req.user.email) {
    res.status(401);
    res.json("You can't add this user.");
  } else {
    Models.User
    .findById(email)
    .bind({})
    .then(function (user) {
      if (!user) {
        throw new Error("Bij dit e-mailadres hoort (nog) geen account.");
      } else {
        // Save the user for later use
        this.user = user;
        // Find the group
        return Models.Group.findById(groupId);
      }
    })
    .then(function (group) {
      if (!group) {
        throw new Error("Deze groep bestaat niet.");
      } else {
        // Save the group for later use
        this.group = group;
        // Check if the group already has the user we want to add
        return this.group.hasMember(this.user);
      }
    })
    .then(function (alreadyInGroup) {
      if (alreadyInGroup) {
        throw new Error("Deze persoon is al lid.");
      } else {
        // Check if the person making this request is in the group
        return this.group.hasMember(req.user);
      }
    })
    .then(function (requesterInGroup) {
      if (!requesterInGroup) {
        throw new Error("Je hebt geen recht om mensen toe te voegen.");
      } else {
        // If we made it till here, add the participant
        return this.group.addMember(this.user, { active: false });
      }
    })
    .then(function (result) {
      res.mailer.send('addToGroup', {
        to: email,
        subject: 'Toegevoegd aan groep ' + this.group.name,
        group: this.group
      }, function (err) {
        if (err) throw new Error(err);
        res.json(this.group);
      });
    })
    .catch(function (err) {
      res.status(400);
      console.log(err.stack);
      res.json(err.message);
    });
  }
};

members.activateMember = function (req, res) {
  Models.Group
  .findById(req.params.id, {
    include: [{
      model: Models.User,
      as: 'members',
      where: {
        email: req.user.email
      },
      through: {
        where: {
          active: false,
        }
      }
    }]
  })
  .bind({})
  .then(function (group) {
    if (!group) {
      throw new Error("Deze groep bestaat niet.");
    } else {
      this.group = group;
      return this.group.hasMember(req.user);
    }
  })
  .then(function (isMember) {
    if (!isMember) {
      throw new Error("Je bent al lid-af.");
    } else {
      if (this.group.members.length == 1) {
        return Models.membership.update({
          active: true
        },{
          where: {
            GroupId: this.group.id,
            UserEmail: req.user.email
          }
        });
      } else {
        throw new Error('Je bent nooit aan deze groep toegevoegd.');
      }
    }
  })
  .then(function (result) {
    res.json(result);
  })
  .catch(function (err) {
    res.status(400);
    res.json(err.message);
  });
};

members.removeMember = function (req, res) {
  Models.Group
  .findById(req.params.id)
  .bind({})
  .then(function (group) {
    if (!group) {
      throw new Error("Deze groep bestaat niet.");
    } else {
      this.group = group;
      return this.group.hasMember(req.user);
    }
  })
  .then(function (isMember) {
    if (!isMember) {
      throw new Error("Je bent al lid-af.");
    } else {
      return this.group.getPayments();
    }
  })
  .then(function (payments) {
    if (payments.length > 0) {
      throw new Error("De groep dient eerst afgerekend te worden.");
    } else {
      return Models.membership.destroy({
        where: {
          GroupId: this.group.id,
          UserEmail: req.user.email
        }
      });
    }
  })
  .then(function (result) {
    if (!result) {
      throw new Error("An unknown error occured.");
    } else {
      // Check if this user is the last member of the group. If so: delete the group.
      res.json(result);
    }
  })
  .catch(function (err) {
    res.status(400);
    res.json(err.message);
  });
};

module.exports = members;
