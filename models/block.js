var mongoose = require('mongoose');
var SchemaTypes = mongoose.Schema.Types;

var BlockSchema = new mongoose.Schema(
	{
		owner_id: String,
		user_id: String,
	},
	{ timestamps: true }
);

BlockSchema.methods.toJSON = function() {
	return {
		owner_id: this.owner_id,
		user_id: this.user_id,
	};
};

mongoose.model('block', BlockSchema);
