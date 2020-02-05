var mongoose = require('mongoose');
var router = require('express').Router();
var passport = require('passport');
var User = mongoose.model('user');
var Order = mongoose.model('order');
var History = mongoose.model('order');
var auth = require('../auth');

router.post('/signin', (req, res, next) => {
	if (!req.body.email) {
		return res.status(422).json({ errors: { message: 'Email is required', email: 'This field is required' } });
	}
	if (!req.body.password) {
		return res
			.status(422)
			.json({ errors: { message: 'Password is required', password: 'This field is required' } });
	}

	passport.authenticate('local', { session: false }, (err, user, info) => {
		if (err) {
			return next(err);
		}

		if (user) {
			return res.status(200).json({ user: user.toJSON() });
		} else {
			return res.status(422).json({
				errors: { message: 'Invalid Email or Password', invalidCredentials: 'Invalid Email or Password' },
			});
		}
	})(req, res, next);
});

router.post('/signup', (req, res, next) => {
	if (!req.body.email) {
		return res.status(422).json({ errors: { message: 'Email is required', email: 'This field is required' } });
	}
	if (!req.body.password) {
		return res
			.status(422)
			.json({ errors: { message: 'Password is required', password: 'This field is required' } });
	}
	if (!req.body.name) {
		return res.status(422).json({ errors: { message: 'Name is required', name: 'This field is required' } });
	}
	if (req.body.role !== 'user' && req.body.role !== 'owner') {
		return res.status(422).json({ errors: { message: 'Invalid user role', role: 'Invalid role' } });
	}

	User.findOne({ email: req.body.email })
		.then(result => {
			if (result) {
				return res
					.status(409)
					.json({ errors: { message: 'Email is alrady taken', email: 'Email is already taken' } });
			}

			var user = new User();
			user.email = req.body.email;
			user.setPassword(req.body.password);
			user.name = req.body.name;
			user.role = req.body.role;

			user.save()
				.then(() => {
					return res.status(200).json({ user: user.toUserJSON() });
				})
				.catch(next);
		})
		.catch(next);
});

router.get('/user', auth.required, (req, res, next) => {
	User.findById(req.payload.id)
		.then(user => {
			if (!user) {
				return res.status(401).json({ errors: { message: 'Unauthroized', user: 'Unauthorized' } });
			}
			return res.status(200).json({ user: user.toUserJSON() });
		})
		.catch(next);
});

cancelOrders = async (owner_id, user_id) => {
	orders = await Order.find({ owner_id, user_id, status: 'Placed' });
	orders.map(order => {
		// TODO: Refund the money if the user is blocked by the restaurant
		order.status = 'Canceled';
		order.save();

		var history = new History();
		history.order_id = order._id;
		history.status = 'Canceled';
		history.save();
	});
};

module.exports = router;
