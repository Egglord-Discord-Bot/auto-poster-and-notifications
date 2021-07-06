// Dependencies
const chalk = require('chalk'),
	moment = require('moment');

// Logger
exports.log = (content, type = 'log') => {
	if (content == 'error') return;
	const timestamp = `[${moment().format('HH:mm:ss:SSS')}]:`;
	switch (type) {
	case 'log':
		console.log(`${timestamp} ${chalk.bgBlue(type.toUpperCase())} ${content} `);
		break;
	case 'warn':
		console.log(`${timestamp} ${chalk.black.bgYellow(type.toUpperCase())} ${content} `);
		break;
	case 'error':
		console.log(`${timestamp} ${chalk.bgRed(type.toUpperCase())} ${content} `);
		break;
	case 'debug':
		console.log(`${timestamp} ${chalk.green(type.toUpperCase())} ${content} `);
		break;
	case 'cmd':
		console.log(`${timestamp} ${chalk.black.bgWhite(type.toUpperCase())} ${content}`);
		break;
	case 'ready':
		console.log(`${timestamp} ${chalk.black.bgGreen(type.toUpperCase())} ${content}`);
		break;
	default:
		break;
	}
};

exports.warn = (...args) => this.log(...args, 'warn');

exports.error = (...args) => this.log(...args, 'error');

exports.debug = (...args) => this.log(...args, 'debug');

exports.cmd = (...args) => this.log(...args, 'cmd');

exports.ready = (...args) => this.log(...args, 'ready');
