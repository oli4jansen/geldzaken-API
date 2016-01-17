var bcrypt = require('bcryptjs')
  , iban   = require('iban')
  , jwt    = require('jwt-simple');

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
    name: {
      type: DataTypes.STRING
    },
    bankAccount: {
      // TODO: check of het een IBAN is
      type: DataTypes.STRING,
      validate: {
        isIBAN: function (value) {
          if (!iban.isValid(value)) {
            throw new Error('Bank account number had to be in IBAN format.')
          }
        }
      }
    }
  }, {
    timestamps: true,
    freezeTableName: true,
    instanceMethods: {
      validPassword: function(password) {
        return bcrypt.compareSync(password, this.password);
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
    setterMethods: {
      password: function (password) {
        var salt = bcrypt.genSaltSync(10);
        this.setDataValue('password', bcrypt.hashSync(password, salt));
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

  return User;
}
