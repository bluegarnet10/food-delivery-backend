var mongoose = require('mongoose');

var BlockSchema = new mongoose.Schema(
	{
		owner_id: String,
		user_id: String,
		user_name: String,
	},
	{ timestamps: true }
);

BlockSchema.methods.toJSON = function() {
	return {
		owner_id: this.owner_id,
		user_id: this.user_id,
		user_name: this.user_name,
	};
};

mongoose.model('block', BlockSchema);
