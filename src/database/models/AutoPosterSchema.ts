import { model, Schema } from 'mongoose';

export type input = {
  channelID: string;
  Account: string;
};

interface AutoPoster {
  guildID: string;
  Instagram: Array<input>;
  Reddit: Array<input>;
  Twitch: Array<input>;
  Twitter: Array<input>;
  Youtube: Array<input>;
}

const AutoPosterSchema = new Schema<AutoPoster>({
  guildID: { required: true, },
  Instagram: { default: [] },
  Reddit: { default: [] },
  Youtube: { default: []},
  Twitch: { default: []},
  Twitter: { default: []},
})

export default model<AutoPoster>('AutoPosters', AutoPosterSchema);
