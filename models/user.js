var bcrypt  = require('bcryptjs')
  , iban    = require('iban')
  , jwt     = require('jwt-simple')
  , Promise = require('bluebird');

module.exports = function(sequelize, DataTypes) {

  var User = sequelize.define('User', {
    email: {
      type: DataTypes.STRING,
      validate: {
        isEmail: true
      },
      primaryKey: true
    },
    password: {
      type: DataTypes.STRING
    },
    passwordResetToken: {
      type: DataTypes.STRING
    },
    name: {
      type: DataTypes.STRING
    },
    bankAccount: {
      type: DataTypes.STRING,
      validate: {
        isIBAN: function (value) {
          if (!iban.isValid(value)) {
            throw new Error('Je bankrekeningnummer moet in IBAN formaat zijn.')
          }
        }
      }
    }
  }, {
    timestamps: true,
    freezeTableName: true,
    instanceMethods: {
      validPassword: function(password) {
        var instance = this;
        return new Promise(function(resolve, reject){
          bcrypt.compare(password, instance.password, function(err, data){
            if (err) reject(err);
            else     resolve(data);
          });
        });
      },
      generateToken: function (key) {
        var date  = new Date()
          , token = jwt.encode({
          exp: date.setDate(date.getDate() + 100),
          key: key
        }, require('../config/secret')());
        return token;
      }
    },
    classMethods: {
      associate: function (models) {
        models.User.belongsToMany(models.Group, {
          through: models.membership,
          as: 'groups'
        });
        models.User.belongsToMany(models.Payment, {
          through: models.paymentParticipation,
          as: 'paymentParticipations'
        });
      }
    },
    indexes: [{
        unique: true,
        fields: ['email']
    }]
  });

  var passwordResetTokenHook = function (instance, options, next) {
    if (!instance.changed('passwordResetToken'))
      return next(null, instance);

    require('crypto').randomBytes(48, function(err, buf) {
      if(err) return next(err);
      instance.passwordResetToken = buf.toString('hex');
      next(null, instance);
    });
  };
  User.beforeUpdate(passwordResetTokenHook);

  var hashPasswordHook = function (instance, options, next) {
    if (!instance.changed('password')) {
      console.log('password has not changed');
      return next(null, instance);
    }

    bcrypt.genSalt(10, function (err, salt){
      if(err) return next(err);

      bcrypt.hash(instance.password, salt, function (err, hash){
        if(err) return next(err);
        instance.password = hash;
        next(null, instance);
      });
    });
  };
  User.beforeCreate(hashPasswordHook);
  User.beforeUpdate(hashPasswordHook);

  return User;
}
