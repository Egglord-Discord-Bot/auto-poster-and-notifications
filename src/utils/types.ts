export interface Options {
  Instagram?: {
    enabled: Boolean
  }
  Reddit?: {
    enabled: Boolean
  }
  Twitch?: {
    enabled: Boolean
    clientID: string
    clientSecret: string
  }
  Twitter?: {
    enabled: Boolean
    consumer_key: string
    consumer_secret: string
    access_token_key: string
    access_token_secret: string
  }
  Youtube?: {
    enabled: Boolean
  }
  mongoDBURL?: string
}

export interface AutoPosterClass {
  ready: boolean;
	//webhookManager: WebhookManager;
	client: any;
	Instagram: any;
	Reddit: any;
	Twitch: any;
	Twitter: any;
	Youtube: any;
	mongoose: any
}

export interface Accounts {
  name: string;
	channelIDs: Array<String>
}

export interface Input {
  channelID: string;
  accountName: string;
}

export interface TwitchOptions {
	clientID: string
	clientSecret: string
}

export interface TwitterOptions {
	consumer_key:	string;
	consumer_secret: string;
	access_token_key: string;
	access_token_secret: string
}

export type Reddit = {
  title: string;
  subreddit_name_prefixed: string;
  permalink: string;
  url: string;
  author: string;
  over_18: Boolean;
  media: {
		oembed?: {
			thumbnail_url: string
		}
		reddit_video: {
			fallback_url: string
		}
	};
  selftext: string;
}
