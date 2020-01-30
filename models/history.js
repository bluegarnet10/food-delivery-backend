var mongoose = require('mongoose');

var HistorySchema = new mongoose.Schema(
	{
		order_id: String,
		status: String,
	},
	{ timestamps: true }
);

HistorySchema.methods.toJSON = function() {
	return {
		order_id: this.order_id,
		status: this.status,
		date: this.createdAt,
	};
};

mongoose.model('history', HistorySchema);
