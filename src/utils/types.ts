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
