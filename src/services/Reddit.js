const { MessageEmbed } = require('discord.js'),
	{ RedditSchema } = require('../database/models'),
	fetch = require('node-fetch');

let date = Math.floor(Date.now() / 1000);
class RedditFetcher {
	constructor(bot) {
		this.bot = bot;
		this.subreddits;
	}

	async fetchPosts() {
		setInterval(async () => {
			this.subreddits.forEach(async sub => {
				console.log(sub);
				if (sub) {
					const resp = await fetch(`https://www.reddit.com/r/${sub}/new.json`).then(res => res.json());
					if (resp.data?.children) {
						for (const post of resp.data.children.reverse()) {
							console.log(date);
							console.log(post.data.created_utc);
							console.log(date <= post.data.created_utc);
							if (date <= post.data.created_utc) {
								const t = new RedditPost(post);
								console.log(t);
							}
						}
					}
				}
			});
			date = Math.floor(Date.now() / 1000);
		}, 60000);
	}

	// Updates subreddit list every 5 minutes
	async updateSubredditList() {
		// fetch reddit data from database
		const subreddit = await RedditSchema.find({});
		if (!subreddit[0]) return this.bot.logger.error('No subreddits to load.');

		const subreddits = [];
		for (let i = 0; i < subreddit.length; i++) {
			if (subreddit[i].channelIDs.length >= 1) {
				subreddits.push(subreddit[i].subredditName);
			} else {
				// delete from DB
				await RedditSchema.findOneAndRemove({ subredditName: subreddit[i].subredditName }, (err) => {
					if (err) console.log(err);
				});
			}
		}
		this.subreddits = subreddits;
	}

	// init the class
	async init() {
		await this.updateSubredditList();
		await new Promise(res => setTimeout(res, 60 * 1000));
		await this.fetchPosts();

		// Update subreddit list every 5 minutes
		setInterval(async () => {
			await this.updateSubredditList();
		}, 5 * 60000);
	}
}

class RedditPost {
	constructor({ title, subreddit, permalink, url, ups, downs, author, num_comments, over_18, media }) {
		this.title = title;
		this.subreddit = subreddit;
		this.link = `https://www.reddit.com${permalink}`;
		this.imageURL = media ? media.oembed.thumbnail_url : url;
		this.upvotes = ups ?? 0;
		this.downvotes = downs ?? 0;
		this.author = author;
		this.comments = num_comments ?? 0;
		this.nsfw = over_18;
	}
}

module.exports = RedditFetcher;
