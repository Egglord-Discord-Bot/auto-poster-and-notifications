const { Client } = require('discord.js');
const bot = new Client();

bot.logger = require('./utils/logger');
bot.config = require('./config');
const { Reddit: redditDB } = require('./database/models');

// Connect bot to database
bot.mongoose = require('./database').init(bot);
}

// ready event
bot.on('ready', () => {
	bot.logger.log('-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=', 'ready');
	bot.logger.log(`${bot.user.tag}, ready to serve [${bot.users.cache.size}] users in [${bot.guilds.cache.size}] servers.`, 'ready');
	bot.logger.log('-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=', 'ready');

	// Load all services
	try {
		require('./services/Reddit')(bot);
	//	require('./services/Youtube')(bot);
		// require('./services/Twitter')(twitter_client, bot, twtaccounts, true, functiondate, functiontime);
	} catch (e) {
		console.log(e);
	}
});

// When the bot is added to a guild
bot.on('guildCreate', async (guild) => {
	bot.logger.log(`[GUILD JOIN] ${guild.name} (${guild.id}) added the bot.`);
});

bot.on('message', async (message) => {
	if (message.content.startsWith('e!subreddit')) {
		const args = message.content.split(' ');
		if (args[1] == 'add' && args[2]) {
			try {
				await redditDB.findOne({
					subredditName: args[2],
				}, async (err, data) => {
					if (err) return bot.logger.error(err);
					if (!data) {
						const newredditDB = new redditDB({
							subredditName: args[2],
							channelIDs: [`${message.channel.id}`],
						});
						// save and send response to moderator
						await newredditDB.save().catch(e => bot.logger.error(e.message));
					} else {
						data.channelIDs.push(message.channel.id);
						data.save().catch(err => console.log(err));
					}
				});
				message.channel.send(`Adding ${args[2]} to subreddit list`);
			} catch (err) {
				if (message.deletable) message.delete();
				bot.logger.error(err.message);
				message.channel.send(err.message).then(m => m.delete({ timeout: 5000 }));
			}
		} else if (args[1] == 'remove' && args[2]) {
			try {
				await redditDB.findOne({
					subredditName: args[2],
				}, async (err, data) => {
					if (err) return bot.logger.error(err);
					if (!data) return;
					data.channelIDs.splice(data.channelIDs.indexOf(`${message.channel.id}`, 1));
					data.save().catch(err => console.log(err));
				});
				message.channel.send(`Removing ${args[2]} to subreddit list`);

			} catch (err) {
				if (message.deletable) message.delete();
				bot.logger.error(err.message);
				message.channel.send(err.message).then(m => m.delete({ timeout: 5000 }));
			}
		} else {
			message.channel.send('Not an option');
		}
	}

});

// When the bot leaves a guild
bot.on('guildDelete', async (guild) => {
	bot.logger.log(`[GUILD LEAVE] ${guild.name} (${guild.id}) removed the bot.`);
});

// Login to discord client (KEEP AT BOTTOM)
const token = bot.config.token;
bot.login(token).catch(e => console.error(e.message));
