process.env.NODE_ENV = 'test';

var mongoose = require('mongoose'),
	chai = require('chai'),
	chaiHTTP = require('chai-http');

chai.use(chaiHTTP);
chai.config.includeStack = true;

var should = chai.should(),
	assert = chai.assert,
	expect = chai.expect;

var app = require('../app');
var User = mongoose.model('user');
var Block = mongoose.model('block');
var Restaurant = mongoose.model('restaurant');
var Meal = mongoose.model('meal');
var Order = mongoose.model('order');
var History = mongoose.model('history');
var OrderMeal = mongoose.model('order_meal');

const server = 'http://localhost:3000/api';

mongoose.set('debug', false);

var user_token = '';
var user_id = '';
var owner_token = '';
var owner_id = '';
var restaurants = [];
var meals = [];
var orders = [];

describe('User API', function() {
	User.collection.drop();

	it('should sign up a user on /signup POST', function(done) {
		chai.request(server)
			.post('/signup')
			.send({ email: 'user1@mail.com', password: 'a', name: 'User 1', role: 'user' })
			.end(function(err, res) {
				res.should.have.status(200);
				res.should.be.json;
				res.body.should.be.a('object');
				res.body.should.have.property('user');
				res.body.user.should.be.a('object');
				res.body.user.should.have.property('_id');
				res.body.user.should.have.property('email');
				res.body.user.should.have.property('name');
				res.body.user.should.have.property('role');
				expect(res.body.user.email).to.equal('user1@mail.com');
				expect(res.body.user.name).to.equal('User 1');
				expect(res.body.user.role).to.equal('user');
				done();
			});
	});

	it('should return error message "Email is already taken" /signup POST', function(done) {
		chai.request(server)
			.post('/signup')
			.send({ email: 'user1@mail.com', password: 'a', name: 'User 1', role: 'user' })
			.end(function(err, res) {
				res.should.have.status(409);
				res.should.be.json;
				res.body.should.be.a('object');
				res.body.should.have.property('errors');
				res.body.errors.should.be.a('object');
				res.body.errors.should.have.property('message');
				expect(res.body.errors.message).to.equal('Email is already taken');
				res.body.errors.should.have.property('email');
				expect(res.body.errors.email).to.equal('Email is already taken');
				done();
			});
	});

	it('should return error message "Invalid user role" /signup POST', function(done) {
		chai.request(server)
			.post('/signup')
			.send({ email: 'owner1@mail.com', password: 'a', name: 'Owner 1', role: 'owner1' })
			.end(function(err, res) {
				res.should.have.status(422);
				res.should.be.json;
				res.body.should.be.a('object');
				res.body.should.have.property('errors');
				res.body.errors.should.be.a('object');
				res.body.errors.should.have.property('message');
				expect(res.body.errors.message).to.equal('Invalid user role');
				res.body.errors.should.have.property('role');
				expect(res.body.errors.role).to.equal('Invalid user role');
				done();
			});
	});

	it('should sign up a user on /signup POST', function(done) {
		chai.request(server)
			.post('/signup')
			.send({ email: 'owner1@mail.com', password: 'a', name: 'Owner 1', role: 'owner' })
			.end(function(err, res) {
				res.should.have.status(200);
				res.should.be.json;
				res.body.should.be.a('object');
				res.body.should.have.property('user');
				res.body.user.should.be.a('object');
				res.body.user.should.have.property('_id');
				res.body.user.should.have.property('email');
				res.body.user.should.have.property('name');
				res.body.user.should.have.property('role');
				expect(res.body.user.email).to.equal('owner1@mail.com');
				expect(res.body.user.name).to.equal('Owner 1');
				expect(res.body.user.role).to.equal('owner');
				done();
			});
	});

	it('should return error message "Invalid Email or Password" /signin POST', function(done) {
		chai.request(server)
			.post('/signin')
			.send({ email: 'owner1@mail.com', password: 'b' })
			.end(function(err, res) {
				res.should.have.status(401);
				res.should.be.json;
				res.body.should.be.a('object');
				res.body.should.have.property('errors');
				res.body.errors.should.be.a('object');
				res.body.errors.should.have.property('message');
				expect(res.body.errors.message).to.equal('Invalid Email or Password');
				res.body.errors.should.have.property('invalidCredentials');
				expect(res.body.errors.invalidCredentials).to.equal('Invalid Email or Password');
				done();
			});
	});

	it('should sign in a user on /signin POST', function(done) {
		chai.request(server)
			.post('/signin')
			.send({ email: 'owner1@mail.com', password: 'a' })
			.end(function(err, res) {
				res.should.have.status(200);
				res.should.be.json;
				res.body.should.be.a('object');
				res.body.should.have.property('user');
				res.body.user.should.be.a('object');
				res.body.user.should.have.property('_id');
				res.body.user.should.have.property('email');
				res.body.user.should.have.property('name');
				res.body.user.should.have.property('role');
				res.body.user.should.have.property('token');
				expect(res.body.user.email).to.equal('owner1@mail.com');
				expect(res.body.user.name).to.equal('Owner 1');
				expect(res.body.user.role).to.equal('owner');
				owner_token = res.body.user.token;
				owner_id = res.body.user._id;
				done();
			});
	});

	it('should sign in a user on /signin POST', function(done) {
		chai.request(server)
			.post('/signin')
			.send({ email: 'user1@mail.com', password: 'a' })
			.end(function(err, res) {
				res.should.have.status(200);
				res.should.be.json;
				res.body.should.be.a('object');
				res.body.should.have.property('user');
				res.body.user.should.be.a('object');
				res.body.user.should.have.property('_id');
				res.body.user.should.have.property('email');
				res.body.user.should.have.property('name');
				res.body.user.should.have.property('role');
				res.body.user.should.have.property('token');
				expect(res.body.user.email).to.equal('user1@mail.com');
				expect(res.body.user.name).to.equal('User 1');
				expect(res.body.user.role).to.equal('user');
				user_token = res.body.user.token;
				user_id = res.body.user._id;
				done();
			});
	});
});

