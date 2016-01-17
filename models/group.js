var bcrypt = require('bcryptjs')

module.exports = function(sequelize, DataTypes) {

  var Group = sequelize.define('Group', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING
    }
  }, {
    freezeTableName: true,
    instanceMethods: {
      generateHash: function(password) {
        return bcrypt.hashSync(password, bcrypt.genSaltSync(8));
      },
      validPassword: function(password) {
        return bcrypt.compareSync(password, this.password);
      },
    },
    classMethods: {
      associate: function (models) {
        models.Group.belongsToMany(models.User, {
          through: models.membership,
          as: 'members'
        });

        models.Group.hasMany(models.Payment, {
          foreignKey: 'group',
          as: 'payments'
        });
      }
    }
  });

  return Group;
}
