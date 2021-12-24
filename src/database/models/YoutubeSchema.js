const { Schema, model } = require('mongoose');

const youtubeSchema = Schema({
	channel: String,
	channelIDs: Array,
});

module.exports = model('Youtube', youtubeSchema);
