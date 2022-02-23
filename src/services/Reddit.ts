import type {AutoPoster} from '../index'
import {AutoPosterSchema} from '../database/models'
import { MessageEmbed } from 'discord.js';
import type { Accounts, Input, Reddit } from '../utils/types'
let date = Math.floor(Date.now() / 1000);

// Fetch reddit post
class RedditFetcher {
	public AutoPoster: AutoPoster
	public subreddits: Array<Accounts>
	public enabled: Boolean
	constructor(AutoPoster: AutoPoster) {
		this.AutoPoster = AutoPoster;
		this.subreddits = [];
		this.enabled = true;
	}

	/**
	 	* Function for fetching new posts on the subreddit
	*/
	async fetchPosts() {
		setInterval(async () => {
			if (!this.enabled) return;
			for (const { name: sub, channelIDs } of this.subreddits) {
				const resp = await fetch(`https://www.reddit.com/r/${sub}/new.json`).then(res => res.json());
				if (resp.data?.children) {
					for (const { data } of resp.data.children.reverse()) {
						if (date <= data.created_utc) {
							const Post = new RedditPost(data);
							const embed = new MessageEmbed()
								.setTitle(`New post from r/${Post.subreddit}`)
								.setURL(Post.link)
								.setImage(Post.imageURL);
							if (Post.text) embed.setDescription(Post.text);
							channelIDs.forEach((id) => {this.AutoPoster.webhookManager.addValues(id, embed);});
						}
					}
				}
			}
			date = Math.floor(Date.now() / 1000);
		}, 60000);
	}

	/**
	 	* Function for fetching the subreddit list
	*/
	async updateSubredditList() {
		// fetch reddit data from database
		const redditData = await AutoPosterSchema.find({}).then(res => res.map(data => data.Reddit));
		if (!redditData[0]) return this.enabled = false;

		// Get all subreddits (remove duplicates)
		const subreddits = [...new Set(redditData.map(item => item.map(obj => obj.Account)).reduce((a, b) => a.concat(b)))];

		// Put subreddits with their list of channels to post to
		this.subreddits = subreddits.map(sub => ({
			name: sub,
			channelIDs: [...new Set(redditData.map(item => item.filter(obj => obj.Account == sub)).map(obj => obj.map(i => i.channelID)).reduce((a, b) => a.concat(b)))],
		}));
	}

	/**
	 	* Function for starting the Reddit auto-poster
	*/
	async init() {
		await this.updateSubredditList();
		await this.fetchPosts();
		// Update subreddit list every 5 minutes
		setInterval(async () => {
			await this.updateSubredditList();
		}, 5 * 60000);
	}

	/**
	 	* Function for toggling the Reddit auto-poster
	*/
	toggle() {
		this.enabled = !this.enabled;
	}

	/**
   	* Function for adding a subreddit
   	* @param {input} input the input
   	* @param {string} input.channelID The channel where it's being added to
   	* @param {string} input.accountName The subreddit that is being added
   	* @return Promise<Document>
  */
	async addItem({ channelID, accountName }: Input) {
		const channel = await this.AutoPoster.client.channels.fetch(channelID);
		if (!channel.guild?.id) throw new Error('Channel does not have a guild ID.');
		let data = await AutoPosterSchema.findOne({ guildID: channel.guild.id });

		if (data) {
			// Add new item to Guild's autoposter data
			data.Reddit.push({ channelID: channel.id, Account: accountName });
		} else {
			data = new AutoPosterSchema({
				guildID: `${channel.guild.id}`,
				Reddit: [{ channelID: channel.id, Account: accountName }],
			});
		}
		return data.save();
	}

	/**
   	* Function for removing an subreddit
   	* @param {input} input the input
   	* @param {string} input.channelID The channel where it's being deleted from
   	* @param {string} input.accountName The subreddit that is being removed
   	* @return Promise<Document>
  */
	async deleteItem({ channelID, accountName }: Input) {
		const channel = await this.AutoPoster.client.channels.fetch(channelID);
		if (!channel.guild?.id) throw new Error('Channel does not have a guild ID.');
		const data = await AutoPosterSchema.findOne({ guildID: channel.guild.id });
		if (!data) throw new Error(`No data found from guild: ${channel.guild.id}`);

		// Delete channel or Account
		data.Reddit.filter(({ Account }) => Account !== accountName);
		return data.save();
	}
}


class RedditPost {
	public title: string
	public subreddit: string
	public link: string
	public imageURL: string
	public text: string
	public author: string
	public nsfw: Boolean
	constructor({ title, subreddit_name_prefixed, permalink, url, author, over_18, media, selftext }: Reddit) {
		this.title = title;
		this.subreddit = subreddit_name_prefixed;
		this.link = `https://www.reddit.com${permalink}`;
		this.imageURL = media ? (media.oembed?.thumbnail_url ?? media.reddit_video.fallback_url) : url;
		this.text = selftext ?? null;
		this.author = author;
		this.nsfw = over_18;
	}
}

export default RedditFetcher;
