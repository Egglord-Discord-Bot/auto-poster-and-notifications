const express = require('express'),
	{ TwitterSchema, RedditSchema, YoutubeSchema } = require('../../database/models'),
	router = express.Router();

router.get('/', async (req, res) => {
	const NumOfTwitter = await TwitterSchema.find({});
	const NumOfReddit = await RedditSchema.find({});
	const NumOfYoutube = await YoutubeSchema.find();
	res.render('index.ejs', {
		reddit: NumOfReddit.map(item => ({ channel: item.channelIDs, subreddit: item.subredditName })),
		twitter: NumOfTwitter.map(item => ({ channel: item.channelIDs, Twitter: item.twitterName })),
		youtube: NumOfYoutube.map(item => ({ channel: item.channelIDs, Twitter: item.channel })),
	});
});

router.post('/', async (req, res) => {
	switch (req.body.Service) {
	case 'Reddit': {
		const data = await RedditSchema.findOne({ subredditName: req.body.account_ID });
		if (data) {
			res.channelIDs.push(req.body.channel);
			await res.save();
		} else {
			(new RedditSchema({
				subredditName: req.body.account_ID,
				channelIDs: [req.body.channel],
			})).save();
		}
		break;
	}
	case 'Twitter': {
		const data = await TwitterSchema.findOne({ twitterName: req.body.account_ID });
		if (data) {
			res.channelIDs.push(req.body.channel);
			await res.save();
		} else {
			(new TwitterSchema({
				twitterName: req.body.account_ID,
				channelIDs: [req.body.channel],
			})).save();
		}
		break;
	}
	case 'Youtube': {
		const data = await YoutubeSchema.findOne({ channel: req.body.account_ID });
		if (data) {
			res.channelIDs.push(req.body.channel);
			await res.save();
		} else {
			(new YoutubeSchema({
				channel: req.body.account_ID,
				channelIDs: [req.body.channel],
			})).save();
		}
		break;
	}
	default:

	}
	console.log(req.body);
	res.redirect('/');
});

module.exports = router;
