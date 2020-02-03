var mongoose = require('mongoose');
var router = require('express').Router();
var User = mongoose.model('user');
var Restaurant = mongoose.model('restaurant');
var Meal = mongoose.model('meal');
var auth = require('../auth');

const DEFAULT_ROW = 5;

router.post('/', auth.required, (req, res, next) => {
	if (!req.body.name) {
		return res.status(422).json({ errors: { name: 'This field is required' } });
	}
	if (!req.body.description) {
		return res.status(422).json({ errors: { description: 'This field is required' } });
	}

	User.findById(req.payload.id)
		.then(owner => {
			if (!owner) {
				return res.status(401).json({ errors: { user: 'Unauthorized' } });
			}
			if (owner.role !== 'owner') {
				return res.status(401).json({ errors: { user: 'Invalid user role' } });
			}

			var restaurant = new Restaurant();
			restaurant.owner_id = req.payload.id;
			restaurant.name = req.body.name;
			restaurant.description = req.body.description;

			restaurant
				.save()
				.then(() => {
					return res.status(200).json({ restaurant: restaurant.toJSON() });
				})
				.catch(next);
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
			const findQuery = user.role === 'user' ? { deleted: false } : { owner_id: req.payload.id, deleted: false };
			const sortQuery = {};
			if (req.query._sort) {
				sortQuery[req.query._sort] = req.query._order === 'DESC' ? -1 : 1;
			}

			const total_count = await Restaurant.count(findQuery);
			Restaurant.find(findQuery)
				.sort(sortQuery)
				.skip(skipCount)
				.limit(row)
				.then(restaurants => {
					return res
						.status(200)
						.header({
							'X-Total-Count': total_count,
							'Access-Control-Expose-Headers': 'X-Total-Count',
						})
						.json({
							restaurants: restaurants.map(restaurant => {
								return restaurant.toJSON();
							}),
						});
				})
				.catch(next);
		})
		.catch(next);
});

router.get('/:id', auth.required, (req, res, next) => {
	User.findById(req.payload.id)
		.then(user => {
			if (!user) {
				return res.status(401).json({ errors: { user: 'Unauthorized' } });
			}

			Restaurant.findById(req.params.id)
				.then(restaurant => {
					if (!restaurant) {
						return res.status(401).json({ errors: { restaurant: 'Restaurant does not exist' } });
					}
					if (user.role === 'owner' && restaurant.owner_id !== req.payload.id) {
						return res
							.status(401)
							.json({ errors: { restaurant: 'You are not the owner of this restaurant' } });
					}

					return res.status(200).json({ restaurant: restaurant.toJSON() });
				})
				.catch(next);
		})
		.catch(next);
});

router.put('/:id', auth.required, (req, res, next) => {
	User.findById(req.payload.id)
		.then(user => {
			if (!user) {
				return res.status(401).json({ errors: { user: 'Unauthorized' } });
			}

			Restaurant.findOne({ _id: req.params.id, deleted: false })
				.then(restaurant => {
					if (!restaurant) {
						return res.status(401).json({ errors: { restaurant: 'Restaurant does not exist' } });
					}
					if (user.role !== 'owner' || restaurant.owner_id !== req.payload.id) {
						return res
							.status(401)
							.json({ errors: { restaurant: 'You are not the owner of this restaurant' } });
					}

					if (req.body.name) {
						restaurant.name = req.body.name;
					}
					if (req.body.description) {
						restaurant.description = req.body.description;
					}
					restaurant
						.save()
						.then(() => {
							return res.status(200).json({ restaurant: restaurant.toJSON() });
						})
						.catch(next);
				})
				.catch(next);
		})
		.catch(next);
});

