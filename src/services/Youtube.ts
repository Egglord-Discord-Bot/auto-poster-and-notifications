import type {AutoPoster} from '../index'
import {AutoPosterSchema} from '../database/models'
import { MessageEmbed } from 'discord.js';
import type { Accounts, Input } from '../utils/types'

const	parser = new (require('rss-parser'))();
let date = Math.floor(Date.now() / 1000);

// Fetch reddit post
class VideoFetcher {
	public AutoPoster: AutoPoster
	public channels: Array<Accounts>
	public enabled: Boolean
	constructor(AutoPoster: AutoPoster) {
		this.AutoPoster = AutoPoster;
		this.channels = [];
		this.enabled = true;
	}

	/**
		* Function for fetching new posts on the subreddit
	*/
	async fetchVideos() {
		setInterval(async () => {
			if (!this.enabled) return;
			for (const { name: channel, channelIDs } of this.channels) {
				const { items: videos, title, link, pubDate } = await parser.parseURL(`https://www.youtube.com/feeds/videos.xml?channel_id=${channel}`);
				for (const video of videos) {
					if (date <= pubDate) {
						const embed = new MessageEmbed()
							.setColor('RED')
							.setTitle(video.title)
							.setAuthor({name: title, iconURL: 'https://yt3.ggpht.com/yti/APfAmoGR2_xZ9odnTRXA0lXy7U7WBjBzHyy-0SNK7fJPMA=s88-c-k-c0x00ffffff-no-rj-mo', url: link})
							.setURL(video.link)
							.setImage(`http://i1.ytimg.com/vi/${video.id.split(':')[2]}/hqdefault.jpg`)
							.setTimestamp()
							.setFooter({text: `By: ${title}`});
						channelIDs.forEach((id) => { this.AutoPoster.webhookManager.addValues(id, embed);});
					}
				}
			}
			date = Math.floor(Date.now() / 1000);
		}, 1 * 60000);
	}

	/**
		* Function for fetching the Twitter list
	*/
	async updateChannelsList() {
		// fetch reddit data from database
		const youtubeData = await AutoPosterSchema.find({}).then(res => res.map(data => data.Youtube));
		if (!youtubeData[0]) return this.enabled = false;

		// Get all subreddits (remove duplicates)
		const ytaccounts = [...new Set(youtubeData.map(item => item.map(obj => obj.Account)).reduce((a, b) => a.concat(b)))];

		// Put subreddits with their list of channels to post to
		this.channels = ytaccounts.map(acc => ({
			name: acc,
			channelIDs: [...new Set(youtubeData.map(item => item.filter(obj => obj.Account == acc)).map(obj => obj.map(i => i.channelID)).reduce((a, b) => a.concat(b)))],
		}));
	}

	/**
		* Function for starting the Reddit auto-poster
	*/
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
  */
	toggle() {
		this.enabled = !this.enabled;
	}

	/**
   * Function for adding an Youtube account
   * @param {input} input the input
   * @param {string} input.channelID The channel where it's being added to
   * @param {string} input.accountName The Youtube account that is being added
   * @return Promise<Document>
  */
	async addItem({ channelID, accountName }: Input) {
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
   * Function for removing an Youtube account
   * @param {input} input the input
   * @param {string} input.channelID The channel where it's being deleted from
   * @param {string} input.accountName The Youtube account that is being removed
   * @return Promise<Document>
  */
	async deleteItem({ channelID, accountName }: Input) {
		const channel = this.AutoPoster.client.channels.get(channelID);
		if (!channel.guild?.id) throw new Error('Channel does not have a guild ID.');
		const data = await AutoPosterSchema.findOne({ guildID: channel.guild.id });
		if (!data) throw new Error(`No data found from guild: ${channel.guild.id}`);

		// Delete channel or Account
		data.Youtube.filter(({ Account }) => Account !== accountName);
		return data.save();
	}
}


export default VideoFetcher;
