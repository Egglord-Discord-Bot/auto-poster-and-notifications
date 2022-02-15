const { Schema, model } = require('mongoose');

const AutoPosterSchema = Schema({
	guildID: String,
	Instagram: Array,
	Reddit: Array,
	Twitch: Array,
	Twitter: Array,
	Youtube: Array,
});

module.exports = model('AutoPosters', AutoPosterSchema);