describe('Block API', function() {
	Block.collection.drop();

	it('should return error message "Invalid user role" /block POST', function(done) {
		chai.request(server)
			.post('/block')
			.set('Authorization', `Bearer ${user_token}`)
			.send({ user_id: owner_id })
			.end(function(err, res) {
				res.should.have.status(403);
				res.should.be.json;
				res.body.should.be.a('object');
				res.body.should.have.property('errors');
				res.body.errors.should.be.a('object');
				res.body.errors.should.have.property('message');
				expect(res.body.errors.message).to.equal('Invalid user role');
				res.body.errors.should.have.property('user');
				expect(res.body.errors.user).to.equal('Invalid user role');
				done();
			});
	});

	it('should return error message "Invalid user role" /block POST', function(done) {
		chai.request(server)
			.post('/block')
			.set('Authorization', `Bearer ${owner_token}`)
			.send({ user_id: owner_id })
			.end(function(err, res) {
				res.should.have.status(403);
				res.should.be.json;
				res.body.should.be.a('object');
				res.body.should.have.property('errors');
				res.body.errors.should.be.a('object');
				res.body.errors.should.have.property('message');
				expect(res.body.errors.message).to.equal('Invalid user role');
				res.body.errors.should.have.property('user');
				expect(res.body.errors.user).to.equal('Invalid user role');
				done();
			});
	});

	it('should block a user /block POST', function(done) {
		chai.request(server)
			.post('/block')
			.set('Authorization', `Bearer ${owner_token}`)
			.send({ user_id })
			.end(function(err, res) {
				res.should.have.status(200);
				res.should.be.json;
				res.body.should.be.a('object');
				res.body.should.have.property('message');
				expect(res.body.message).to.equal('The user has been blocked');
				done();
			});
	});

	it('should get the blocked users on /block GET', function(done) {
		chai.request(server)
			.get('/block')
			.set('Authorization', `Bearer ${owner_token}`)
			.end(function(err, res) {
				res.should.have.status(200);
				res.should.be.json;
				res.body.should.be.a('object');
				res.body.should.have.property('blocks');
				res.body.blocks.should.be.a('array');
				expect(res.body.blocks.length).to.equal(1);
				res.body.blocks[0].should.have.property('owner_id');
				res.body.blocks[0].should.have.property('user_id');
				res.body.blocks[0].should.have.property('user_name');
				expect(res.body.blocks[0].owner_id).to.equal(owner_id);
				expect(res.body.blocks[0].user_id).to.equal(user_id);
				done();
			});
	});

	it('should unblock a user /block DELETE', function(done) {
		chai.request(server)
			.delete('/block')
			.set('Authorization', `Bearer ${owner_token}`)
			.send({ user_id })
			.end(function(err, res) {
				res.should.have.status(200);
				res.should.be.json;
				res.body.should.be.a('object');
				res.body.should.have.property('message');
				expect(res.body.message).to.equal('The user has been unblocked');
				done();
			});
	});
});

