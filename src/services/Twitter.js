const { AutoPosterSchema } = require('../database/models'),
	Twitter = require('twitter-lite'),
	{ MessageEmbed } = require('discord.js');
// Fetch new twitter posts
class TwitterFetcher {
	constructor(AutoPoster, config) {
		this.AutoPoster = AutoPoster;
		this.twtaccounts = [];
		this.enabled = true;
		this.twitter_client = new Twitter(config);
	}

	// Fetch new posts
	async fetchPosts() {
		// Create stream
		const twtaccounts = this.twtaccounts;
		const WebhookManager = this.AutoPoster.webhookManager;
		const	Tstream = this.twitter_client.stream('statuses/filter', { follow: this.twtaccounts.map(account => account.name).join(', ') });

		// Start listening to stream
		Tstream.on('start', function(start_result) {
			if (start_result.status == 200) {
				console.log('Begun streaming');
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
				if (!tweet.text || !twtaccounts.find(account => tweet.user.id_str == account.name)) return;
				tweet.text.replace('&amp;', '&');
				const embed = new MessageEmbed()
					.setColor('BLUE');
				if (tweet.retweeted || tweet.text.startsWith('RT')) {
					console.log(`${tweet.user.name} retreated @${tweet.retweeted_status.user.screen_name}.`);
					embed.setAuthor(`${tweet.user.name} retweeted: ${tweet.retweeted_status.user.name} (@${tweet.retweeted_status.user.screen_name})`, tweet.retweeted_status.user.profile_image_url_https.replace('normal.jpg', '200x200.jpg'), `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`)
						.setDescription(tweet.retweeted_status.text.replace(tweet.retweeted_status.entities?.media[0]?.url, ''))
						.setTimestamp(tweet.retweeted_status.created_at);
					if (tweet.retweeted_status.entities.media == undefined) console.log(tweet.retweeted_status.entities);
					if (tweet.retweeted_status.entities.media) embed.setImage(tweet.retweeted_status.entities.media[0].media_url_https);
					twtaccounts.find(account => tweet.user.id_str == account.name).channelIDs.forEach(id => {
						WebhookManager.addValues(id, embed);
					});
				} else if (!tweet.retweeted || !tweet.text.startsWith('RT')) {
					console.log(`${tweet.user.name} made a tweet.`);
					if (tweet.in_reply_to_status_id == null || tweet.in_reply_to_user_id == null) {
						embed.setAuthor(`${tweet.user.name} (@${tweet.user.screen_name})`, tweet.user.profile_image_url_https.replace('normal.jpg', '200x200.jpg'), `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`)
							.setDescription(tweet.text)
							.setTimestamp(tweet.created_at);
						if (tweet.entities.media) embed.setImage(tweet.entities.media[0].media_url_https);
						twtaccounts.find(account => tweet.user.id_str == account.name).channelIDs.forEach(id => {
							WebhookManager.addValues(id, embed);
						});
					}
				} else if (tweet.in_reply_to_status_id != null || tweet.in_reply_to_user_id != null) {
					if (tweet.reply) {
						console.log(`${tweet.user.name} replied to ${tweet.in_reply_to_screen_name}`);
						embed.setAuthor(`${tweet.user.name} (@${tweet.user.screen_name})\nReply to @${tweet.in_reply_to_screen_name}`, tweet.user.profile_image_url_https.replace('normal.jpg', '200x200.jpg'), `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`)
							.setDescription(tweet.text.replace(`@${tweet.in_reply_to_screen_name}`, ''))
							.setTimestamp(tweet.created_at)
							.setThumbnail('https://cdn1.iconfinder.com/data/icons/messaging-3/48/Reply-512.png');
						if (tweet.entities.media) embed.setImage(tweet.entities.media[0].media_url_https);
						twtaccounts.find(account => tweet.user.id_str == account.name).channelIDs.forEach(id => {
							WebhookManager.addValues(id, embed);
						});
					}
				}
			} catch (err) {
				console.log(err);
			}
		});

		// An error occured on the stream
		Tstream.on('error', function(err) {
			console.log(err);
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
		const twtData = await AutoPosterSchema.find({}).then(res => res.map(data => data.Twitter));
		if (!twtData[0]) return this.enabled = false;

		// Get all subreddits (remove duplicates)
		const instaAccount = [...new Set(twtData.map(item => item.map(obj => obj.Account)).reduce((a, b) => a.concat(b)))];

		// Put subreddits with their list of channels to post to
		const twtaccounts = instaAccount.map(acc => ({
			name: acc,
			channelIDs: [...new Set(twtData.map(item => item.filter(obj => obj.Account == acc)).map(obj => obj.map(i => i.channelID)).reduce((a, b) => a.concat(b)))],
		}));

		for (const twtacc of twtaccounts) {
			try {
				const result = await this.twitter_client.get('users/show', { screen_name: twtacc.name });
				this.twtaccounts.push({ name: result.id_str, channelIDs: twtacc.channelIDs });
			} catch (err) {
				if ([50, 63, 32].includes(err.errors[0].code)) {
					console.log(`${twtacc.name} is an invalid twitter name.`);
				} else {
					console.log(err);
				}
			}
		}
	}

	// init the class
	async init() {
		await this.updatingTwitterAccountList();
		await this.fetchPosts();

		// Update subreddit list every 5 minutes
		setInterval(async () => {
			await this.updatingTwitterAccountList();
			await this.fetchPosts();
		}, 5 * 60000);
	}

	/**
   * Function for toggling the Instagram auto-poster
   * @return {Void}
  */
	toggle() {
		this.enabled = !this.enabled;
	}

	/**
   * Function for adding an twitter account
   * @param {obj.channelID} String The channel where it's being added to
   * @param {obj.accountName} String The twitter account that is being added
   * @return {Mongoose.Schema}
  */
	async addItem({ channelID, accountName }) {
		const channel = await this.AutoPoster.client.channels.fetch(channelID);
		if (!channel.guild?.id) throw new Error('Channel does not have a guild ID.');
		let data = await AutoPosterSchema.findOne({ guildID: channel.guild.id });

		if (data) {
			// Add new item to Guild's autoposter data
			data.Twitter.push({ channelID: channel.id, Account: accountName });
		} else {
			data = new AutoPosterSchema({
				guildID: `${channel.guild.id}`,
				Twitter: [{ channelID: channel.id, Account: accountName }],
			});
		}
		return data.save();
	}

	/**
   * Function for removing an twitter account
   * @param {obj.channelID} String The channel where it's being deleted from
   * @param {obj.accountName} String The twitter account that is being deleted
   * @return {Mongoose.Schema}
  */
	async deleteItem({ channelID, accountName }) {
		const channel = await this.AutoPoster.client.channels.fetch(channelID);
		if (!channel.guild?.id) throw new Error('Channel does not have a guild ID.');
		const data = await AutoPosterSchema.findOne({ guildID: channel.guild.id });
		if (!data) throw new Error(`No data found from guild: ${channel.guild.id}`);

		// Delete channel or Account
		data.Twitter.filter(({ Account }) => Account !== accountName);
		return data.save();
	}
}

module.exports = TwitterFetcher;
