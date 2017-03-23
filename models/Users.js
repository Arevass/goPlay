var mongoose = require('mongoose');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var uniqueValidator = require('mongoose-unique-validator');

var UserSchema = new mongoose.Schema({

    username: {type: String, lowercase: true, required: [true, "can't be blank"], index: true, match: [/^[a-zA-Z0-9]+$/, 'is invalid']},
    logins: {type: Number, default: 0},
    hash: String,
    salt: String,
    clubs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Club' }]

}, {timestamps: true});

UserSchema.plugin(uniqueValidator, {message: 'is already taken.'});

UserSchema.methods.setPassword = function (password) {

    this.salt = crypto.randomBytes(16).toString('hex');
    this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');

};

UserSchema.methods.validPassword = function (password) {

    var hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');

    return this.hash === hash;

};

UserSchema.methods.generateJWT = function () {

    var today = new Date();
    var exp = new Date(today);
    exp.setDate(today.getDate() + 60);

    return jwt.sign({

        _id: this._id,
        username: this.username,
        exp: parseInt(exp.getTime() / 1000)

    }, 'SECRET');

};

UserSchema.methods.toAuthJSON = function () {
    return {
        username: this.username,
        token: this.generateJWT()
    }
};

UserSchema.methods.countLogins = function (cb) {
    this.logins += 1;
    this.save(cb);
};

mongoose.model('User', UserSchema);
