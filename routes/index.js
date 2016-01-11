var express = require('express')
  , auth    = require('./auth.js')
  , router  = express.Router();

var user     = require('./users.js')
  , groups   = require('./groups.js')
  , payments = require('./payments.js');

router.post('/login', auth.login);
router.post('/signup', user.create);

router.get('/secret/users', user.getAll); // Should be deleted before release
router.get('/secret/users/:id', user.getOne); // Only own account
router.put('/secret/users/:id', user.update);
router.delete('/secret/users/:id', user.delete);

router.get('/secret/groups', groups.getAll);
router.get('/secret/groups/:id', groups.getOne);
router.post('/secret/groups/', groups.create);
router.put('/secret/groups/:id', groups.update);
router.get('/secret/groups/:id/settle', groups.settle);

router.post('/secret/groups/:id/participants', groups.invite);

router.post('/secret/groups/:group/payments', payments.create);
router.put('/secret/groups/:group/payments/:id', payments.update);
router.delete('/secret/groups/:group/payments/:id', payments.delete);

router.delete('/secret/groups', groups.delete);

module.exports = router;
