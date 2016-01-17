module.exports = function(sequelize, DataTypes) {

  var Payment = sequelize.define('Payment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    description: {
      type: DataTypes.STRING
    },
    amount: {
      type: DataTypes.NUMERIC(12,3),
      defaultValue: 0.000
    }
  }, {
    timestamps: true,
    freezeTableName: true,
    classMethods: {
      associate: function (models) {
        models.Payment.belongsToMany(models.User, {
          through: models.paymentParticipation,
          as: 'participants'
        });
        models.Payment.belongsTo(models.User, {
          as: 'payedBy'
        });
      }
    }
  });

  return Payment;
}
