const { Schema, model } = require('mongoose');

const redditSchema = Schema({
	subredditName: String,
	channelIDs: Array,
});

module.exports = model('Reddit', redditSchema);
