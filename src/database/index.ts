import type AutoPoster from '../index'
import mongoose from 'mongoose';

export default {
	init: (AutoPoster: AutoPoster) => {
		const dbOptions = {
			useNewUrlParser: true,
			autoIndex: false,
			connectTimeoutMS: 10000,
			family: 4,
			useUnifiedTopology: true,
		};
		mongoose.connect(AutoPoster.options.MongoDBURl, dbOptions);
		mongoose.Promise = global.Promise;
		mongoose.connection.on('connected', () => {
			console.log('Mongoose connection successfully opened', 'ready');
		});
		mongoose.connection.on('err', (err) => {
			console.log(`Mongoose connection error: \n ${err.stack}`);
		});
		mongoose.connection.on('disconnected', () => {
			console.log('Mongoose disconnected');
		});
	},
};
