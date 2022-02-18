import { model, Schema, Model, Document } from 'mongoose';

interface AutoPoster extends Document {
	guildID: String,
	Instagram: Array<String | String>,
	Reddit: Array<String | String>,
	Twitch: Array<String | String>,
	Twitter: Array<String | String>,
	Youtube: Array<String | String>,
}

const AutoPosterSchema: Schema = new Schema({
	guildID: String,
	Instagram: Array,
	Reddit: Array,
	Twitch: Array,
	Twitter: Array,
	Youtube: Array,
});

const AutoPosterData: Model<AutoPoster> = model('AutoPosters', AutoPosterSchema);

export default AutoPosterData
