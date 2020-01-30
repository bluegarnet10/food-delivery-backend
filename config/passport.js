var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
var User = mongoose.model('user');

passport.use(
	new LocalStrategy(
		{
			usernameField: 'email',
			passwordField: 'password',
		},
		function(email, password, done) {
			User.findOne({ email: email })
				.then(function(user) {
					if (!user || !user.validPassword(password)) {
						return done(null, false, { errors: { invalidCredentials: 'Invalid Email or Password' } });
					}

					return done(null, user);
				})
				.catch(done);
		}
	)
);
