var mongoose = require('mongoose');

var OrderMealSchema = new mongoose.Schema(
	{
		order_id: String,
		meal_id: String,
		name: String,
		description: String,
		price: Number,
	},
	{ timestamps: true }
);

OrderMealSchema.methods.toJSON = function() {
	return {
		order_id: this.order_id,
		meal_id: this.meal_id,
		name: this.name,
		description: this.description,
		price: this.price,
	};
};

mongoose.model('order_meal', OrderMealSchema);
