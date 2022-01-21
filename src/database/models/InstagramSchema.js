const { Schema, model } = require('mongoose');

const instagramSchema = Schema({
	Name: String,
	channelIDs: Array,
});

module.exports = model('Instagram', instagramSchema);
