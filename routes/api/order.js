var mongoose = require('mongoose');
var router = require('express').Router();
var User = mongoose.model('user');
var Block = mongoose.model('block');
var Restaurant = mongoose.model('restaurant');
var Meal = mongoose.model('meal');
var Order = mongoose.model('order');
var History = mongoose.model('history');
var auth = require('../auth');

const DEFAULT_ROW = 10;

router.post('/', auth.required, (req, res, next) => {
	if (!req.body.restaurant_id) {
		return res.status(422).json({ errors: { restaurant: 'This field is required' } });
	}
	if (!req.body.meal_list || req.body.meal_list.length === 0) {
		return res.status(422).json({ errors: { meal_list: 'This field is required' } });
	}

	User.findById(req.payload.id)
		.then(async user => {
			if (!user) {
				return res.status(401).json({ errors: { user: 'Unauthorized' } });
			}
			if (user.role !== 'user') {
				return res.status(401).json({ errors: { user: 'Invalid user role' } });
			}

			const restaurant = await Restaurant.findOne({ _id: req.body.restaurant_id, deleted: false });
			if (!restaurant) {
				return res.status(404).json({ errors: { restaurant: 'Restaurant does not exist' } });
			}

			const owner = await User.findById(restaurant.owner_id);
			if (!owner) {
				return res.status(404).json({ errors: { user: 'Restaurant owner does not exist' } });
			}

			const block = await Block.findOne({ owner_id: owner._id, user_id: user._id });
			if (block) {
				return res.status(401).json({ errors: { user: 'You are blocked to this restaurant' } });
			}

			var total_price = 0;
			var meal_list = [];
			const meals = await Meal.find({ restaurant_id: req.body.restaurant_id, deleted: false });
			for (let i = 0; i < req.body.meal_list.length; i++) {
				const meal = meals.find(m => m._id.toString() === req.body.meal_list[i]);
				if (!meal) {
					return res.status(404).json({ errors: { meal: 'Meal does not exist in this restaurant' } });
				}
				meal_list.push({ meal_id: meal._id, price: meal.price });
				total_price += meal.price;
			}

			var order = new Order();
			order.user_id = user._id;
			order.owner_id = owner._id;
			order.restaurant_id = restaurant._id;
			order.meal_list = meal_list;
			order.total_price = total_price;

			await updateStatus(order, 'Placed');
			await order.save();
			const histories = await History.find({ order_id: order._id });

			return res.status(200).json({
				order: {
					...order.toJSON(),
					history: histories.map(history => history.toJSON()),
				},
			});
		})
		.catch(next);
});

router.get('/', auth.required, (req, res, next) => {
	User.findById(req.payload.id)
		.then(async user => {
			if (!user) {
				return res.status(401).json({ errors: { user: 'Unauthorized' } });
			}

			const row = parseInt(req.query._row) || DEFAULT_ROW;
			const skipCount = req.query._page && row ? parseInt(req.query._page) * row : 0;
			const findQuery = user.role === 'user' ? { user_id: req.payload.id } : { owner_id: req.payload.id };
			const sortQuery = {};
			if (req.query._sort) {
				sortQuery[req.query._sort] = req.query._order === 'DESC' ? -1 : 1;
			}

			const total_count = await Order.count(findQuery);
			Order.find(findQuery)
				.sort(sortQuery)
				.skip(skipCount)
				.limit(row)
				.then(orders => {
					return res
						.status(200)
						.header({
							'X-Total-Count': total_count,
							'Access-Control-Expose-Headers': 'X-Total-Count',
						})
						.json({
							orders: orders.map(async order => {
								const histories = await History.find({ order_id: order._id });
								return {
									...order.toJSON(),
									history: histories.map(history => history.toJSON()),
								};
							}),
						});
				})
				.catch(next);
		})
		.catch(next);
});

router.get('/:id', auth.required, (req, res, next) => {
	User.findById(req.payload.id)
		.then(async user => {
			if (!user) {
				return res.status(401).json({ errors: { user: 'Unauthorized' } });
			}

			const findQuery =
				user.role === 'user'
					? {
							user_id: req.payload.id,
							_id: req.params.id,
					  }
					: {
							owner_id: req.payload.id,
							_id: req.params.id,
					  };

			Order.findOne(findQuery)
				.then(async order => {
					if (!order) {
						return res.status(401).json({ errors: { order: 'Order does not exist' } });
					}

					const histories = await History.find({ order_id: order._id });

					return res.status(200).json({
						order: {
							...order.toJSON(),
							history: histories.map(history => history.toJSON()),
						},
					});
				})
				.catch(next);
		})
		.catch(next);
});

router.put('/:id', auth.required, (req, res, next) => {
	if (!req.body.status) {
		return res.status(422).json({ errors: { status: 'This field is required' } });
	}

	User.findById(req.payload.id)
		.then(async user => {
			if (!user) {
				return res.status(401).json({ errors: { user: 'Unauthorized' } });
			}

			const findQuery =
				user.role === 'user'
					? {
							user_id: req.payload.id,
							_id: req.params.id,
					  }
					: {
							owner_id: req.payload.id,
							_id: req.params.id,
					  };

			Order.findOne(findQuery)
				.then(async order => {
					if (!order) {
						return res.status(404).json({ errors: { order: 'Order does not exist' } });
					}

					if (user.role === 'user' && req.body.status === 'Canceled' && order.status === 'Placed') {
						await updateStatus(order, req.body.status);
					} else if (user.role === 'owner' && req.body.status === 'Processing' && order.status === 'Placed') {
						await updateStatus(order, req.body.status);
					} else if (
						user.role === 'owner' &&
						req.body.status === 'In Route' &&
						order.status === 'Processing'
					) {
						await updateStatus(order, req.body.status);
					} else if (
						user.role === 'owner' &&
						req.body.status === 'Delivered' &&
						order.status === 'In Route'
					) {
						await updateStatus(order, req.body.status);
					} else if (user.role === 'user' && req.body.status === 'Received' && order.status === 'Delivered') {
						await updateStatus(order, req.body.status);
					} else {
						return res.status(422).json({ errors: { order: 'Invalid status' } });
					}

					order
						.save()
						.then(async () => {
							const histories = await History.find({ order_id: order._id });
							return res.status(200).json({
								order: {
									...order.toJSON(),
									history: histories.map(history => history.toJSON()),
								},
							});
						})
						.catch(next);
				})
				.catch(next);
		})
		.catch(next);
});

updateStatus = async (order, status) => {
	order.status = status;

	var history = new History();
	history.order_id = order._id;
	history.status = status;
	await history.save();
};

module.exports = router;
