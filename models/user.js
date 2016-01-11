var mongoose = require("mongoose");

var UserSchema = new mongoose.Schema({
    _id: {
        type: String,
    },
    name: {
        first: String,
        last: String
    },
    email: {
        type: String,
        index: true,
        trim: true,
        unique: true,
        required: 'Email address is required',
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    password: {
        type: String,
        required: true,
        bcrypt: true
    }
});

UserSchema.virtual('name.full').get(function () {
    return this.name.first + ' ' + this.name.last;
});

UserSchema.plugin(require('mongoose-bcrypt'));

module.exports = mongoose.model('User', UserSchema);
