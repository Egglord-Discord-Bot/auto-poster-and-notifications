const	{ AutoPosterSchema } = require('../database/models'),
	{ MessageEmbed } = require('discord.js'),
	{ debug } = require('../config'),
	fetch = require('node-fetch');
const date = Math.floor(Date.now() / 1000);

// Fetch reddit post
class RedditFetcher {
	constructor(AutoPoster) {
		this.AutoPoster = AutoPoster;
		this.subreddits = [];
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

	async addItem(item) {
		const channel = this.AutoPoster.client.channels.get(item.channelID);
		if (!channel.guild?.id) throw new Error('Channel does not have a guild ID.');
		const data = await AutoPosterSchema.findOne({ guildID: item.guild.id });
		data.Reddit.push({ channelID: channel.id, Account: item.accountName });
		await data.save();
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

module.exports = RedditFetcher;