router.delete('/:id', auth.required, (req, res, next) => {
	User.findById(req.payload.id)
		.then(user => {
			if (!user) {
				return res.status(401).json({ errors: { user: 'Unauthorized' } });
			}

			Restaurant.findById(req.params.id)
				.then(async restaurant => {
					if (!restaurant) {
						return res.status(401).json({ errors: { restaurant: 'Restaurant does not exist' } });
					}
					if (user.role !== 'owner' || restaurant.owner_id !== req.payload.id) {
						return res
							.status(401)
							.json({ errors: { restaurant: 'You are not the owner of this restaurant' } });
					}

					try {
						await Meals.update({ restaurant_id: restaurant._id }, { deleted: true }, { multi: true });
					} catch (e) {
						console.log(e);
					}
					try {
						await cancelOrders(restaurant_id);
					} catch (e) {
						console.log(e);
					}

					restaurant.deleted = true;
					restaurant
						.save()
						.then(() => {
							return res.status(200).json({ success: 'The restaurant has been removed successfully' });
						})
						.catch(next);
				})
				.catch(next);
		})
		.catch(next);
});

router.post('/:id/meal', auth.required, (req, res, next) => {
	if (!req.body.name) {
		return res.status(422).json({ errors: { name: 'This field is required' } });
	}
	if (!req.body.description) {
		return res.status(422).json({ errors: { description: 'This field is required' } });
	}
	if (!req.body.price) {
		return res.status(422).json({ errors: { price: 'This field is required' } });
	}

	User.findById(req.payload.id)
		.then(user => {
			if (!user) {
				return res.status(401).json({ errors: { user: 'Unauthorized' } });
			}

			Restaurant.findOne({ _id: req.params.id, deleted: false })
				.then(restaurant => {
					if (!restaurant) {
						return res.status(401).json({ errors: { restaurant: 'Restaurant does not exist' } });
					}
					if (user.role === 'owner' && restaurant.owner_id !== req.payload.id) {
						return res
							.status(401)
							.json({ errors: { restaurant: 'You are not the owner of this restaurant' } });
					}

					var meal = new Meal();
					meal.restaurant_id = req.params.id;
					meal.name = req.body.name;
					meal.description = req.body.description;
					meal.price = req.body.price;

					meal.save()
						.then(() => {
							return res.status(200).json({ meal: meal.toJSON() });
						})
						.catch(next);
				})
				.catch(next);
		})
		.catch(next);
});

router.get('/:id/meal', auth.required, (req, res, next) => {
	User.findById(req.payload.id)
		.then(user => {
			if (!user) {
				return res.status(401).json({ errors: { user: 'Unauthorized' } });
			}

			Restaurant.findOne({ _id: req.params.id, deleted: false })
				.then(async restaurant => {
					if (!restaurant) {
						return res.status(401).json({ errors: { restaurant: 'Restaurant does not exist' } });
					}
					if (user.role === 'owner' && restaurant.owner_id !== req.payload.id) {
						return res
							.status(401)
							.json({ errors: { restaurant: 'You are not the owner of this restaurant' } });
					}

					const row = parseInt(req.query._row) || DEFAULT_ROW;
					const skipCount = req.query._page && row ? parseInt(req.query._page) * row : 0;
					const findQuery = { restaurant_id: req.params.id, deleted: false };
					const sortQuery = {};
					if (req.query._sort) {
						sortQuery[req.query._sort] = req.query._order === 'DESC' ? -1 : 1;
					}

					const total_count = await Meal.count(findQuery);
					Meal.find(findQuery)
						.sort(sortQuery)
						.skip(skipCount)
						.limit(row)
						.then(meals => {
							return res
								.status(200)
								.header({
									'X-Total-Count': total_count,
									'Access-Control-Expose-Headers': 'X-Total-Count',
								})
								.json({
									meals: meals.map(meal => {
										return meal.toJSON();
									}),
								});
						})
						.catch(next);
				})
				.catch(next);
		})
		.catch(next);
});

