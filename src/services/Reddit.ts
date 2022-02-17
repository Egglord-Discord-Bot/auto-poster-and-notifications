const	{ AutoPosterSchema } = require('../database/models'),
	{ MessageEmbed } = require('discord.js'),
	fetch = require('node-fetch');
let date = Math.floor(Date.now() / 1000);

// Fetch reddit post
class RedditFetcher {
	constructor(AutoPoster) {
		this.AutoPoster = AutoPoster;
		this.subreddits = [];
		this.enabled = true;
	}

	// Fetch new posts (every 1 minute)
	async fetchPosts() {
		setInterval(async () => {
			if (!this.enabled) return;
			for (const { subredditName: sub, channelIDs } of this.subreddits) {
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

	// Updates subreddit list every 5 minutes
	async updateSubredditList() {
		// fetch reddit data from database
		const redditData = await AutoPosterSchema.find({}).then(res => res.map(data => data.Reddit));
		if (!redditData[0]) return this.enabled = false;

		// Get all subreddits (remove duplicates)
		const subreddits = [...new Set(redditData.map(item => item.map(obj => obj.Account)).reduce((a, b) => a.concat(b)))];

		// Put subreddits with their list of channels to post to
		this.subreddits = subreddits.map(sub => ({
			subredditName: sub,
			channelIDs: [...new Set(redditData.map(item => item.filter(obj => obj.Account == sub)).map(obj => obj.map(i => i.channelID)).reduce((a, b) => a.concat(b)))],
		}));
	}

	// init the class
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
	 * @return {Void}
	*/
	toggle() {
		this.enabled = !this.enabled;
	}

	/**
	 * Function for adding a subreddit
	 * @param {obj.channelID} String The channel where it's being added to
	 * @param {obj.accountName} String The subreddit that is being added
	 * @return {Mongoose.Schema}
	*/
	async addItem({ channelID, accountName }) {
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
	 * Function for removing a subreddit
	 * @param {obj.channelID} String The channel where it's being deleted from
	 * @param {obj.accountName} String The subreddit that is being deleted
	 * @return {Mongoose.Schema}
	*/
	async deleteItem({ channelID, accountName }) {
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
	constructor({ title, subreddit_name_prefixed, permalink, url, author, over_18, media, selftext }) {
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
