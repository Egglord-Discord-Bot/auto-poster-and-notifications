const { MessageEmbed } = require('discord.js');
const { RedditSchema } = require('../database/models');
let date = Math.floor(Date.now() / 1000);

async function fetchSub(sub) {
	return new Promise((resolve) => {
		try {
			require('request')({ url: `https://reddit.com/r/${sub}/new.json?limit=3`, json: true }, async (err, res, body) => {
				if (!res) res = { statusCode: 404 };
				if (res.statusCode === 200) {
					const posts = [];
					for await (const post of body.data.children.reverse()) {
						if (date <= post.data.created_utc) {
							date = post.data.created_utc;
							const p = post.data;
							posts.push({
								title: p.title || '',
								url: p.url || '',
								permalink: `https://reddit.com${p.permalink}`,
								author: {
									name: p.author || 'Deleted',
								},
								sub: {
									name: p.subreddit || sub,
								},
							});
						}
					}
					if (posts.length === 0) return resolve([]);
					++date;
					return resolve(posts);
				}
			});
		} catch(err) {
			console.log(err);
			resolve([]);
		}
	});
}

module.exports = async (bot) => {
	let subreddits, subreddit;
	async function RetrivedDate() {
		// fetch reddit data from database
		subreddit = await RedditSchema.find({});
		if (!subreddit[0]) return bot.logger.error('No subreddits to load.');

		subreddits = [];
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
	}
	await RetrivedDate();


	setInterval(async () => {
		await RetrivedDate();
	}, 5 * 60000);

	bot.logger.ready(`Reddit poster loaded, listening to ${subreddits.length} subreddits`);

	setInterval(async () => {
		subreddits.forEach(async sub => {
			if (sub) {
				const res = await fetchSub(sub);
				if (res.length !== 0) {
					bot.logger.debug(`Retrieved ${res.length} new subreddit posts`);
					for (let i = 0; i < res.length; i++) {
						// find channelID's for subreddit and post
						for (let z = 0; z < subreddit.length; z++) {
							if (subreddit[z].subredditName == res[i].sub.name) {
								for (let y = 0; y < subreddit[z].channelIDs.length; y++) {
									const channel = bot.channels.cache.get(subreddit[z].channelIDs[y]);
									if (channel) {
										const embed = new MessageEmbed()
											.setTitle(res[i].title)
											.setImage(res[i].url)
											.setFooter(`u/${res[i].author.name} | r/${res[i].sub.name}`)
											.setURL(res[i].permalink)
											.setTimestamp()
											.setColor('RANDOM');
										bot.addEmbed(channel.id, embed);
									}
								}
							}
						}
					}
				}
			}
		});
	}, 60000);
};
