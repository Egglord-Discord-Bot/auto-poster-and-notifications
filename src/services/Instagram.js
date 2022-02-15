const	{ AutoPosterSchema } = require('../database/models'),
	{ MessageEmbed } = require('discord.js'),
	{ debug } = require('../config'),
	fetch = require('node-fetch');
let date = Math.floor(Date.now() / 1000);

// Fetch reddit post
class InstagramFetcher {
	constructor(AutoPoster) {
		this.AutoPoster = AutoPoster;
		this.accounts = [];
		this.enabled = true;
	}

	// Fetch new posts (every 1 minute)
	async fetchPosts() {
		setInterval(async () => {
			if (!this.enabled) return;
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
							channelIDs.forEach((id) => { this.AutoPoster.webhookManager.addValues(id, embed);});
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
		const instaData = await AutoPosterSchema.find({}).then(res => res.map(data => data.Instagram));
		if (!instaData[0]) return this.enabled = false;

		// Get all subreddits (remove duplicates)
		const instaAccount = [...new Set(instaData.map(item => item.map(obj => obj.Account)).reduce((a, b) => a.concat(b)))];

		// Put subreddits with their list of channels to post to
		this.accounts = instaAccount.map(acc => ({
			name: acc,
			channelIDs: [...new Set(instaData.map(item => item.filter(obj => obj.Account == acc)).map(obj => obj.map(i => i.channelID)).reduce((a, b) => a.concat(b)))],
		}));
	}

	// init the class
	async init() {
		await this.updateInstagramList();
		await this.fetchPosts();
		// Update subreddit list every 5 minutes
		setInterval(async () => {
			await this.updateInstagramList();
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
   * Function for adding an instgram account
   * @param {obj.channelID} String The channel where it's being added to
   * @param {obj.accountName} String The instgram account that is being added
   * @return {Mongoose.Schema}
  */
	async addItem({ channelID, accountName }) {
		const channel = this.AutoPoster.client.channels.get(channelID);
		if (!channel.guild?.id) throw new Error('Channel does not have a guild ID.');
		let data = await AutoPosterSchema.findOne({ guildID: channel.guild.id });

		if (data) {
			// Add new item to Guild's autoposter data
			data.Instagram.push({ channelID: channel.id, Account: accountName });
		} else {
			data = new AutoPosterSchema({
				guildID: `${channel.guild.id}`,
				Instagram: [{ channelID: channel.id, Account: accountName }],
			});
		}
		return data.save();
	}

	/**
   * Function for removing an instagram account
   * @param {obj.channelID} String The channel where it's being deleted from
   * @param {obj.accountName} String The instagram account that is being deleted
   * @return {Mongoose.Schema}
  */
	async deleteItem({ channelID, accountName }) {
		const channel = this.AutoPoster.client.channels.get(channelID);
		if (!channel.guild?.id) throw new Error('Channel does not have a guild ID.');
		const data = await AutoPosterSchema.findOne({ guildID: channel.guild.id });
		if (!data) throw new Error(`No data found from guild: ${channel.guild.id}`);

		// Delete channel or Account
		data.Instagram.filter(({ Account }) => Account !== accountName);
		return data.save();
	}
}


module.exports = InstagramFetcher;
