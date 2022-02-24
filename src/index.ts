import {Instagram, Reddit, Twitch, Twitter, Youtube} from "./services";
import WebhookManager from './utils/webhookManager'
import type {Options} from './utils/types'
import type {AutoPosterClass} from './utils/types'

/**
	* The Auto poster Client
	* @type {AutoPosterClass}
*/
class AutoPoster implements AutoPosterClass {
	ready: boolean;
	webhookManager: WebhookManager;
	client: any;
	Instagram: Instagram | null;
	Reddit: Reddit | null;
	Twitch: Twitch | null;
	Twitter: Twitter | null;
	Youtube: Youtube | null;
	mongoose: any
	constructor(client: any, public options: Options) {
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
		this.webhookManager = new WebhookManager(client);
		/**
			* The Autposter options
			* @type {Options}
		*/
		this.options = options;
		/**
			* The services
			* @type {ServiceManager}
		*/
		this.Instagram = (this.options?.Instagram?.enabled) ? new Instagram(this) : null;
		this.Reddit = (this.options?.Reddit?.enabled) ? new Reddit(this) : null;
		this.Twitch = (this.options?.Twitch?.enabled) ? new Twitch(this, this.options.Twitch) : null;
		this.Twitter = (this.options?.Twitter?.enabled) ? new Twitter(this, this.options.Twitter) : null;
		this.Youtube =  (this.options?.Youtube?.enabled) ? new Youtube(this) : null;

		if (this.options.mongoDBURL) this.mongoose = require('./database').init(this);

		if (this.ready) {
			this.init();
			this.webhookManager.init();
		}
	}

	/**
		* Function for initializing the auto poster
	*/
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

export type {AutoPoster};
