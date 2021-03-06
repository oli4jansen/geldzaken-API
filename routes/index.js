var express  = require('express')
  , config   = require('../config')
  , users    = require('./users.js')
  , groups   = require('./groups.js')
  , payments = require('./payments.js')
  , members  = require('./members.js')
  , router   = express.Router();

// Public routes

// Takes a username & password and possibly returns an access token
router.post(config.publicPrefix + '/login', users.login);
// Takes user info and puts the user into the database
router.post(config.publicPrefix + '/signup', users.create);
router.put(config.publicPrefix  + '/users/:id/password', users.requestPasswordReset);
router.post(config.publicPrefix  + '/users/:id/password', users.passwordReset);

// Private routes

router.get(config.privatePrefix    + '/users/:id', users.get);
router.put(config.privatePrefix    + '/users/:id', users.update);
router.delete(config.privatePrefix + '/users/:id', users.delete);

router.get(config.privatePrefix  + '/groups', groups.getAll);
router.get(config.privatePrefix  + '/groups/:id', groups.get);
router.post(config.privatePrefix + '/groups/', groups.create);
router.put(config.privatePrefix  + '/groups/:id', groups.update);
router.get(config.privatePrefix  + '/groups/:id/settle', groups.settle);

router.post(config.privatePrefix   + '/groups/:id/members', members.addMember);
router.delete(config.privatePrefix + '/groups/:id/members', members.removeMember);
router.put(config.privatePrefix    + '/groups/:id/members', members.activateMember);

router.post(config.privatePrefix   + '/groups/:group/payments', payments.create);
router.put(config.privatePrefix    + '/groups/:group/payments/:id', payments.update);
router.delete(config.privatePrefix + '/groups/:group/payments/:id', payments.delete);

router.delete(config.privatePrefix + '/groups', groups.delete);

module.exports = router;
