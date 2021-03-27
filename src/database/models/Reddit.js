const mongoose = require('mongoose');

const redditSchema = mongoose.Schema({
	subredditName: String,
	channelIDs: Array,
});

module.exports = mongoose.model('Reddit', redditSchema);
