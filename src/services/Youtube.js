const	{ YoutubeSchema } = require('../database/models'),
	{ MessageEmbed } = require('discord.js'),
	{ debug } = require('../config'),
	parser = new (require('rss-parser'))();
let date = Math.floor(Date.now() / 1000);

// Fetch reddit post
class VideoFetcher {
	constructor(bot) {
		this.bot = bot;
		this.channels = [];
	}

	// Fetch new posts (every 1 minute)
	async fetchVideos() {
		setInterval(async () => {
			for (const { channel, channelIDs } of this.channels) {
				const { items: videos, title, link, pubDate } = await parser.parseURL(`https://www.youtube.com/feeds/videos.xml?channel_id=${channel}`);
				for (const video of videos) {
					if (date <= pubDate) {
						if (debug) this.bot.logger.debug(`${title} just uploaded a new video: ${video.title}.`);
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
		const channels = await YoutubeSchema.find({});
		if (!channels[0]) return this.bot.logger.error('Youtube: No channels to load.');

		this.channels = [];
		for (const { channel, channelIDs } of channels) {
			if (channelIDs.length >= 1) {
				this.bot.logger.log(`Youtube: Added ${channel} to the watch list.`);
				this.channels.push({ channel, channelIDs });
			} else {
				await YoutubeSchema.findOneAndRemove({ channel: channel }, (err) => {
					if (err) console.log(err);
				});
			}
		}
	}

	// init the class
	async init() {
		this.bot.logger.log('Youtube: Loading module...');
		await this.updateChannelsList();
		await this.fetchVideos();
		this.bot.logger.ready('Youtube: Loaded module.');
		// Update subreddit list every 5 minutes
		setInterval(async () => {
			await this.updateChannelsList();
		}, 5 * 60000);
	}
}


module.exports = VideoFetcher;
