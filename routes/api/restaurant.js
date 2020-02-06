var mongoose = require('mongoose');
var router = require('express').Router();
var User = mongoose.model('user');
var Restaurant = mongoose.model('restaurant');
var Meal = mongoose.model('meal');
var auth = require('../auth');

const DEFAULT_ROW = 5;

router.post('/', auth.required, (req, res, next) => {
	if (!req.body.name) {
		return res.status(422).json({ errors: { message: 'Name is required', name: 'This field is required' } });
	}
	if (!req.body.description) {
		return res
			.status(422)
			.json({ errors: { message: 'Description is required', description: 'This field is required' } });
	}

	User.findById(req.payload.id)
		.then(owner => {
			if (owner.role !== 'owner') {
				return res.status(403).json({ errors: { message: 'Invalid user role', user: 'Invalid user role' } });
			}

			var restaurant = new Restaurant();
			restaurant.owner_id = req.payload.id;
			restaurant.name = req.body.name;
			restaurant.description = req.body.description;

			restaurant
				.save()
				.then(() => {
					return res.status(200).json({
						message: 'The restaurant has been added successfully',
						restaurant: restaurant.toJSON(),
					});
				})
				.catch(next);
		})
		.catch(e => {
			return res.status(401).json({ errors: { message: 'Unauthroized', user: 'Unauthorized' } });
		});
});

router.get('/', auth.required, (req, res, next) => {
	User.findById(req.payload.id)
		.then(async user => {
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
		.catch(e => {
			return res.status(401).json({ errors: { message: 'Unauthorized', user: 'Unauthorized' } });
		});
});

router.get('/:id', auth.required, (req, res, next) => {
	User.findById(req.payload.id)
		.then(user => {
			Restaurant.findOne({ _id: req.params.id, deleted: false })
				.then(restaurant => {
					return res.status(200).json({ restaurant: restaurant.toJSON() });
				})
				.catch(e => {
					return res.status(404).json({
						errors: { message: 'Restaurant does not exist', restaurant: 'Restaurant does not exist' },
					});
				});
		})
		.catch(e => {
			return res.status(401).json({ errors: { message: 'Unauthorized', user: 'Unauthorized' } });
		});
});

router.put('/:id', auth.required, (req, res, next) => {
	User.findById(req.payload.id)
		.then(user => {
			Restaurant.findOne({ _id: req.params.id, deleted: false })
				.then(restaurant => {
					if (user.role !== 'owner' || restaurant.owner_id !== req.payload.id) {
						return res.status(403).json({
							errors: {
								message: 'You are not the owner of this restaurant',
								user: 'You are not the owner of this restaurant',
							},
						});
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
							return res.status(200).json({
								message: 'The restaurant has been updated successfully',
								restaurant: restaurant.toJSON(),
							});
						})
						.catch(next);
				})
				.catch(e => {
					return res.status(404).json({
						errors: { message: 'Restaurant does not exist', restaurant: 'Restaurant does not exist' },
					});
				});
		})
		.catch(e => {
			return res.status(401).json({ errors: { message: 'Unauthorized', user: 'Unauthorized' } });
		});
});

router.delete('/:id', auth.required, (req, res, next) => {
	User.findById(req.payload.id)
		.then(user => {
			Restaurant.findOne({ _id: req.params.id, deleted: false })
				.then(async restaurant => {
					if (user.role !== 'owner' || restaurant.owner_id !== req.payload.id) {
						return res.status(403).json({
							errors: {
								message: 'You are not the owner of this restaurant',
								user: 'You are not the owner of this restaurant',
							},
						});
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
							return res.status(200).json({ message: 'The restaurant has been removed successfully' });
						})
						.catch(next);
				})
				.catch(e => {
					return res.status(404).json({
						errors: { message: 'Restaurant does not exist', restaurant: 'Restaurant does not exist' },
					});
				});
		})
		.catch(e => {
			return res.status(401).json({ errors: { message: 'Unauthorized', user: 'Unauthorized' } });
		});
});

router.post('/:id/meal', auth.required, (req, res, next) => {
	if (!req.body.name) {
		return res.status(422).json({ errors: { message: 'Name is required', name: 'This field is required' } });
	}
	if (!req.body.description) {
		return res
			.status(422)
			.json({ errors: { message: 'Description is required', description: 'This field is required' } });
	}
	if (!req.body.price) {
		return res.status(422).json({ errors: { message: 'Price is required', price: 'This field is required' } });
	}

	User.findById(req.payload.id)
		.then(user => {
			Restaurant.findOne({ _id: req.params.id, deleted: false })
				.then(restaurant => {
					if (user.role !== 'owner' || restaurant.owner_id !== req.payload.id) {
						return res.status(403).json({
							errors: {
								message: 'You are not the owner of this restaurant',
								user: 'You are not the owner of this restaurant',
							},
						});
					}

					var meal = new Meal();
					meal.restaurant_id = req.params.id;
					meal.name = req.body.name;
					meal.description = req.body.description;
					meal.price = req.body.price;

					meal.save()
						.then(() => {
							return res
								.status(200)
								.json({ message: 'Meal has been added successfully', meal: meal.toJSON() });
						})
						.catch(next);
				})
				.catch(e => {
					return res.status(404).json({
						errors: { message: 'Restaurant does not exist', restaurant: 'Restaurant does not exist' },
					});
				});
		})
		.catch(e => {
			return res.status(401).json({ errors: { message: 'Unauthorized', user: 'Unauthorized' } });
		});
});

