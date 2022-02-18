export interface Options {
  Instagram?: {
    enabled: Boolean
  }
  Reddit?: {
    enabled: Boolean
  }
  Twitch?: {
    enabled: Boolean
    clientID: String
    clientSecret: String
  }
  Twitter?: {
    enabled: Boolean
    consumer_key: String
    consumer_secret: String
    access_token_key: String
    access_token_secret: String
  }
  Youtube?: {
    enabled: Boolean
  }
  mongoDBURL?: String
}
