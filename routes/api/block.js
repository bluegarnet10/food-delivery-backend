var mongoose = require('mongoose');
var router = require('express').Router();
var User = mongoose.model('user');
var Block = mongoose.model('block');
var Order = mongoose.model('order');
var History = mongoose.model('order');
var auth = require('../auth');

const DEFAULT_ROW = 5;

router.post('/', auth.required, (req, res, next) => {
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

					try {
						await cancelOrders(owner._id, user._id);
					} catch (e) {
						console.log(e);
					}

					Block.findOne({ owner_id: req.payload.id, user_id: req.body.user_id }).then(result => {
						if (result) {
							return res.status(409).json({ errors: { block: 'The user is already blocked' } });
						}

						var block = new Block();
						block.owner_id = req.payload.id;
						block.user_id = req.body.user_id;
						block.user_name = user.name;
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

router.get('/', auth.required, (req, res, next) => {
	User.findById(req.payload.id)
		.then(async owner => {
			if (!owner) {
				return res.status(401).json({ errors: { user: 'Unauthorized' } });
			}
			if (owner.role !== 'owner') {
				return res.status(401).json({ errors: { user: 'Invalid user role' } });
			}

			const row = parseInt(req.query._row) || DEFAULT_ROW;
			const skipCount = req.query._page && row ? parseInt(req.query._page) * row : 0;
			const findQuery = { owner_id: req.payload.id };
			const sortQuery = {};
			if (req.query._sort) {
				sortQuery[req.query._sort] = req.query._order === 'DESC' ? -1 : 1;
			}

			const total_count = await Block.count(findQuery);
			Block.find(findQuery)
				.sort(sortQuery)
				.skip(skipCount)
				.limit(row)
				.then(blocks => {
					return res
						.status(200)
						.header({
							'X-Total-Count': total_count,
							'Access-Control-Expose-Headers': 'X-Total-Count',
						})
						.json({
							blocks: blocks.map(block => {
								return block.toJSON();
							}),
						});
				})
				.catch(next);
		})
		.catch(next);
});

router.delete('/', auth.required, (req, res, next) => {
	console.log(req.body);
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
