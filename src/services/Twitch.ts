import type {AutoPoster} from '../index'
import {AutoPosterSchema} from '../database/models'
import { MessageEmbed } from 'discord.js';
let date = Math.floor(Date.now() / 1000);

type Accounts = {
  account: string;
	channelIDs: Array<String>
}

type input = {
  channelID: string;
  accountName: string;
}

type Options = {
	clientID: string
	clientSecret: string
}

// Fetch reddit post
class TwitchFetcher {
	public AutoPoster: AutoPoster
	public accounts: Array<Accounts>
	public enabled: Boolean
	public access_token: null | string
	public options: Options
	constructor(AutoPoster: AutoPoster, options: Options) {
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
	*/
	toggle() {
		this.enabled = !this.enabled;
	}

	/**
   * Function for adding an Twitch account
   * @param {input} input the input
   * @param {string} input.channelID The channel where it's being added to
   * @param {string} input.accountName The Twitch account that is being added
   * @return Promise<Document>
  */
	async addItem({ channelID, accountName }: input) {
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
   * Function for removing an Twitch account
   * @param {input} input the input
   * @param {string} input.channelID The channel where it's being deleted from
   * @param {string} input.accountName The Twitch account that is being removed
   * @return Promise<Document>
  */
	async deleteItem({ channelID, accountName }: input) {
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
  */
	async refreshTokens() {
		const data = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${this.options.clientID}&client_secret=${this.options.clientSecret}&grant_type=client_credentials`, {
			method: 'POST',
		}).then(res => res.json());
		this.access_token = data.access_token;
	}

	/**
   * Function for fetching data from twitch API
   * @param {string} endpoint the endpoint of the twitch API to request
   * @param {object} queryParams The query sent to twitch API
   * @returns {object}
  */
	request(endpoint: string, queryParams = {}) {
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

export default TwitchFetcher;
