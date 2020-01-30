var mongoose = require('mongoose');

var MealSchema = new mongoose.Schema(
	{
		restaurant_id: String,
		name: String,
		description: String,
		price: Number,
		deleted: { type: Boolean, default: false },
	},
	{ timestamps: true }
);

MealSchema.methods.toJSON = function() {
	return {
		_id: this._id,
		restaurant_id: this.restaurant_id,
		name: this.name,
		description: this.description,
		price: this.price,
	};
};

mongoose.model('meal', MealSchema);
