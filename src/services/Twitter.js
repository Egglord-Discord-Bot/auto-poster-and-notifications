const { TwitterSchema } = require('../database/models');
const Discord = require('discord.js');
const Twitter = require('twitter-lite');
const twtaccounts = [];
let twt;
module.exports = async (bot, debug = true) => {
	// fetch data
	let twitter;

	async function RetrivedDate() {
		// fetch reddit data from database
		twitter = await TwitterSchema.find({});
		if (!twitter[0]) return bot.logger.error('No subreddits to load.');

		twt = [];
		for (let i = 0; i < twitter.length; i++) {
			if (twitter[i].channelIDs.length >= 1) {
				twt.push(twitter[i].twitterName);
			} else {
				// delete from DB
				await TwitterSchema.findOneAndRemove({ twitterName: twitter[i].twitterName }, (err) => {
					if (err) console.log(err);
				});
			}
		}
	}
	await RetrivedDate();

	const tokens = bot.config.twitter;

	const twitter_client = new Twitter(tokens);

	for (let i = 0; i < twt.length; i++) {
		const result = await twitter_client.get('users/show', { screen_name: twt[i] })
			.catch(err => {
				console.log(`Twitter User GET request error for ${twt[i]}: ` + err.errors[0].message + ' - ' + err.errors[0].code);
				console.log(err);
				if (err.errors[0].code == 50 || err.errors[0].code == 63 || err.errors[0].code == 32) {
					console.error('Account not found!');
					process.exit(1);
				}
				return;
			});

		twtaccounts.push({
			'id' : result.id_str,
			'twitter_name' : twt[i],
		});
	}


	function functiondate() {
		const datefu = new Date();
		const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
		const year = datefu.getFullYear();
		const month = months[datefu.getMonth()];
		const getdate = datefu.getDate();
		const date = getdate + ' ' + month + ' ' + year;
		return date;
	}

	function functiontime() {
		const datefu = new Date();
		const hour = datefu.getHours();
		const min = datefu.getMinutes();
		const sec = datefu.getSeconds();
		const time = hour + ':' + min + ':' + sec;
		return time;
	}
	let watchingids;
	if (twtaccounts.length > 1) {
		watchingids = [];
		twtaccounts.forEach(acc=>{
			watchingids.push(acc.id);
		});
		watchingids.join(', ');
	} else {
		watchingids = twtaccounts[0].id;
	}

	const Tstream = twitter_client.stream('statuses/filter', { follow: watchingids });

	Tstream.on('start', function(start_result) {
		if (start_result.status == 200) {
			console.log('🟢 Streaming API started');
			twtaccounts.forEach(acc => {
				console.log(`Watching ${acc.twitter_name} - ID ${acc.id}`);
			});
		} else {
			console.log(start_result.statusText);
		}
	});

	Tstream.on('end', async () => {
		console.log('🔴 Streaming API ended');
		process.exit(2);
	});

	Tstream.on('data', async function(tweet) {
		try {
			twtaccounts.forEach(async acc => {
				if (!tweet.text || tweet.text == '') return;
				if (tweet.user.id_str == acc.id) {
					const debug_header = `[${functiondate()} - ${functiontime()} - ${acc} ] `;

					const embed = new Discord.MessageEmbed;

					const webhooks = await bot.channels.cache.get('761612724370931722').fetchWebhooks();
					let webhook = webhooks.find(wh => wh.name == bot.user.username);
					if (!webhook) {
						webhook = await bot.channels.cache.get('761612724370931722').createWebhook(bot.user.username);
					}

					tweet.text.replace('&amp;', '&');
					if (tweet.retweeted || tweet.text.startsWith('RT')) {
						if (acc.retweet) {
							if (debug) console.log(debug_header + `Retweet from @${tweet.retweeted_status.user.screen_name}`);
							embed.setColor(acc.embed_color ? acc.embed_color : 'RANDOM')
								.setAuthor(`Retweet\n${tweet.retweeted_status.user.name} (@${tweet.retweeted_status.user.screen_name})`, tweet.retweeted_status.user.profile_image_url_https.replace('normal.jpg', '200x200.jpg'), `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`)
								.setDescription(tweet.retweeted_status.text)
								.setTimestamp(tweet.retweeted_status.created_at)
								.setThumbnail('https://img.icons8.com/color/96/000000/retweet.png');
							if (tweet.retweeted_status.entities.media) embed.setImage(tweet.retweeted_status.entities.media[0].media_url_https);
							if (bot.channels.cache.get('785239604072415232')) {
								webhook.send('', {
									username: tweet.user.name,
									avatarURL: tweet.user.profile_image_url_https.replace('normal.jpg', '200x200.jpg'),
									embeds: [embed],
								});
							} else {return;}
						} else if (!debug) {
							console.log(debug_header + `Retweet from @${tweet.retweeted_status.user.screen_name}, but retweet config is disabled`);
						}
					} else if (tweet.retweeted === false || !tweet.text.startsWith('RT')) {
						if (tweet.in_reply_to_status_id == null || tweet.in_reply_to_user_id == null) {
							if (debug === true) console.log(debug_header + `Simple tweet, id ${tweet.id_str}`);
							embed.setColor(acc.embed_color ? acc.embed_color : 'RANDOM')
								.setAuthor(`${tweet.user.name} (@${tweet.user.screen_name})`, tweet.user.profile_image_url_https.replace('normal.jpg', '200x200.jpg'), `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`)
								.setDescription(tweet.text)
								.setTimestamp(tweet.created_at);
							if (tweet.entities.media) embed.setImage(tweet.entities.media[0].media_url_https);
							if (bot.channels.cache.get('785239604072415232')) {
								webhook.send('', {
									username: tweet.user.name,
									avatarURL: tweet.user.profile_image_url_https.replace('normal.jpg', '200x200.jpg'),
									embeds: [embed],
								});
							} else {
								return;
							}
						} else if (tweet.in_reply_to_status_id != null || tweet.in_reply_to_user_id != null) {
							if (!acc.reply) {
								if (debug) console.log(debug_header + 'Reply to a tweet, but reply option is off');
							} else {
								if (debug) console.log(debug_header + `Reply to a tweet, id ${tweet.in_reply_to_status_id}`);
								embed.setColor(acc.embed_color ? acc.embed_color : 'RANDOM')
									.setAuthor(`${tweet.user.name} (@${tweet.user.screen_name})\nReply to @${tweet.in_reply_to_screen_name}`, tweet.user.profile_image_url_https.replace('normal.jpg', '200x200.jpg'), `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`)
									.setDescription(tweet.text.replace(`@${tweet.in_reply_to_screen_name}`, ''))
									.setTimestamp(tweet.created_at)
									.setThumbnail('https://cdn1.iconfinder.com/data/icons/messaging-3/48/Reply-512.png');
								if (tweet.entities.media) embed.setImage(tweet.entities.media[0].media_url_https);
								if (bot.channels.cache.get('785239604072415232')) {
									webhook.send('', {
										username: tweet.user.name,
										avatarURL: tweet.user.profile_image_url_https.replace('normal.jpg', '200x200.jpg'),
										embeds: [embed],
									});
								} else {
									return;
								}
							}
						}
					}
				}
			});
		} catch (e) {
			if (debug) console.log('ERROR: ' + e);
			if (debug) console.log(tweet);
		}
	});

	Tstream.on('error', function(err) {
		console.log(`[${functiondate()} - ${functiontime()} ] globaltwit stream error:`);
		console.log(err);
	});

	Tstream.on('stall_warnings', function(stall) {
		bot.users.find(u => u.id == bot.config.owner_id).send(`:warning: ${stall.warning.message}`);
		console.log(`[${functiondate()} - ${functiontime()} ] ${stall.warning.message} - ` + stall.warning.code);
	});
};
