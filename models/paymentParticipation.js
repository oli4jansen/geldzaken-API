module.exports = function(sequelize, DataTypes) {

  var paymentParticipation = sequelize.define('paymentParticipation', {
    weight: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    }
  }, {
    timestamps: true
  });

  return paymentParticipation;
}
