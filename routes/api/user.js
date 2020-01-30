var mongoose = require('mongoose');
var router = require('express').Router();
var passport = require('passport');
var User = mongoose.model('user');
var Block = mongoose.model('block');
var Order = mongoose.model('order');
var History = mongoose.model('order');
var auth = require('../auth');

router.post('/signin', (req, res, next) => {
	if (!req.body.email) {
		return res.status(422).json({ errors: { email: 'This field is required' } });
	}
	if (!req.body.password) {
		return res.status(422).json({ errors: { password: 'This field is required' } });
	}

	passport.authenticate('local', { session: false }, (err, user, info) => {
		if (err) {
			return next(err);
		}

		if (user) {
			return res.status(200).json({ user: user.toJSON() });
		} else {
			return res.status(422).json({ errors: { invalidCredentials: 'Invalid Email or Password' } });
		}
	})(req, res, next);
});

router.post('/signup', (req, res, next) => {
	if (!req.body.email) {
		return res.status(422).json({ errors: { email: 'This field is required' } });
	}
	if (!req.body.password) {
		return res.status(422).json({ errors: { password: 'This field is required' } });
	}
	if (!req.body.full_name) {
		return res.status(422).json({ errors: { full_name: 'This field is required' } });
	}
	if (req.body.role !== 'user' && req.body.role !== 'owner') {
		return res.status(422).json({ errors: { role: 'Invalid role' } });
	}

	User.findOne({ email: req.body.email })
		.then(result => {
			if (result) {
				return res.status(409).json({ errors: { email: 'Email is already taken' } });
			}

			var user = new User();
			user.email = req.body.email;
			user.setPassword(req.body.password);
			user.full_name = req.body.full_name;
			user.role = req.body.role;

			user.save()
				.then(() => {
					return res.status(200).json({ user: user.toJSON() });
				})
				.catch(next);
		})
		.catch(next);
});

router.get('/user', auth.required, (req, res, next) => {
	User.findById(req.payload.id)
		.then(user => {
			if (!user) {
				return res.status(401).json({ errors: { user: 'Unauthorized' } });
			}
			return res.status(200).json({ user: user.toUserJSON() });
		})
		.catch(next);
});

router.post('/block', auth.required, (req, res, next) => {
	if (!req.body.user_id) {
		return res.status(422).json({ errors: { user: 'This field is required' } });
	}

	User.findById(req.payload.id)
		.then(owner => {
			if (!owner) {
				return res.status(401).json({ errors: { user: 'Unauthorized' } });
			}
			if (owner.role !== 'owner') {
				return res.status(401).json({ errors: { user: 'Invalid user role' } });
			}

			User.findById(req.body.user_id)
				.then(async user => {
					if (!user) {
						return res.status(404).json({ errors: { user: 'Invalid user id' } });
					}
					if (user.role !== 'user') {
						return res.status(401).json({ errors: { user: 'Invalid user role' } });
					}

					await cancelOrders(owner._id, user._id);

					Block.findOne({ owner_id: req.payload.id, user_id: req.body.user_id }).then(result => {
						if (result) {
							return res.status(409).json({ errors: { block: 'The user is already blocked' } });
						}

						var block = new Block();
						block.owner_id = req.payload.id;
						block.user_id = req.body.user_id;
						block
							.save()
							.then(() => {
								return res.status(200).json({ success: 'The user has been blocked' });
							})
							.catch(next);
					});
				})
				.catch(next);
		})
		.catch(next);
});

router.post('/unblock', auth.required, (req, res, next) => {
	if (!req.body.user_id) {
		return res.status(422).json({ errors: { user: 'This field is required' } });
	}

	User.findById(req.payload.id)
		.then(async owner => {
			if (!owner) {
				return res.status(401).json({ errors: { user: 'Unauthorized' } });
			}
			if (owner.role !== 'owner') {
				return res.status(401).json({ errors: { user: 'Invalid user role' } });
			}

			Block.findOne({ owner_id: req.payload.id, user_id: req.body.user_id }).then(result => {
				if (!result) {
					return res.status(401).json({ errors: { block: 'The user is already unblocked' } });
				}

				Block.remove({ owner_id: req.payload.id, user_id: req.body.user_id })
					.then(() => {
						return res.status(200).json({ success: 'The user has been unblocked' });
					})
					.catch(next);
			});
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
