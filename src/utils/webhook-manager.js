const { Collection } = require('discord.js');

class WebhookManager {
	constructor(client) {
		/**
      * The Discord Client
      * @type {Discord.Client}
    */
		this.client = client;
		/**
			* A collection of messages to send to channels via webhook
			* @type {Discord.Collection}
		*/
		this.messages = new Collection();
	}

	async init() {
		// get list of channel ID's
		const channelIDs = Array.from(this.messages.keys());

		// loop through each channel ID sending their embeds
		for (const ID of channelIDs) {
			try {
				const channel = await this.client.channels.fetch(ID);
				const webhooks = channel.then(c => c.fetchWebhooks());
				let webhook = webhooks.find(wh => wh.name == this.client.user.username);

				// create webhook if it doesn't exist
				if (!webhook) webhook = channel.then(c => c.createWebhook(this.client.user.username));

				// send the embeds
				const repeats = Math.ceil(this.messages.get(ID).length / 10);
				for (let j = 0; j < repeats; j++) {
					// Get the embeds
					const embeds = this.messages.get(ID)?.slice(j * 10, (j * 10) + 10);
					if (!embeds) return;

					await webhook.send({
						username: this.client.user.name,
						avatarURL: this.client.user.displayAvatarURL({ format: 'png', size: 1024 }),
						// make sure only 10 embeds are sent
						embeds: embeds,
					});
				}

				// delete from collection once sent
				this.messages.delete(ID);
			} catch (err) {
				// It was likely they didn't have permission to create/send the webhook
				this.client.logger.error(err.message);
				this.messages.delete(ID);
			}
		}

	}

	/**
	 * Function for adding messages to send to the webhook manager
	 * @param {channelID} String The instantiating client
	 * @param {embed} Discord.MessageEmbed The message that ran the command
	 * @readonly
	*/
	addValues(channelID, embed) {
		// collect embeds
		if (!this.messages.has(channelID)) {
			this.messages.set(channelID, [embed]);
		} else {
			this.messages.set(channelID, [...this.messages.get(channelID), embed]);
		}
	}
}

module.exports = WebhookManager;