router.get('/:id/meal/:meal_id', auth.required, (req, res, next) => {
	User.findById(req.payload.id)
		.then(user => {
			if (!user) {
				return res.status(401).json({ errors: { user: 'Unauthorized' } });
			}

			Restaurant.findById(req.params.id)
				.then(restaurant => {
					if (!restaurant) {
						return res.status(401).json({ errors: { restaurant: 'Restaurant does not exist' } });
					}
					if (user.role === 'owner' && restaurant.owner_id !== req.payload.id) {
						return res
							.status(401)
							.json({ errors: { restaurant: 'You are not the owner of this restaurant' } });
					}

					Meal.findById(req.params.meal_id)
						.then(meal => {
							if (!meal) {
								return res.status(401).json({ errors: { meal: 'Meal does not exist' } });
							}
							if (meal.restaurant_id !== req.params.id) {
								return res
									.status(401)
									.json({ errors: { meal: 'This meal is not in this restaurant' } });
							}
							return res.status(200).json({ meal: meal.toJSON() });
						})
						.catch(next);
				})
				.catch(next);
		})
		.catch(next);
});

router.put('/:id/meal/:meal_id', auth.required, (req, res, next) => {
	User.findById(req.payload.id)
		.then(user => {
			if (!user) {
				return res.status(401).json({ errors: { user: 'Unauthorized' } });
			}

			Restaurant.findOne({ _id: req.params.id, deleted: false })
				.then(restaurant => {
					if (!restaurant) {
						return res.status(401).json({ errors: { restaurant: 'Restaurant does not exist' } });
					}
					if (user.role === 'owner' && restaurant.owner_id !== req.payload.id) {
						return res
							.status(401)
							.json({ errors: { restaurant: 'You are not the owner of this restaurant' } });
					}

					Meal.findOne({ _id: req.params.meal_id, deleted: false })
						.then(meal => {
							if (!meal) {
								return res.status(401).json({ errors: { meal: 'Meal does not exist' } });
							}
							if (meal.restaurant_id !== req.params.id) {
								return res
									.status(401)
									.json({ errors: { meal: 'This meal is not in this restaurant' } });
							}

							if (req.body.name) {
								meal.name = req.body.name;
							}
							if (req.body.description) {
								meal.description = req.body.description;
							}
							if (req.body.price) {
								meal.price = req.body.price;
							}
							meal.save()
								.then(() => {
									return res.status(200).json({ meal: meal.toJSON() });
								})
								.catch(next);
						})
						.catch(next);
				})
				.catch(next);
		})
		.catch(next);
});

router.delete('/:id/meal/:meal_id', auth.required, (req, res, next) => {
	User.findById(req.payload.id)
		.then(user => {
			if (!user) {
				return res.status(401).json({ errors: { user: 'Unauthorized' } });
			}

			Restaurant.findById(req.params.id)
				.then(restaurant => {
					if (!restaurant) {
						return res.status(401).json({ errors: { restaurant: 'Restaurant does not exist' } });
					}
					if (user.role === 'owner' && restaurant.owner_id !== req.payload.id) {
						return res
							.status(401)
							.json({ errors: { restaurant: 'You are not the owner of this restaurant' } });
					}

					Meal.findById(req.params.meal_id)
						.then(async meal => {
							if (!meal) {
								return res.status(401).json({ errors: { meal: 'Meal does not exist' } });
							}
							if (meal.restaurant_id !== req.params.id) {
								return res
									.status(401)
									.json({ errors: { meal: 'This meal is not in this restaurant' } });
							}

							try {
								await cancelOrders(restaurant._id, meal._id);
							} catch (e) {
								console.log(e);
							}

							meal.deleted = true;
							meal.save()
								.then(() => {
									return res.status(200).json({ success: 'The meal is removed successfully' });
								})
								.catch(next);
						})
						.catch(next);
				})
				.catch(next);
		})
		.catch(next);
});

cancelOrders = async (restaurant_id, meal_id = null) => {
	orders = await Order.find({ restaurant_id });
	orders.map(order => {
		if (order.status === 'Canceled' || order.status === 'Received') {
			return;
		}
		if (meal_id && order.meal_list.findIndex(meal => meal.meal_id === meal_id) === -1) {
			return;
		}

		// TODO: Refund the money to the user
		order.status = 'Canceled';
		order.save();

		var history = new History();
		history.order_id = order._id;
		history.status = 'Canceled';
		history.save();
	});
};

module.exports = router;
