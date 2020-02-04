var mongoose = require('mongoose');

var OrderSchema = new mongoose.Schema(
	{
		user_id: String,
		owner_id: String,
		restaurant_id: String,
		restaurant_name: String,
		total_price: Number,
		status: String,
	},
	{ timestamps: true }
);

OrderSchema.methods.toJSON = function() {
	return {
		_id: this._id,
		user_id: this.user_id,
		owner_id: this.owner_id,
		restaurant_id: this.restaurant_id,
		restaurant_name: this.restaurant_name,
		total_price: this.total_price,
		status: this.status,
		createdAt: this.createdAt,
	};
};

mongoose.model('order', OrderSchema);