describe('Restaurant API', function() {
	Restaurant.collection.drop();

	it('should return error message "No authorization token was found" /restaurant POST', function(done) {
		chai.request(server)
			.post('/restaurant')
			.send({ name: 'Restaurant 1', description: 'Restaurant 1' })
			.end(function(err, res) {
				res.should.have.status(401);
				res.should.be.json;
				res.body.should.be.a('object');
				res.body.should.have.property('errors');
				res.body.errors.should.be.a('object');
				res.body.errors.should.have.property('message');
				expect(res.body.errors.message).to.equal('No authorization token was found');
				done();
			});
	});

	it('should return error message "Invalid user role" on /restaurant POST', function(done) {
		chai.request(server)
			.post('/restaurant')
			.set('Authorization', `Bearer ${user_token}`)
			.send({ name: 'Restaurant 1', description: 'Restaurant 1' })
			.end(function(err, res) {
				res.should.have.status(403);
				res.should.be.json;
				res.body.should.be.a('object');
				res.body.should.have.property('errors');
				res.body.errors.should.be.a('object');
				res.body.errors.should.have.property('message');
				expect(res.body.errors.message).to.equal('Invalid user role');
				res.body.errors.should.have.property('user');
				expect(res.body.errors.user).to.equal('Invalid user role');
				done();
			});
	});

	it('should add a restaurant on /restaurant POST', function(done) {
		chai.request(server)
			.post('/restaurant')
			.set('Authorization', `Bearer ${owner_token}`)
			.send({ name: 'Restaurant 1', description: 'Restaurant 1' })
			.end(function(err, res) {
				res.should.have.status(200);
				res.should.be.json;
				res.body.should.be.a('object');
				res.body.should.have.property('restaurant');
				res.body.restaurant.should.be.a('object');
				res.body.restaurant.should.have.property('_id');
				res.body.restaurant.should.have.property('owner_id');
				res.body.restaurant.should.have.property('name');
				res.body.restaurant.should.have.property('description');
				expect(res.body.restaurant.name).to.equal('Restaurant 1');
				expect(res.body.restaurant.description).to.equal('Restaurant 1');
				done();
			});
	});

	it('should add a restaurant on /restaurant POST', function(done) {
		chai.request(server)
			.post('/restaurant')
			.set('Authorization', `Bearer ${owner_token}`)
			.send({ name: 'Restaurant 2', description: 'Restaurant 2' })
			.end(function(err, res) {
				res.should.have.status(200);
				res.should.be.json;
				res.body.should.be.a('object');
				res.body.should.have.property('restaurant');
				res.body.restaurant.should.be.a('object');
				res.body.restaurant.should.have.property('_id');
				res.body.restaurant.should.have.property('owner_id');
				res.body.restaurant.should.have.property('name');
				res.body.restaurant.should.have.property('description');
				expect(res.body.restaurant.name).to.equal('Restaurant 2');
				expect(res.body.restaurant.description).to.equal('Restaurant 2');
				done();
			});
	});

	it('should get the restaurants on /restaurant GET', function(done) {
		chai.request(server)
			.get('/restaurant')
			.set('Authorization', `Bearer ${owner_token}`)
			.end(function(err, res) {
				res.should.have.status(200);
				res.should.be.json;
				res.body.should.be.a('object');
				res.body.should.have.property('restaurants');
				res.body.restaurants.should.be.a('array');
				expect(res.body.restaurants.length).to.equal(2);
				restaurants = res.body.restaurants;
				done();
			});
	});

	it('should return error message "Restaurant does not exist" on /restaurant/:id PUT', function(done) {
		chai.request(server)
			.put(`/restaurant/1`)
			.set('Authorization', `Bearer ${owner_token}`)
			.send({ name: 'Restaurant 1 - Edited', description: 'Restaurant 1 - Edited' })
			.end(function(err, res) {
				res.should.have.status(404);
				res.should.be.json;
				res.body.should.be.a('object');
				res.body.should.have.property('errors');
				res.body.errors.should.be.a('object');
				res.body.errors.should.have.property('message');
				expect(res.body.errors.message).to.equal('Restaurant does not exist');
				res.body.errors.should.have.property('restaurant');
				expect(res.body.errors.restaurant).to.equal('Restaurant does not exist');
				done();
			});
	});

	it('should return error message "You are not the owner of this restaurant" on /restaurant/:id PUT', function(done) {
		chai.request(server)
			.put(`/restaurant/${restaurants[0]._id}`)
			.set('Authorization', `Bearer ${user_token}`)
			.send({ name: 'Restaurant 1 - Edited', description: 'Restaurant 1 - Edited' })
			.end(function(err, res) {
				res.should.have.status(403);
				res.should.be.json;
				res.body.should.be.a('object');
				res.body.should.have.property('errors');
				res.body.errors.should.be.a('object');
				res.body.errors.should.have.property('message');
				expect(res.body.errors.message).to.equal('You are not the owner of this restaurant');
				res.body.errors.should.have.property('user');
				expect(res.body.errors.user).to.equal('You are not the owner of this restaurant');
				done();
			});
	});

	it('should update the restaurant on /restaurant/:id PUT', function(done) {
		chai.request(server)
			.put(`/restaurant/${restaurants[0]._id}`)
			.set('Authorization', `Bearer ${owner_token}`)
			.send({ name: 'Restaurant 1 - Edited', description: 'Restaurant 1 - Edited' })
			.end(function(err, res) {
				res.should.have.status(200);
				res.should.be.json;
				res.body.should.be.a('object');
				res.body.should.have.property('message');
				res.body.should.have.property('restaurant');
				res.body.restaurant.should.be.a('object');
				res.body.restaurant.should.have.property('_id');
				res.body.restaurant.should.have.property('owner_id');
				res.body.restaurant.should.have.property('name');
				res.body.restaurant.should.have.property('description');
				expect(res.body.restaurant.name).to.equal('Restaurant 1 - Edited');
				expect(res.body.restaurant.description).to.equal('Restaurant 1 - Edited');
				expect(res.body.message).to.equal('The restaurant has been updated successfully');
				done();
			});
	});

	it('should get the restaurant on /restaurant/:id GET', function(done) {
		chai.request(server)
			.get(`/restaurant/${restaurants[0]._id}`)
			.set('Authorization', `Bearer ${owner_token}`)
			.end(function(err, res) {
				res.should.have.status(200);
				res.should.be.json;
				res.body.should.be.a('object');
				res.body.should.have.property('restaurant');
				res.body.restaurant.should.be.a('object');
				res.body.restaurant.should.have.property('_id');
				res.body.restaurant.should.have.property('owner_id');
				res.body.restaurant.should.have.property('name');
				res.body.restaurant.should.have.property('description');
				expect(res.body.restaurant.name).to.equal('Restaurant 1 - Edited');
				expect(res.body.restaurant.description).to.equal('Restaurant 1 - Edited');
				done();
			});
	});

	it('should delete the restaurant on /restaurant/:id DELETE', function(done) {
		chai.request(server)
			.delete(`/restaurant/${restaurants[1]._id}`)
			.set('Authorization', `Bearer ${owner_token}`)
			.end(function(err, res) {
				res.should.have.status(200);
				res.should.be.json;
				res.body.should.be.a('object');
				res.body.should.have.property('message');
				expect(res.body.message).to.equal('The restaurant has been removed successfully');
				done();
			});
	});

	it('should return error message "Restaurant does not exist" on /restaurant/:id GET', function(done) {
		chai.request(server)
			.get(`/restaurant/${restaurants[1]._id}`)
			.set('Authorization', `Bearer ${user_token}`)
			.end(function(err, res) {
				res.should.have.status(404);
				res.should.be.json;
				res.body.should.be.a('object');
				res.body.should.have.property('errors');
				res.body.errors.should.be.a('object');
				res.body.errors.should.have.property('message');
				expect(res.body.errors.message).to.equal('Restaurant does not exist');
				res.body.errors.should.have.property('restaurant');
				expect(res.body.errors.restaurant).to.equal('Restaurant does not exist');
				done();
			});
	});
});

