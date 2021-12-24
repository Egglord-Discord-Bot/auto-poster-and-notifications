const	{ RedditSchema } = require('../database/models'),
	{ MessageEmbed } = require('discord.js'),
	fetch = require('node-fetch');

let date = Math.floor(Date.now() / 1000);
class RedditFetcher {
	constructor(bot) {
		this.bot = bot;
		this.subreddits = [];
	}

	// Fetch new posts (every 1 minute)
	async fetchPosts() {
		setInterval(async () => {
			for (const { subredditName: sub, channelIDs } of this.subreddits) {
				const resp = await fetch(`https://www.reddit.com/r/${sub}/new.json`).then(res => res.json());
				if (resp.data?.children) {
					for (const post of resp.data.children.reverse()) {
						if (date <= post.data.created_utc) {
							const Post = new RedditPost(post.data);
							const embed = new MessageEmbed()
								.setTitle(`From /${Post.subreddit}`)
								.setURL(Post.link)
								.setImage(Post.imageURL)
								.setFooter(`👍 ${Post.upvotes}   👎 ${Post.downvotes}`);
							channelIDs.forEach((id) => { this.bot.addEmbed(id, embed);});
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
		const subreddits = await RedditSchema.find({});
		if (!subreddits[0]) return this.bot.logger.error('Reddit: No subreddits to load.');

		for (const subreddit of subreddits) {
			if (subreddit.channelIDs.length >= 1) {
				this.bot.logger.log(`Reddit: Added ${subreddit.subredditName} to the watch list.`);
				this.subreddits.push(subreddit);
			} else {
				await RedditSchema.findOneAndRemove({ subredditName: subreddit.subredditName }, (err) => {
					if (err) console.log(err);
				});
			}
		}
	}

	// init the class
	async init() {
		this.bot.logger.log('Reddit: Loading module...');
		await this.updateSubredditList();
		await this.fetchPosts();
		this.bot.logger.ready('Reddit: Loaded module.');
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
		this.imageURL = media ? (media.oembed?.thumbnail_url ?? media.reddit_video.fallback_url) : url;
		this.upvotes = ups ?? 0;
		this.downvotes = downs ?? 0;
		this.author = author;
		this.comments = num_comments ?? 0;
		this.nsfw = over_18;
	}
}

module.exports = RedditFetcher;
