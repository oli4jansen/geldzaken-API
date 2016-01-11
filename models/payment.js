/*var mongoose = require("mongoose");

var PaymentSchema = new mongoose.Schema({
	group: {
		type: mongoose.Schema.ObjectId,
		required: true,
		ref: "Group"
	},
    payer: {
        type: String,
        required: true,
        ref: "User"
    },
    amount: {
    	type: Number,
    	required: true,
    },
    participants: [{
        type: String,
        ref: "User"
    }]
});

module.exports = mongoose.model('Payment', PaymentSchema);
*/