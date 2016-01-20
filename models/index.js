var Sequelize = require('sequelize');

var sequelize = new Sequelize('d42p21s21sleer', 'qeqqonrddbxfek', '3f8iUI7heiVVmXXFQWtJhpGVcf', {
  host: 'ec2-54-247-170-228.eu-west-1.compute.amazonaws.com',
  port: '5432',
  dialect: 'postgres',
  dialectOptions: {
    ssl: true
  },
  logging: false,
  pool: {
    max: 5,
    min: 0,
    idle: 10000
  },
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
      })})})});//

/*db.User.sync().then(function () {
  db.Group.sync().then(function () {
    db.membership.sync().then(function () {
      db.Payment.sync().then(function () {
        db.paymentParticipation.sync();
      })})})});*/

module.exports = db;