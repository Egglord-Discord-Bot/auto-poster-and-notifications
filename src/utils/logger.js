// Dependecies
const chalk = require('chalk');
const moment = require('moment');

exports.log = (content, type = 'log') => {
	if (content == 'error') return;
	const timestamp = `[${moment().format('HH:mm:ss')}]:`;
switch(type) {
	case'log':
		console.log(`${timestamp} ${chalk.bgBlue(type.toUpperCase())} ${content} `);
	return;
	case'warn':
		console.log(`${timestamp} ${chalk.bgBlue(type.toUpperCase())} ${content} `);
	return;
	case'error':
		console.log(`${timestamp} ${chalk.bgRed(type.toUpperCase())} ${content} `);
	return;
	case'debug':
		console.log(`${timestamp} ${chalk.green(type.toUpperCase())} ${content} `);
	return;
	case'cmd':
		console.log(`${timestamp} ${chalk.black.bgWhite(type.toUpperCase())} ${content}`);
	return;
	case'ready':
		console.log(`${timestamp} ${chalk.black.bgGreen(type.toUpperCase())} ${content}`);
	return;
	}
};

exports.warn = (...args) => this.log(...args, 'warn');

exports.error = (...args) => this.log(...args, 'error');

exports.debug = (...args) => this.log(...args, 'debug');

exports.cmd = (...args) => this.log(...args, 'cmd');

exports.ready = (...args) => this.log(...args, 'ready');
