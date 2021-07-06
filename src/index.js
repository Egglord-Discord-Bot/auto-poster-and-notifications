const { Client, Collection } = require('discord.js'),
	bot = new Client();

bot.logger = require('./utils/logger');
bot.config = require('./config');
// for webhook
bot.embedCollection = new Collection();
bot.addEmbed = function(channelID, embed) {
	// collect embeds
	if (!this.embedCollection.has(channelID)) {
		this.embedCollection.set(channelID, [embed]);
	} else {
		this.embedCollection.set(channelID, [...this.embedCollection.get(channelID), embed]);
	}
};
// Connect bot to database
bot.mongoose = require('./database').init(bot);

// ready event
bot.on('ready', async () => {
	bot.logger.log('-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=', 'ready');
	bot.logger.log(`${bot.user.tag}, ready to serve [${bot.users.cache.size}] users in [${bot.guilds.cache.size}] servers.`, 'ready');
	bot.logger.log('-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=', 'ready');

	const { TwitterSchema, RedditSchema } = require('./database/models');
	const newGuild = new TwitterSchema({	twitterName: 'spiderjockey02', channelIDs: ['843890583381606421'] });
	const newGuild2 = new RedditSchema({	subredditName: 'memes', channelIDs: ['843890583381606421'] });

	await newGuild.save();
	await newGuild2.save();

	// Load all services
	try {
		require('./services/Reddit')(bot);
		// require('./services/Youtube')(bot);
		require('./services/Twitter')(bot);
	} catch (err) {
		console.log(err);
	}

	// webhook manager
	setInterval(async () => {
		await require('./utils/webhook-manager')(bot);
	}, 10000);
});

// Login to discord client (KEEP AT BOTTOM)
const token = bot.config.token;
bot.login(token).catch(e => console.error(e.message));