describe('Meal API', function() {
	Meal.collection.drop();

	it('should return error message "Restaurant does not exist" on /restaurant/:id/meal POST', function(done) {
		chai.request(server)
			.post(`/restaurant/${restaurants[1]._id}/meal`)
			.set('Authorization', `Bearer ${owner_token}`)
			.send({ name: 'Meal 1', description: 'Meal 1', price: 100 })
			.end(function(err, res) {
				res.should.have.status(404);
				res.should.be.json;
				res.body.should.be.a('object');
				res.body.should.have.property('errors');
				res.body.errors.should.be.a('object');
				res.body.errors.should.have.property('message');
				expect(res.body.errors.message).to.equal('Restaurant does not exist');
				res.body.errors.should.have.property('restaurant');
				expect(res.body.errors.restaurant).to.equal('Restaurant does not exist');
				done();
			});
	});

	it('should return error message "You are not the owner of this restaurant" on /restaurant/:id/meal POST', function(done) {
		chai.request(server)
			.post(`/restaurant/${restaurants[0]._id}/meal`)
			.set('Authorization', `Bearer ${user_token}`)
			.send({ name: 'Meal 1', description: 'Meal 1', price: 100 })
			.end(function(err, res) {
				res.should.have.status(403);
				res.should.be.json;
				res.body.should.be.a('object');
				res.body.should.have.property('errors');
				res.body.errors.should.be.a('object');
				res.body.errors.should.have.property('message');
				expect(res.body.errors.message).to.equal('You are not the owner of this restaurant');
				res.body.errors.should.have.property('user');
				expect(res.body.errors.user).to.equal('You are not the owner of this restaurant');
				done();
			});
	});

	it('should add a meal on /restaurant/:id/meal POST', function(done) {
		chai.request(server)
			.post(`/restaurant/${restaurants[0]._id}/meal`)
			.set('Authorization', `Bearer ${owner_token}`)
			.send({ name: 'Meal 1', description: 'Meal 1', price: 100 })
			.end(function(err, res) {
				res.should.have.status(200);
				res.should.be.json;
				res.body.should.be.a('object');
				res.body.should.have.property('message');
				expect(res.body.message).to.equal('Meal has been added successfully');
				res.body.should.have.property('meal');
				res.body.meal.should.be.a('object');
				res.body.meal.should.have.property('_id');
				res.body.meal.should.have.property('restaurant_id');
				res.body.meal.should.have.property('name');
				res.body.meal.should.have.property('description');
				res.body.meal.should.have.property('price');
				expect(res.body.meal.restaurant_id).to.equal(restaurants[0]._id);
				expect(res.body.meal.name).to.equal('Meal 1');
				expect(res.body.meal.description).to.equal('Meal 1');
				expect(res.body.meal.price).to.equal(100);
				done();
			});
	});

	it('should add a meal on /restaurant/:id/meal POST', function(done) {
		chai.request(server)
			.post(`/restaurant/${restaurants[0]._id}/meal`)
			.set('Authorization', `Bearer ${owner_token}`)
			.send({ name: 'Meal 2', description: 'Meal 2', price: 200 })
			.end(function(err, res) {
				res.should.have.status(200);
				res.should.be.json;
				res.body.should.be.a('object');
				res.body.should.have.property('message');
				expect(res.body.message).to.equal('Meal has been added successfully');
				res.body.should.have.property('meal');
				res.body.meal.should.be.a('object');
				res.body.meal.should.have.property('_id');
				res.body.meal.should.have.property('restaurant_id');
				res.body.meal.should.have.property('name');
				res.body.meal.should.have.property('description');
				res.body.meal.should.have.property('price');
				expect(res.body.meal.restaurant_id).to.equal(restaurants[0]._id);
				expect(res.body.meal.name).to.equal('Meal 2');
				expect(res.body.meal.description).to.equal('Meal 2');
				expect(res.body.meal.price).to.equal(200);
				done();
			});
	});

	it('should add a meal on /restaurant/:id/meal POST', function(done) {
		chai.request(server)
			.post(`/restaurant/${restaurants[0]._id}/meal`)
			.set('Authorization', `Bearer ${owner_token}`)
			.send({ name: 'Meal 3', description: 'Meal 3', price: 300 })
			.end(function(err, res) {
				res.should.have.status(200);
				res.should.be.json;
				res.body.should.be.a('object');
				res.body.should.have.property('message');
				expect(res.body.message).to.equal('Meal has been added successfully');
				res.body.should.have.property('meal');
				res.body.meal.should.be.a('object');
				res.body.meal.should.have.property('_id');
				res.body.meal.should.have.property('restaurant_id');
				res.body.meal.should.have.property('name');
				res.body.meal.should.have.property('description');
				res.body.meal.should.have.property('price');
				expect(res.body.meal.restaurant_id).to.equal(restaurants[0]._id);
				expect(res.body.meal.name).to.equal('Meal 3');
				expect(res.body.meal.description).to.equal('Meal 3');
				expect(res.body.meal.price).to.equal(300);
				done();
			});
	});

	it('should get the meals on /restaurant/:id/meal GET', function(done) {
		chai.request(server)
			.get(`/restaurant/${restaurants[0]._id}/meal`)
			.set('Authorization', `Bearer ${owner_token}`)
			.end(function(err, res) {
				res.should.have.status(200);
				res.should.be.json;
				res.body.should.be.a('object');
				res.body.should.have.property('meals');
				res.body.meals.should.be.a('array');
				expect(res.body.meals.length).to.equal(3);
				meals = res.body.meals;
				done();
			});
	});

	it('should return error message "Meal does not exist" on /restaurant/:id/meal/:meal_id PUT', function(done) {
		chai.request(server)
			.put(`/restaurant/${restaurants[0]._id}/meal/1`)
			.set('Authorization', `Bearer ${owner_token}`)
			.send({ name: 'Meal 1 - Edited', description: 'Meal 1 - Edited', price: 400 })
			.end(function(err, res) {
				res.should.have.status(404);
				res.should.be.json;
				res.body.should.be.a('object');
				res.body.should.have.property('errors');
				res.body.errors.should.be.a('object');
				res.body.errors.should.have.property('message');
				expect(res.body.errors.message).to.equal('Meal does not exist');
				res.body.errors.should.have.property('meal');
				expect(res.body.errors.meal).to.equal('Meal does not exist');
				done();
			});
	});

	it('should return error message "You are not the owner of this restaurant" on /restaurant/:id/meal/:meal_id PUT', function(done) {
		chai.request(server)
			.put(`/restaurant/${restaurants[0]._id}/meal/${meals[0]._id}`)
			.set('Authorization', `Bearer ${user_token}`)
			.send({ name: 'Meal 1 - Edited', description: 'Meal 1 - Edited', price: 400 })
			.end(function(err, res) {
				res.should.have.status(403);
				res.should.be.json;
				res.body.should.be.a('object');
				res.body.should.have.property('errors');
				res.body.errors.should.be.a('object');
				res.body.errors.should.have.property('message');
				expect(res.body.errors.message).to.equal('You are not the owner of this restaurant');
				res.body.errors.should.have.property('user');
				expect(res.body.errors.user).to.equal('You are not the owner of this restaurant');
				done();
			});
	});

	it('should update the meal on /restaurant/:id/meal/:meal_id PUT', function(done) {
		chai.request(server)
			.put(`/restaurant/${restaurants[0]._id}/meal/${meals[0]._id}`)
			.set('Authorization', `Bearer ${owner_token}`)
			.send({ name: 'Meal 1 - Edited', description: 'Meal 1 - Edited', price: 400 })
			.end(function(err, res) {
				res.should.have.status(200);
				res.should.be.json;
				res.body.should.be.a('object');
				res.body.should.have.property('message');
				res.body.should.have.property('meal');
				res.body.meal.should.be.a('object');
				res.body.meal.should.have.property('_id');
				res.body.meal.should.have.property('restaurant_id');
				res.body.meal.should.have.property('name');
				res.body.meal.should.have.property('description');
				res.body.meal.should.have.property('price');
				expect(res.body.meal.restaurant_id).to.equal(restaurants[0]._id);
				expect(res.body.meal.name).to.equal('Meal 1 - Edited');
				expect(res.body.meal.description).to.equal('Meal 1 - Edited');
				expect(res.body.meal.price).to.equal(400);
				expect(res.body.message).to.equal('Meal has been updated successfully');
				done();
			});
	});

	it('should get the meal on /restaurant/:id/meal/:meal_id GET', function(done) {
		chai.request(server)
			.get(`/restaurant/${restaurants[0]._id}/meal/${meals[0]._id}`)
			.set('Authorization', `Bearer ${owner_token}`)
			.end(function(err, res) {
				res.should.have.status(200);
				res.should.be.json;
				res.body.should.be.a('object');
				res.body.should.have.property('meal');
				res.body.meal.should.be.a('object');
				res.body.meal.should.have.property('_id');
				res.body.meal.should.have.property('restaurant_id');
				res.body.meal.should.have.property('name');
				res.body.meal.should.have.property('description');
				res.body.meal.should.have.property('price');
				expect(res.body.meal.restaurant_id).to.equal(restaurants[0]._id);
				expect(res.body.meal.name).to.equal('Meal 1 - Edited');
				expect(res.body.meal.description).to.equal('Meal 1 - Edited');
				expect(res.body.meal.price).to.equal(400);
				done();
			});
	});

	it('should delete the meal on /restaurant/:id/meal/:meal_id DELETE', function(done) {
		chai.request(server)
			.delete(`/restaurant/${restaurants[0]._id}/meal/${meals[2]._id}`)
			.set('Authorization', `Bearer ${owner_token}`)
			.end(function(err, res) {
				res.should.have.status(200);
				res.should.be.json;
				res.body.should.be.a('object');
				res.body.should.have.property('message');
				expect(res.body.message).to.equal('The meal has been removed successfully');
				done();
			});
	});

	it('should return error message "Meal does not exist" on /restaurant/:id/meal/:meal_id GET', function(done) {
		chai.request(server)
			.get(`/restaurant/${restaurants[0]._id}/meal/${meals[2]._id}`)
			.set('Authorization', `Bearer ${user_token}`)
			.end(function(err, res) {
				res.should.have.status(404);
				res.should.be.json;
				res.body.should.be.a('object');
				res.body.should.have.property('errors');
				res.body.errors.should.be.a('object');
				res.body.errors.should.have.property('message');
				expect(res.body.errors.message).to.equal('Meal does not exist');
				res.body.errors.should.have.property('meal');
				expect(res.body.errors.meal).to.equal('Meal does not exist');
				done();
			});
	});
});

