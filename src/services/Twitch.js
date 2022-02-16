const	{ AutoPosterSchema } = require('../database/models'),
	{ MessageEmbed } = require('discord.js'),
	fetch = require('node-fetch');
let date = Math.floor(Date.now() / 1000);

// Fetch reddit post
class TwitchFetcher {
	constructor(AutoPoster, options) {
		this.AutoPoster = AutoPoster;
		this.accounts = [];
		this.enabled = true;
		this.access_token = null;
		this.options = options;
	}

	// Fetch new posts (every 1 minute)
	async fetchPosts() {
		setInterval(async () => {
			if (!this.enabled) return;
			for (const { account, channelIDs } of this.accounts) {
				const data = await this.request('/streams', { user_login: account }).then(s => s && s.data[0]);
				if (data && date >= new Date(data.started_at).getTime()) {
					const embed = new MessageEmbed()
						.setTitle(data.user_name)
						.setURL(`https://twitch.tv/${data.login}`)
						.setImage(data.thumbnail_url.replace('{width}', 1920).replace('{height}', 1080));
					channelIDs.forEach((id) => {this.AutoPoster.webhookManager.addValues(id, embed);});
				}
			}
			date = Math.floor(Date.now() / 1000);
		}, 60000);
	}

	// Updates subreddit list every 5 minutes
	async updateSubredditList() {
		// fetch reddit data from database
		const twitchData = await AutoPosterSchema.find({}).then(res => res.map(data => data.Twitch));
		if (!twitchData[0]) return this.enabled = false;

		// Get all subreddits (remove duplicates)
		const twitchacc = [...new Set(twitchData.map(item => item.map(obj => obj.Account)).reduce((a, b) => a.concat(b)))];

		// Put subreddits with their list of channels to post to
		this.accounts = twitchacc.map(sub => ({
			account: sub,
			channelIDs: [...new Set(twitchData.map(item => item.filter(obj => obj.Account == sub)).map(obj => obj.map(i => i.channelID)).reduce((a, b) => a.concat(b)))],
		}));
	}

	// init the class
	async init() {
		await this.refreshTokens();
		await this.updateSubredditList();
		await this.fetchPosts();
		// Update subreddit list every 5 minutes
		setInterval(async () => {
			await this.updateSubredditList();
		}, 5 * 60000);
	}

	/**
	 * Function for toggling the Twitch auto-poster
	 * @return {Void}
	*/
	toggle() {
		this.enabled = !this.enabled;
	}

	/**
	 * Function for adding a Twitch account
	 * @param {obj.channelID} String The channel where it's being added to
	 * @param {obj.accountName} String The Twitch account that is being added
	 * @return {Mongoose.Schema}
	*/
	async addItem({ channelID, accountName }) {
		const channel = await this.AutoPoster.client.channels.fetch(channelID);
		if (!channel.guild?.id) throw new Error('Channel does not have a guild ID.');
		let data = await AutoPosterSchema.findOne({ guildID: channel.guild.id });

		if (data) {
			// Add new item to Guild's autoposter data
			data.Twitch.push({ channelID: channel.id, Account: accountName });
		} else {
			data = new AutoPosterSchema({
				guildID: `${channel.guild.id}`,
				Twitch: [{ channelID: channel.id, Account: accountName }],
			});
		}
		return data.save();
	}

	/**
	 * Function for removing a Twitch account
	 * @param {obj.channelID} String The channel where it's being deleted from
	 * @param {obj.accountName} String The Twitch account that is being deleted
	 * @return {Mongoose.Schema}
	*/
	async deleteItem({ channelID, accountName }) {
		const channel = await this.AutoPoster.client.channels.fetch(channelID);
		if (!channel.guild?.id) throw new Error('Channel does not have a guild ID.');
		const data = await AutoPosterSchema.findOne({ guildID: channel.guild.id });
		if (!data) throw new Error(`No data found from guild: ${channel.guild.id}`);

		// Delete channel or Account
		data.Twitch.filter(({ Account }) => Account !== accountName);
		return data.save();
	}

	/**
   * Function for fetching access_token to interact with the twitch API
   * @param {bot} bot The instantiating client
   * @returns {string}
  */
	async refreshTokens() {
		const data = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${this.options.clientID}&client_secret=${this.options.clientSecret}&grant_type=client_credentials`, {
			method: 'POST',
		}).then(res => res.json());
		this.access_token = data.access_token;
	}

	/**
   * Function for fetching data from twitch API
   * @param {bot} bot The instantiating client
   * @param {string} endpoint the endpoint of the twitch API to request
   * @param {object} queryParams The query sent to twitch API
   * @returns {object}
  */
	request(endpoint, queryParams = {}) {
		const qParams = new URLSearchParams(queryParams);
		return fetch('https://api.twitch.tv/helix' + endpoint + `?${qParams.toString()}`, {
			headers: { 'Client-ID': this.options.clientID, 'Authorization': `Bearer ${this.access_token}` },
		}).then(res => res.json())
			.then(data => {
				if (data.error === 'Unauthorized') {
					return this.refreshTokens()
						.then(() => this.request(endpoint, queryParams));
				}
				return data;
			}).catch(e => console.log(e));
	}
}

module.exports = TwitchFetcher;
