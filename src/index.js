const { Instagram, Reddit, Twitch, Twitter, Youtube } = require('./services');

class AutoPoster {
	constructor(client, options) {
		/**
      * The Discord Client
      * @type {Discord.Client}
    */
		this.client = client;
		/**
      * Whether the manager is ready
      * @type {Boolean}
    */
		this.ready = false;
		/**
      * The webhook manager
      * @type {WebhookManager}
    */
		this.webhookManager = require('./utils/webhook-manager');
		/**
			* The services
			* @type {ServiceManager}
		*/
		if (this.options?.Instagram) this.Instagram = new Instagram(this);
		if (this.options?.Reddit) this.Reddit = new Reddit(this);
		if (this.options?.Twitch) this.Twitch = new Twitch(this);
		if (this.options?.Twitter) this.Twitter = new Twitter(this);
		if (this.options?.Youtube) this.Youtube = new Youtube(this);

		this.options = options;
		if (this.ready) this.init();
	}

	async init() {
		await Promise.all([
			await this.Instagram?.init(),
			await this.Reddit?.init(),
			await this.Twitch?.init(),
			await this.Twitter?.init(),
			await this.Youtube?.init(),
		]);
	}
}

module.exports = AutoPoster;
