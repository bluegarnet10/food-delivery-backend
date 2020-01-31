var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var secret = require('../config').secret;
var SchemaTypes = mongoose.Schema.Types;

var UserSchema = new mongoose.Schema(
	{
		email: {
			type: String,
			lowercase: true,
			unique: true,
			required: [true, 'This field is required'],
			match: [/\S+@\S+\.\S+/, 'is invalid'],
			index: true,
		},
		name: String,
		role: String,
		// Others
		hash: String,
		salt: String,
	},
	{ timestamps: true }
);

UserSchema.plugin(uniqueValidator, { message: 'is already taken' });

UserSchema.methods.validPassword = function(password) {
	var hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
	return this.hash === hash;
};

UserSchema.methods.setPassword = function(password) {
	this.salt = crypto.randomBytes(16).toString('hex');
	this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
};

UserSchema.methods.generateJWT = function() {
	var today = new Date();
	var exp = new Date(today);
	exp.setDate(today.getDate() + 60);

	return jwt.sign(
		{
			id: this._id,
			email: this.email,
			exp: parseInt(exp.getTime() / 1000),
		},
		secret
	);
};

UserSchema.methods.toJSON = function() {
	return {
		_id: this._id,
		email: this.email,
		name: this.name,
		role: this.role,
		token: this.generateJWT(),
	};
};

UserSchema.methods.toUserJSON = function() {
	return {
		_id: this._id,
		email: this.email,
		name: this.name,
		role: this.role,
	};
};

mongoose.model('user', UserSchema);
