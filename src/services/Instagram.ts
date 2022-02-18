import type {AutoPoster} from '../index'
import {AutoPosterSchema} from '../database/models'
import { MessageEmbed } from 'discord.js';
const {get} = require('axios').default;
let date = Math.floor(Date.now() / 1000);

type Accounts = {
  name: string;
	channelIDs: Array<String>
}

type input = {
  channelID: string;
  accountName: string;
}

type DBinput = {
  channelID: string;
  Account: string;
}

// Fetch reddit post
class InstagramFetcher {
	public AutoPoster: AutoPoster
	public accounts: Array<Accounts>
	public enabled: Boolean

	constructor(AutoPoster: AutoPoster) {
		this.AutoPoster = AutoPoster;
		this.accounts = [];
		this.enabled = true;
	}

	// Fetch new posts (every 1 minute)
	async fetchPosts() {
		setInterval(async () => {
			if (!this.enabled) return;
			for (const { name: accountName, channelIDs } of this.accounts) {
				try {
					const { graphql: { user: { edge_owner_to_timeline_media: photos } } } = await get(`https://www.instagram.com/${accountName}/feed/?__a=1`).then((res: any) => JSON.parse(res.data));
					if (photos.edges.length >= 1) {
						for (const { node } of photos.edges) {
							if (date <= (node.taken_at_timestamp)) {
								const embed = new MessageEmbed()
									.setTitle(`New post by ${node.owner.username}`)
									.setURL(`https://www.instagram.com/p/${node.shortcode}`)
									.setImage(node.display_url)
									.setTimestamp(node.taken_at_timestamp * 1000);
								channelIDs.forEach((id: String) => { this.AutoPoster.webhookManager.addValues(id, embed);});
							}
						}
					}
				} catch (e) {
					// error fetching URL
				}
			}
			date = Math.floor(Date.now() / 1000);
		}, 60000);
	}

	// Updates subreddit list every 5 minutes
	async updateInstagramList() {
		// fetch reddit data from database
		const instaData = await AutoPosterSchema.find({}).then((res: Array<any>) => res.map(data => data.Instagram));
		if (!instaData[0]) return this.enabled = false;

		// Get all subreddits (remove duplicates)
		const instaAcc = [...new Set(instaData.map((item: any) => item.map((obj: DBinput) => obj.Account)).reduce((a: Array<string>, b: Array<string>) => a.concat(b)))];

		// Put subreddits with their list of channels to post to
		this.accounts = instaAcc.map(name => ({
			name: name,
			channelIDs: [...new Set(instaData.map((item: any) => item.filter((obj: DBinput) => obj.Account == name))
        .map((obj: any) => obj.map((i: DBinput) => i.channelID))
        .reduce((a: Array<string>, b: Array<string>) => a.concat(b)))
      ],
		}));
	}

	// init the class
	async init() {
		await this.updateInstagramList();
		await this.fetchPosts();
		// Update subreddit list every 5 minutes
		setInterval(async () => {
			await this.updateInstagramList();
		}, 5 * 60000);
	}

	/**
   * Function for toggling the Instagram auto-poster
  */
	toggle() {
		this.enabled = !this.enabled;
	}

	/**
   * Function for adding an instgram account
   * @param {input} input the input
   * @param {string} input.channelID The channel where it's being added to
   * @param {string} input.accountName The instagram account that is being added
   * @return Promise<Document>
  */
	async addItem({ channelID, accountName }: input) {
		const channel = await this.AutoPoster.client.channels.fetch(channelID);
		if (!channel.guild?.id) throw new Error('Channel does not have a guild ID.');
		let data = await AutoPosterSchema.findOne({ guildID: channel.guild.id });

		if (data) {
			// Add new item to Guild's autoposter data
			data.Instagram.push({ channelID: channel.id, Account: accountName });
		} else {
			data = new AutoPosterSchema({
				guildID: `${channel.guild.id}`,
				Instagram: [{ channelID: channel.id, Account: accountName }],
			});
		}
		await data.save();
    return data.Instagram
	}

  /**
   * Function for removing an instgram account
   * @param {input} input the input
   * @param {string} input.channelID The channel where it's being deleted from
   * @param {string} input.accountName The instagram account that is being removed
   * @return Promise<Document>
  */
	async deleteItem({ channelID, accountName }: input) {
		const channel = await this.AutoPoster.client.channels.fetch(channelID);
		if (!channel.guild?.id) throw new Error('Channel does not have a guild ID.');
		const data = await AutoPosterSchema.findOne({ guildID: channel.guild.id });
		if (!data) throw new Error(`No data found from guild: ${channel.guild.id}`);

		// Delete channel or Account
		data.Instagram.filter(({ Account }) => Account !== accountName);
		return data.save();
	}
}


export default InstagramFetcher;
