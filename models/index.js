var Sequelize = require('sequelize');

var sequelize = new Sequelize('d27nn3vddqmm78', 'ixviqsdrhxsvnk', 'BoVf3LfBg92Yb69vGKNOS1PWIT', {
  host: 'ec2-54-195-252-202.eu-west-1.compute.amazonaws.com',
  port: '5432',
  dialect: 'postgres',

  pool: {
    max: 5,
    min: 0,
    idle: 10000
  },
  logging: false,
});

var db = {};
db.User                 = sequelize.import('./user');
db.membership           = sequelize.import('./membership');
db.Group                = sequelize.import('./group');
db.Payment              = sequelize.import('./payment');
db.paymentParticipation = sequelize.import('./paymentParticipation');

db.Group.associate(db);
db.User.associate(db);
db.Payment.associate(db);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

/*db.User.sync({ force: true }).then(function () {
  db.Group.sync({ force: true }).then(function () {
    db.membership.sync({ force: true }).then(function () {
      db.Payment.sync({ force: true }).then(function () {
        db.paymentParticipation.sync({ force: true });
      })})})});//*/

db.User.sync().then(function () {
  db.Group.sync().then(function () {
    db.membership.sync().then(function () {
      db.Payment.sync().then(function () {
        db.paymentParticipation.sync();
      })})})});//

module.exports = db;