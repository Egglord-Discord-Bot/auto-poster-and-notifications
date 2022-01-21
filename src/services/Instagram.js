const	{ InstagramSchema } = require('../database/models'),
	{ MessageEmbed } = require('discord.js'),
	{ debug } = require('../config'),
	fetch = require('node-fetch');
let date = Math.floor(Date.now() / 1000);

// Fetch reddit post
class InstagramFetcher {
	constructor(bot) {
		this.bot = bot;
		this.accounts = [];
	}

	// Fetch new posts (every 1 minute)
	async fetchPosts() {
		setInterval(async () => {
			for (const { name: accountName, channelIDs } of this.accounts) {
				const { graphql: { user: { edge_owner_to_timeline_media: photos } } } = await fetch(`https://www.instagram.com/${accountName}/feed/?__a=1`).then(res => res.json());
				if (photos.edges.length >= 1) {
					for (const { node } of photos.edges) {
						if (date <= (node.taken_at_timestamp)) {
							if (debug) this.bot.logger.debug(`${node.owner.username} uploaded a new post.`);
							const embed = new MessageEmbed()
								.setTitle(`New post by ${node.owner.username}`)
								.setURL(`https://www.instagram.com/p/${node.shortcode}`)
								.setImage(node.display_url)
								.setTimestamp(node.taken_at_timestamp * 1000);
							channelIDs.forEach((id) => { this.bot.addEmbed(id, embed);});
						}
					}
				}
			}
			date = Math.floor(Date.now() / 1000);
		}, 5000);
	}

	// Updates subreddit list every 5 minutes
	async updateInstagramList() {
		// fetch reddit data from database
		const accounts = await InstagramSchema.find({});
		if (!accounts[0]) return this.bot.logger.error('Instagram: No subreddits to load.');

		this.accounts = [];
		for (const acc of accounts) {
			if (acc.channelIDs.length >= 1) {
				this.bot.logger.log(`Instagram: Added ${acc.name} to the watch list.`);
				this.subreddits.push(acc);
			} else {
				await InstagramSchema.findOneAndRemove({ name: acc.name }, (err) => {
					if (err) console.log(err);
				});
			}
		}
	}

	// init the class
	async init() {
		this.bot.logger.log('Instagram: Loading module...');
		await this.updateInstagramList();
		await this.fetchPosts();
		this.bot.logger.ready('Instagram: Loaded module.');
		// Update subreddit list every 5 minutes
		setInterval(async () => {
			await this.updateInstagramList();
		}, 5 * 60000);
	}
}


module.exports = InstagramFetcher;