router.get('/:id/meal', auth.required, (req, res, next) => {
	User.findById(req.payload.id)
		.then(user => {
			Restaurant.findOne({ _id: req.params.id, deleted: false })
				.then(async restaurant => {
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
				.catch(e => {
					return res.status(404).json({
						errors: { message: 'Restaurant does not exist', restaurant: 'Restaurant does not exist' },
					});
				});
		})
		.catch(e => {
			return res.status(401).json({ errors: { message: 'Unauthorized', user: 'Unauthorized' } });
		});
});

router.get('/:id/meal/:meal_id', auth.required, (req, res, next) => {
	User.findById(req.payload.id)
		.then(user => {
			Restaurant.findOne({ _id: req.params.id, deleted: false })
				.then(restaurant => {
					Meal.findOne({ _id: req.params.meal_id, deleted: false })
						.then(meal => {
							if (meal.restaurant_id !== req.params.id) {
								return res.status(403).json({
									errors: {
										message: 'This meal is not in this restaurant',
										meal: 'This meal is not in this restaurant',
									},
								});
							}
							return res.status(200).json({ meal: meal.toJSON() });
						})
						.catch(e => {
							return res
								.status(404)
								.json({ errors: { message: 'Meal does not exist', meal: 'Meal does not exist' } });
						});
				})
				.catch(e => {
					return res.status(404).json({
						errors: { message: 'Restaurant does not exist', restaurant: 'Restaurant does not exist' },
					});
				});
		})
		.catch(e => {
			return res.status(401).json({ errors: { message: 'Unauthorized', user: 'Unauthorized' } });
		});
});

router.put('/:id/meal/:meal_id', auth.required, (req, res, next) => {
	User.findById(req.payload.id)
		.then(user => {
			Restaurant.findOne({ _id: req.params.id, deleted: false })
				.then(restaurant => {
					if (user.role !== 'owner' || restaurant.owner_id !== req.payload.id) {
						return res.status(403).json({
							errors: {
								message: 'You are not the owner of this restaurant',
								user: 'You are not the owner of this restaurant',
							},
						});
					}

					Meal.findOne({ _id: req.params.meal_id, deleted: false })
						.then(meal => {
							if (meal.restaurant_id !== req.params.id) {
								return res.status(403).json({
									errors: {
										message: 'This meal is not in this restaurant',
										meal: 'This meal is not in this restaurant',
									},
								});
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
									return res
										.status(200)
										.json({ message: 'Meal has been updated successfully', meal: meal.toJSON() });
								})
								.catch(next);
						})
						.catch(e => {
							return res
								.status(404)
								.json({ errors: { message: 'Meal does not exist', meal: 'Meal does not exist' } });
						});
				})
				.catch(e => {
					return res.status(404).json({
						errors: { message: 'Restaurant does not exist', restaurant: 'Restaurant does not exist' },
					});
				});
		})
		.catch(e => {
			return res.status(401).json({ errors: { message: 'Unauthorized', user: 'Unauthorized' } });
		});
});

router.delete('/:id/meal/:meal_id', auth.required, (req, res, next) => {
	User.findById(req.payload.id)
		.then(user => {
			Restaurant.findOne({ _id: req.params.id, deleted: false })
				.then(restaurant => {
					if (user.role !== 'owner' || restaurant.owner_id !== req.payload.id) {
						return res.status(403).json({
							errors: {
								message: 'You are not the owner of this restaurant',
								user: 'You are not the owner of this restaurant',
							},
						});
					}

					Meal.findOne({ _id: req.params.meal_id, deleted: false })
						.then(async meal => {
							if (meal.restaurant_id !== req.params.id) {
								return res.status(403).json({
									errors: {
										message: 'This meal is not in this restaurant',
										meal: 'This meal is not in this restaurant',
									},
								});
							}

							try {
								await cancelOrders(restaurant._id, meal._id);
							} catch (e) {
								console.log(e);
							}

							meal.deleted = true;
							meal.save()
								.then(() => {
									return res.status(200).json({ message: 'The meal has been removed successfully' });
								})
								.catch(next);
						})
						.catch(e => {
							return res
								.status(404)
								.json({ errors: { message: 'Meal does not exist', meal: 'Meal does not exist' } });
						});
				})
				.catch(e => {
					return res.status(404).json({
						errors: { message: 'Restaurant does not exist', restaurant: 'Restaurant does not exist' },
					});
				});
		})
		.catch(e => {
			return res.status(401).json({ errors: { message: 'Unauthorized', user: 'Unauthorized' } });
		});
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
