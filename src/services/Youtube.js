const	{ AutoPosterSchema } = require('../database/models'),
	{ MessageEmbed } = require('discord.js'),
	parser = new (require('rss-parser'))();
let date = Math.floor(Date.now() / 1000);

// Fetch reddit post
class VideoFetcher {
	constructor(AutoPoster) {
		this.AutoPoster = AutoPoster;
		this.channels = [];
		this.enabled = true;
	}

	// Fetch new posts (every 1 minute)
	async fetchVideos() {
		setInterval(async () => {
			if (!this.enabled) return;
			for (const { channel, channelIDs } of this.channels) {
				const { items: videos, title, link, pubDate } = await parser.parseURL(`https://www.youtube.com/feeds/videos.xml?channel_id=${channel}`);
				for (const video of videos) {
					if (date <= pubDate) {
						const embed = new MessageEmbed()
							.setColor('RED')
							.setTitle(video.title)
							.setAuthor(title, 'https://yt3.ggpht.com/yti/APfAmoGR2_xZ9odnTRXA0lXy7U7WBjBzHyy-0SNK7fJPMA=s88-c-k-c0x00ffffff-no-rj-mo', link)
							.setURL(video.link)
							.setImage(`http://i1.ytimg.com/vi/${video.id.split(':')[2]}/hqdefault.jpg`)
							.setTimestamp()
							.setFooter(`By: ${title}`);
						channelIDs.forEach((id) => { this.bot.addEmbed(id, embed);});
					}
				}
			}
			date = Math.floor(Date.now() / 1000);
		}, 1 * 60000);
	}

	// Updates subreddit list every 5 minutes
	async updateChannelsList() {
		// fetch reddit data from database
		const youtubeData = await AutoPosterSchema.find({}).then(res => res.map(data => data.Youtube));
		if (!youtubeData[0]) return this.enabled = false;

		// Get all subreddits (remove duplicates)
		const ytaccounts = [...new Set(youtubeData.map(item => item.map(obj => obj.Account)).reduce((a, b) => a.concat(b)))];

		// Put subreddits with their list of channels to post to
		this.channels = ytaccounts.map(acc => ({
			channel: acc,
			channelIDs: [...new Set(youtubeData.map(item => item.filter(obj => obj.Account == acc)).map(obj => obj.map(i => i.channelID)).reduce((a, b) => a.concat(b)))],
		}));
	}

	// init the class
	async init() {
		await this.updateChannelsList();
		await this.fetchVideos();
		// Update subreddit list every 5 minutes
		setInterval(async () => {
			await this.updateChannelsList();
		}, 5 * 60000);
	}

	/**
    * Function for toggling the Youtube auto-poster
    * @return {Void}
  */
	toggle() {
		this.enabled = !this.enabled;
	}

	/**
   * Function for adding a Youtube account
   * @param {obj.channelID} String The channel where it's being added to
   * @param {obj.accountName} String The Youtube account that is being added
   * @return {Mongoose.Schema}
  */
	async addItem({ channelID, accountName }) {
		const channel = this.AutoPoster.client.channels.get(channelID);
		if (!channel.guild?.id) throw new Error('Channel does not have a guild ID.');
		let data = await AutoPosterSchema.findOne({ guildID: channel.guild.id });

		if (data) {
			// Add new item to Guild's autoposter data
			data.Youtube.push({ channelID: channel.id, Account: accountName });
		} else {
			data = new AutoPosterSchema({
				guildID: `${channel.guild.id}`,
				Youtube: [{ channelID: channel.id, Account: accountName }],
			});
		}
		return data.save();
	}

	/**
   * Function for removing a Youtube account
   * @param {obj.channelID} String The channel where it's being deleted from
   * @param {obj.accountName} String The Youtube account that is being deleted
   * @return {Mongoose.Schema}
  */
	async deleteItem({ channelID, accountName }) {
		const channel = this.AutoPoster.client.channels.get(channelID);
		if (!channel.guild?.id) throw new Error('Channel does not have a guild ID.');
		const data = await AutoPosterSchema.findOne({ guildID: channel.guild.id });
		if (!data) throw new Error(`No data found from guild: ${channel.guild.id}`);

		// Delete channel or Account
		data.Youtube.filter(({ Account }) => Account !== accountName);
		return data.save();
	}
}


module.exports = VideoFetcher;
