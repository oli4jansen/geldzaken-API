var mongoose = require("mongoose");
require('mongoose-currency').loadType(mongoose);

var PaymentSchema = new mongoose.Schema({
    payer: {
        type: String,
        required: true,
        ref: "User"
    },
    amount: {
        type: mongoose.Types.Currency,
        required: true,
    },
    participants: [{
        type: String,
        ref: "User"
    }],
    description: {
        type: String
    },
    date: {
        type: Date,
        default: Date.now
    }
});

var GroupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    participants: [{
        user: {
            type: String,
            ref: "User"
        },
        balance: {
            type: mongoose.Types.Currency,
            default: 0
        }
    }],
    payments: [PaymentSchema]
});

module.exports = mongoose.model('Group', GroupSchema);