describe('Order API', function() {
	Order.collection.drop();
	History.collection.drop();
	OrderMeal.collection.drop();

	it('should return error message "Invalid user role" on /order POST', function(done) {
		chai.request(server)
			.post('/order')
			.set('Authorization', `Bearer ${owner_token}`)
			.send({ restaurant_id: restaurants[0]._id, meal_list: [meals[0]._id, meals[1]._id] })
			.end(function(err, res) {
				res.should.have.status(403);
				res.should.be.json;
				res.body.should.be.a('object');
				res.body.should.have.property('errors');
				res.body.errors.should.be.a('object');
				res.body.errors.should.have.property('message');
				expect(res.body.errors.message).to.equal('Invalid user role');
				res.body.errors.should.have.property('user');
				expect(res.body.errors.user).to.equal('Invalid user role');
				done();
			});
	});

	it('should return error message "Meal does not exist in this restaurant" on /order POST', function(done) {
		chai.request(server)
			.post('/order')
			.set('Authorization', `Bearer ${user_token}`)
			.send({ restaurant_id: restaurants[0]._id, meal_list: [meals[0]._id, 1] })
			.end(function(err, res) {
				res.should.have.status(404);
				res.should.be.json;
				res.body.should.be.a('object');
				res.body.should.have.property('errors');
				res.body.errors.should.be.a('object');
				res.body.errors.should.have.property('message');
				expect(res.body.errors.message).to.equal('Meal does not exist in this restaurant');
				res.body.errors.should.have.property('meal');
				expect(res.body.errors.meal).to.equal('Meal does not exist in this restaurant');
				done();
			});
	});

	it('should add a order on /order POST', function(done) {
		chai.request(server)
			.post('/order')
			.set('Authorization', `Bearer ${user_token}`)
			.send({ restaurant_id: restaurants[0]._id, meal_list: [meals[0]._id, meals[1]._id] })
			.end(function(err, res) {
				res.should.have.status(200);
				res.should.be.json;
				res.body.should.be.a('object');
				res.body.should.have.property('order');
				res.body.order.should.be.a('object');
				res.body.order.should.have.property('_id');
				res.body.order.should.have.property('user_id');
				res.body.order.should.have.property('owner_id');
				res.body.order.should.have.property('restaurant_id');
				res.body.order.should.have.property('restaurant_name');
				res.body.order.should.have.property('total_price');
				res.body.order.should.have.property('status');
				res.body.order.should.have.property('createdAt');
				expect(res.body.order.owner_id).to.equal(restaurants[0].owner_id);
				expect(res.body.order.restaurant_id).to.equal(restaurants[0]._id);
				expect(res.body.order.status).to.equal('Placed');
				done();
			});
	});

	it('should add a order on /order POST', function(done) {
		chai.request(server)
			.post('/order')
			.set('Authorization', `Bearer ${user_token}`)
			.send({ restaurant_id: restaurants[0]._id, meal_list: [meals[0]._id, meals[1]._id] })
			.end(function(err, res) {
				res.should.have.status(200);
				res.should.be.json;
				res.body.should.be.a('object');
				res.body.should.have.property('order');
				res.body.order.should.be.a('object');
				res.body.order.should.have.property('_id');
				res.body.order.should.have.property('user_id');
				res.body.order.should.have.property('owner_id');
				res.body.order.should.have.property('restaurant_id');
				res.body.order.should.have.property('restaurant_name');
				res.body.order.should.have.property('total_price');
				res.body.order.should.have.property('status');
				res.body.order.should.have.property('createdAt');
				expect(res.body.order.owner_id).to.equal(restaurants[0].owner_id);
				expect(res.body.order.restaurant_id).to.equal(restaurants[0]._id);
				expect(res.body.order.status).to.equal('Placed');
				done();
			});
	});

	it('should get the orders on /order GET', function(done) {
		chai.request(server)
			.get('/order')
			.set('Authorization', `Bearer ${user_token}`)
			.end(function(err, res) {
				res.should.have.status(200);
				res.should.be.json;
				res.body.should.be.a('object');
				res.body.should.have.property('orders');
				res.body.orders.should.be.a('array');
				expect(res.body.orders.length).to.equal(2);
				orders = res.body.orders;
				done();
			});
	});

	it('should return error message "Restaurant does not exist" on /restaurant/:id PUT', function(done) {
		chai.request(server)
			.put(`/restaurant/1`)
			.set('Authorization', `Bearer ${owner_token}`)
			.send({ name: 'Restaurant 1 - Edited', description: 'Restaurant 1 - Edited' })
			.end(function(err, res) {
				res.should.have.status(404);
				res.should.be.json;
				res.body.should.be.a('object');
				res.body.should.have.property('errors');
				res.body.errors.should.be.a('object');
				res.body.errors.should.have.property('message');
				expect(res.body.errors.message).to.equal('Restaurant does not exist');
				res.body.errors.should.have.property('restaurant');
				expect(res.body.errors.restaurant).to.equal('Restaurant does not exist');
				done();
			});
	});

	it('should cancel the order on /order/:id PUT', function(done) {
		chai.request(server)
			.put(`/order/${orders[0]._id}`)
			.set('Authorization', `Bearer ${user_token}`)
			.send({ status: 'Canceled' })
			.end(function(err, res) {
				res.should.have.status(200);
				res.should.be.json;
				res.body.should.be.a('object');
				res.body.should.have.property('message');
				expect(res.body.message).to.equal('Order has been updated successfully');
				res.body.should.have.property('order');
				res.body.order.should.be.a('object');
				res.body.order.should.have.property('_id');
				res.body.order.should.have.property('user_id');
				res.body.order.should.have.property('owner_id');
				res.body.order.should.have.property('restaurant_id');
				res.body.order.should.have.property('restaurant_name');
				res.body.order.should.have.property('total_price');
				res.body.order.should.have.property('status');
				res.body.order.should.have.property('createdAt');
				expect(res.body.order._id).to.equal(orders[0]._id);
				expect(res.body.order.user_id).to.equal(orders[0].user_id);
				expect(res.body.order.owner_id).to.equal(orders[0].owner_id);
				expect(res.body.order.restaurant_id).to.equal(orders[0].restaurant_id);
				expect(res.body.order.restaurant_name).to.equal(orders[0].restaurant_name);
				expect(res.body.order.total_price).to.equal(orders[0].total_price);
				expect(res.body.order.status).to.equal('Canceled');
				done();
			});
	});

	it('should return error message "Invalid status" on /order/:id PUT', function(done) {
		chai.request(server)
			.put(`/order/${orders[0]._id}`)
			.set('Authorization', `Bearer ${owner_token}`)
			.send({ status: 'Processing' })
			.end(function(err, res) {
				res.should.have.status(422);
				res.should.be.json;
				res.body.should.be.a('object');
				res.body.should.have.property('errors');
				res.body.errors.should.be.a('object');
				res.body.errors.should.have.property('message');
				expect(res.body.errors.message).to.equal('Invalid status');
				res.body.errors.should.have.property('order');
				expect(res.body.errors.order).to.equal('Invalid status');
				done();
			});
	});

	it('should get the order on /order/:id GET', function(done) {
		chai.request(server)
			.get(`/order/${orders[0]._id}`)
			.set('Authorization', `Bearer ${user_token}`)
			.end(function(err, res) {
				res.should.have.status(200);
				res.should.be.json;
				res.body.should.be.a('object');
				res.body.should.have.property('order');
				res.body.order.should.be.a('object');
				res.body.order.should.have.property('_id');
				res.body.order.should.have.property('user_id');
				res.body.order.should.have.property('owner_id');
				res.body.order.should.have.property('restaurant_id');
				res.body.order.should.have.property('restaurant_name');
				res.body.order.should.have.property('total_price');
				res.body.order.should.have.property('status');
				res.body.order.should.have.property('createdAt');
				expect(res.body.order._id).to.equal(orders[0]._id);
				expect(res.body.order.user_id).to.equal(orders[0].user_id);
				expect(res.body.order.owner_id).to.equal(orders[0].owner_id);
				expect(res.body.order.restaurant_id).to.equal(orders[0].restaurant_id);
				expect(res.body.order.restaurant_name).to.equal(orders[0].restaurant_name);
				expect(res.body.order.total_price).to.equal(orders[0].total_price);
				expect(res.body.order.status).to.equal('Canceled');
				res.body.order.should.have.property('histories');
				res.body.order.histories.should.be.a('array');
				expect(res.body.order.histories.length).to.equal(2);
				res.body.order.histories[0].should.have.property('status');
				expect(res.body.order.histories[0].status).to.equal('Placed');
				res.body.order.histories[1].should.have.property('status');
				expect(res.body.order.histories[1].status).to.equal('Canceled');
				res.body.order.should.have.property('meal_list');
				res.body.order.meal_list.should.be.a('array');
				expect(res.body.order.meal_list.length).to.equal(2);
				done();
			});
	});

	it('should update the order to "Processing" on /order/:id PUT', function(done) {
		chai.request(server)
			.put(`/order/${orders[1]._id}`)
			.set('Authorization', `Bearer ${owner_token}`)
			.send({ status: 'Processing' })
			.end(function(err, res) {
				res.should.have.status(200);
				res.should.be.json;
				res.body.should.be.a('object');
				res.body.should.have.property('message');
				expect(res.body.message).to.equal('Order has been updated successfully');
				res.body.should.have.property('order');
				res.body.order.should.be.a('object');
				res.body.order.should.have.property('_id');
				res.body.order.should.have.property('user_id');
				res.body.order.should.have.property('owner_id');
				res.body.order.should.have.property('restaurant_id');
				res.body.order.should.have.property('restaurant_name');
				res.body.order.should.have.property('total_price');
				res.body.order.should.have.property('status');
				res.body.order.should.have.property('createdAt');
				expect(res.body.order._id).to.equal(orders[1]._id);
				expect(res.body.order.user_id).to.equal(orders[1].user_id);
				expect(res.body.order.owner_id).to.equal(orders[1].owner_id);
				expect(res.body.order.restaurant_id).to.equal(orders[1].restaurant_id);
				expect(res.body.order.restaurant_name).to.equal(orders[1].restaurant_name);
				expect(res.body.order.total_price).to.equal(orders[1].total_price);
				expect(res.body.order.status).to.equal('Processing');
				done();
			});
	});

	it('should update the order to "In Route" on /order/:id PUT', function(done) {
		chai.request(server)
			.put(`/order/${orders[1]._id}`)
			.set('Authorization', `Bearer ${owner_token}`)
			.send({ status: 'In Route' })
			.end(function(err, res) {
				res.should.have.status(200);
				res.should.be.json;
				res.body.should.be.a('object');
				res.body.should.have.property('message');
				expect(res.body.message).to.equal('Order has been updated successfully');
				res.body.should.have.property('order');
				res.body.order.should.be.a('object');
				res.body.order.should.have.property('_id');
				res.body.order.should.have.property('user_id');
				res.body.order.should.have.property('owner_id');
				res.body.order.should.have.property('restaurant_id');
				res.body.order.should.have.property('restaurant_name');
				res.body.order.should.have.property('total_price');
				res.body.order.should.have.property('status');
				res.body.order.should.have.property('createdAt');
				expect(res.body.order._id).to.equal(orders[1]._id);
				expect(res.body.order.user_id).to.equal(orders[1].user_id);
				expect(res.body.order.owner_id).to.equal(orders[1].owner_id);
				expect(res.body.order.restaurant_id).to.equal(orders[1].restaurant_id);
				expect(res.body.order.restaurant_name).to.equal(orders[1].restaurant_name);
				expect(res.body.order.total_price).to.equal(orders[1].total_price);
				expect(res.body.order.status).to.equal('In Route');
				done();
			});
	});

	it('should update the order to "Delivered" on /order/:id PUT', function(done) {
		chai.request(server)
			.put(`/order/${orders[1]._id}`)
			.set('Authorization', `Bearer ${owner_token}`)
			.send({ status: 'Delivered' })
			.end(function(err, res) {
				res.should.have.status(200);
				res.should.be.json;
				res.body.should.be.a('object');
				res.body.should.have.property('message');
				expect(res.body.message).to.equal('Order has been updated successfully');
				res.body.should.have.property('order');
				res.body.order.should.be.a('object');
				res.body.order.should.have.property('_id');
				res.body.order.should.have.property('user_id');
				res.body.order.should.have.property('owner_id');
				res.body.order.should.have.property('restaurant_id');
				res.body.order.should.have.property('restaurant_name');
				res.body.order.should.have.property('total_price');
				res.body.order.should.have.property('status');
				res.body.order.should.have.property('createdAt');
				expect(res.body.order._id).to.equal(orders[1]._id);
				expect(res.body.order.user_id).to.equal(orders[1].user_id);
				expect(res.body.order.owner_id).to.equal(orders[1].owner_id);
				expect(res.body.order.restaurant_id).to.equal(orders[1].restaurant_id);
				expect(res.body.order.restaurant_name).to.equal(orders[1].restaurant_name);
				expect(res.body.order.total_price).to.equal(orders[1].total_price);
				expect(res.body.order.status).to.equal('Delivered');
				done();
			});
	});

	it('should return error message "Invalid status" on /order/:id PUT', function(done) {
		chai.request(server)
			.put(`/order/${orders[1]._id}`)
			.set('Authorization', `Bearer ${user_token}`)
			.send({ status: 'Canceled' })
			.end(function(err, res) {
				res.should.have.status(422);
				res.should.be.json;
				res.body.should.be.a('object');
				res.body.should.have.property('errors');
				res.body.errors.should.be.a('object');
				res.body.errors.should.have.property('message');
				expect(res.body.errors.message).to.equal('Invalid status');
				res.body.errors.should.have.property('order');
				expect(res.body.errors.order).to.equal('Invalid status');
				done();
			});
	});

	it('should update the order to "Received" on /order/:id PUT', function(done) {
		chai.request(server)
			.put(`/order/${orders[1]._id}`)
			.set('Authorization', `Bearer ${user_token}`)
			.send({ status: 'Received' })
			.end(function(err, res) {
				res.should.have.status(200);
				res.should.be.json;
				res.body.should.be.a('object');
				res.body.should.have.property('message');
				expect(res.body.message).to.equal('Order has been updated successfully');
				res.body.should.have.property('order');
				res.body.order.should.be.a('object');
				res.body.order.should.have.property('_id');
				res.body.order.should.have.property('user_id');
				res.body.order.should.have.property('owner_id');
				res.body.order.should.have.property('restaurant_id');
				res.body.order.should.have.property('restaurant_name');
				res.body.order.should.have.property('total_price');
				res.body.order.should.have.property('status');
				res.body.order.should.have.property('createdAt');
				expect(res.body.order._id).to.equal(orders[1]._id);
				expect(res.body.order.user_id).to.equal(orders[1].user_id);
				expect(res.body.order.owner_id).to.equal(orders[1].owner_id);
				expect(res.body.order.restaurant_id).to.equal(orders[1].restaurant_id);
				expect(res.body.order.restaurant_name).to.equal(orders[1].restaurant_name);
				expect(res.body.order.total_price).to.equal(orders[1].total_price);
				expect(res.body.order.status).to.equal('Received');
				done();
			});
	});

	it('should get the order on /order/:id GET', function(done) {
		chai.request(server)
			.get(`/order/${orders[1]._id}`)
			.set('Authorization', `Bearer ${user_token}`)
			.end(function(err, res) {
				res.should.have.status(200);
				res.should.be.json;
				res.body.should.be.a('object');
				res.body.should.have.property('order');
				res.body.order.should.be.a('object');
				res.body.order.should.have.property('_id');
				res.body.order.should.have.property('user_id');
				res.body.order.should.have.property('owner_id');
				res.body.order.should.have.property('restaurant_id');
				res.body.order.should.have.property('restaurant_name');
				res.body.order.should.have.property('total_price');
				res.body.order.should.have.property('status');
				res.body.order.should.have.property('createdAt');
				expect(res.body.order._id).to.equal(orders[1]._id);
				expect(res.body.order.user_id).to.equal(orders[1].user_id);
				expect(res.body.order.owner_id).to.equal(orders[1].owner_id);
				expect(res.body.order.restaurant_id).to.equal(orders[1].restaurant_id);
				expect(res.body.order.restaurant_name).to.equal(orders[1].restaurant_name);
				expect(res.body.order.total_price).to.equal(orders[1].total_price);
				expect(res.body.order.status).to.equal('Received');
				res.body.order.should.have.property('histories');
				res.body.order.histories.should.be.a('array');
				expect(res.body.order.histories.length).to.equal(5);
				res.body.order.histories[0].should.have.property('status');
				expect(res.body.order.histories[0].status).to.equal('Placed');
				res.body.order.histories[1].should.have.property('status');
				expect(res.body.order.histories[1].status).to.equal('Processing');
				res.body.order.histories[2].should.have.property('status');
				expect(res.body.order.histories[2].status).to.equal('In Route');
				res.body.order.histories[3].should.have.property('status');
				expect(res.body.order.histories[3].status).to.equal('Delivered');
				res.body.order.histories[4].should.have.property('status');
				expect(res.body.order.histories[4].status).to.equal('Received');
				res.body.order.should.have.property('meal_list');
				res.body.order.meal_list.should.be.a('array');
				expect(res.body.order.meal_list.length).to.equal(2);
				done();
			});
	});
});
