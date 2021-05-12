const { Schema, model } = require('mongoose');

const twitterSchema = Schema({
	twitterName: String,
	channelIDs: Array,
});

module.exports = model('Twitter', twitterSchema);
