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
		this.webhookManager = new (require('./utils/webhookManager'))(client);
		/**
			* The Autposter options
			* @type {Options}
		*/
		this.options = options;
		/**
			* The services
			* @type {ServiceManager}
		*/
		if (this.options?.Instagram.enabled) this.Instagram = new Instagram(this);
		if (this.options?.Reddit.enabled) this.Reddit = new Reddit(this);
		if (this.options?.Twitch.enabled && this.options.Twitch.clientID && this.options.Twitch.clientSecret) this.Twitch = new Twitch(this);
		if (this.options?.Twitter.enabled) this.Twitter = new Twitter(this);
		if (this.options?.Youtube.enabled) this.Youtube = new Youtube(this);

		if (this.options.mongoDBURL) this.mongoose = require('./database').init(this);

		if (this.ready) {
			this.init();
			this.webhookManager.init();
		}
	}

	async init() {
		await Promise.all([
			await this.Instagram?.init(),
			await this.Reddit?.init(),
			await this.Twitch?.init(),
			await this.Twitter?.init(),
			await this.Youtube?.init(),
			this.webhookManager.init(),
		]);
	}
}

module.exports = AutoPoster;
