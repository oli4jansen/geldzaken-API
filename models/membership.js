module.exports = function(sequelize, DataTypes) {

  var membership = sequelize.define('membership', {
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    timestamps: true
  });

  return membership;
}
