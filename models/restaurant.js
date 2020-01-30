var mongoose = require('mongoose');

var RestaurantSchema = new mongoose.Schema(
	{
		owner_id: String,
		name: String,
		description: String,
		deleted: { type: Boolean, default: false },
	},
	{ timestamps: true }
);

RestaurantSchema.methods.toJSON = function() {
	return {
		_id: this._id,
		owner_id: this.owner_id,
		name: this.name,
		description: this.description,
	};
};

mongoose.model('restaurant', RestaurantSchema);
