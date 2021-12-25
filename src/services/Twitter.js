const { TwitterSchema } = require('../database/models'),
	{ MessageEmbed } = require('discord.js'),
	Twitter = require('twitter-lite'),
	{ getdate, getTime } = require('../utils/functions');

// Fetch new twitter posts
class TwitterFetcher {
	constructor(bot) {
		this.bot = bot;
		this.twitter_client = new Twitter(this.bot.config.twitter);
		this.twtaccounts = [];
	}

	// Fetch new posts
	async fetchPosts(twtaccounts, twitter_client, bot) {
		// Create stream
		const	Tstream = twitter_client.stream('statuses/filter', { follow: this.twtaccounts.map(account => account.id).join(', ') });

		// Start listening to stream
		Tstream.on('start', function(start_result) {
			if (start_result.status == 200) {
				for (const { twitter_name, id } of twtaccounts) {
					bot.logger.log(`Watching ${twitter_name} - ID ${id}`);
				}
				bot.logger.ready('Loaded Twitter module');
			} else {
				console.log(start_result.statusText);
			}
		});

		// Streaming has ended
		Tstream.on('end', async () => {
			console.log('🔴 Streaming API ended');
		});

		// Recieved tweet
		Tstream.on('data', async function(tweet) {
			try {
				if (!tweet.text || !twtaccounts.find(account => tweet.user.id_str == account.id)) return;
				tweet.text.replace('&amp;', '&');
				const embed = new MessageEmbed()
					.setColor('BLUE');
				if (tweet.retweeted || tweet.text.startsWith('RT')) {
					bot.logger.log(`${tweet.user.name} retreated @${tweet.retweeted_status.user.screen_name}.`);
					embed.setAuthor(`${tweet.user.name} retweeted: ${tweet.retweeted_status.user.name} (@${tweet.retweeted_status.user.screen_name})`, tweet.retweeted_status.user.profile_image_url_https.replace('normal.jpg', '200x200.jpg'), `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`)
						.setDescription(tweet.retweeted_status.text.replace(tweet.retweeted_status.entities?.media[0]?.url, ''))
						.setTimestamp(tweet.retweeted_status.created_at);
					if (tweet.retweeted_status.entities.media == undefined) console.log(tweet.retweeted_status.entities);
					if (tweet.retweeted_status.entities.media) embed.setImage(tweet.retweeted_status.entities.media[0].media_url_https);
					twtaccounts.find(account => tweet.user.id_str == account.id).channelId.forEach(id => {
						bot.addEmbed(id, embed);
					});
				} else if (!tweet.retweeted || !tweet.text.startsWith('RT')) {
					bot.logger.log(`${tweet.user.name} made a tweet.`);
					if (tweet.in_reply_to_status_id == null || tweet.in_reply_to_user_id == null) {
						embed.setAuthor(`${tweet.user.name} (@${tweet.user.screen_name})`, tweet.user.profile_image_url_https.replace('normal.jpg', '200x200.jpg'), `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`)
							.setDescription(tweet.text)
							.setTimestamp(tweet.created_at);
						if (tweet.entities.media) embed.setImage(tweet.entities.media[0].media_url_https);
						twtaccounts.find(account => tweet.user.id_str == account.id).channelId.forEach(id => {
							bot.addEmbed(id, embed);
						});
					}
				} else if (tweet.in_reply_to_status_id != null || tweet.in_reply_to_user_id != null) {
					if (tweet.reply) {
						bot.logger.log(`${tweet.user.name} replied to ${tweet.in_reply_to_screen_name}`);
						embed.setAuthor(`${tweet.user.name} (@${tweet.user.screen_name})\nReply to @${tweet.in_reply_to_screen_name}`, tweet.user.profile_image_url_https.replace('normal.jpg', '200x200.jpg'), `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`)
							.setDescription(tweet.text.replace(`@${tweet.in_reply_to_screen_name}`, ''))
							.setTimestamp(tweet.created_at)
							.setThumbnail('https://cdn1.iconfinder.com/data/icons/messaging-3/48/Reply-512.png');
						if (tweet.entities.media) embed.setImage(tweet.entities.media[0].media_url_https);
						twtaccounts.find(account => tweet.user.id_str == account.id).channelId.forEach(id => {
							bot.addEmbed(id, embed);
						});
					}
				}
			} catch (err) {
				console.log(err);
			}
		});

		// An error occured on the stream
		Tstream.on('error', function(err) {
			console.log(`[${getdate()} - ${getTime()} ] globaltwit stream error:`);
			console.log(err);
		});

		Tstream.on('stall_warnings', function(stall) {
			console.log(`[${getdate()} - ${getTime()} ] ${stall.warning.message} - ` + stall.warning.code);
		});

		// Destory the stream at 4.5 minutes to allow for new stream (Updated twitter list)
		// A BETTER WAY NEEDS TO BE CODED SO THERE IS NO TIMEDOWN AND NO RATELIMIT ISSUES
		setTimeout(() => {
			process.nextTick(() => Tstream.destroy());
		}, 4.5 * 60000);
	}


	// Updates twitter account list every 5 minutes
	async updatingTwitterAccountList() {
		// fetch reddit data from database
		const accounts = await TwitterSchema.find({});
		if (!accounts[0]) return this.bot.logger.error('No subreddits to load.');

		this.twtaccounts = [];
		for (const acc of accounts) {
			if (acc.channelIDs.length >= 1) {
				try {
					const result = await this.twitter_client.get('users/show', { screen_name: acc.twitterName });
					const channels = accounts.find(account => account.twitterName == acc.twitterName).channelIDs;
					this.twtaccounts.push({
						'id' : result.id_str,
						'twitter_name' : acc.twitterName,
						'channelId': channels,
					});
				} catch (err) {
					if ([50, 63, 32].includes(err.errors[0].code)) {
						this.bot.logger.error(`${acc} is an invalid twitter name.`);
					} else {
						console.log(err);
					}
				}
			} else {
				// delete from DB
				await TwitterSchema.findOneAndRemove({ twitterName: acc.twitterName }, (err) => {
					if (err) console.log(err);
				});
			}
		}
	}

	// init the class
	async init() {
		this.bot.logger.log('Loading Twitter module.');
		await this.updatingTwitterAccountList();
		await this.fetchPosts(this.twtaccounts, this.twitter_client, this.bot);

		// Update subreddit list every 5 minutes
		setInterval(async () => {
			await this.updatingTwitterAccountList();
			await this.fetchPosts(this.twtaccounts, this.twitter_client, this.bot);
		}, 5 * 60000);
	}
}

module.exports = TwitterFetcher;
