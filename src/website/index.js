// dependecies
const express = require('express'),
	cors = require('cors'),
	app = express(),
	bodyParser = require('body-parser'),
	{ port } = require('../config');

app
	.use(cors({
		origin: '*',
		credentials: true,
		methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['X-CSRF-Token', 'X-Requested-With', 'Accept', 'Accept-Version', 'Content-Length', 'Content-MD5', 'Content-Type', 'Date', 'X-Api-Version'],
		optionsSuccessStatus: 204,
	}))
	.use(bodyParser.urlencoded({ extended: true }))
	.use(bodyParser.json())
	.engine('html', require('ejs').renderFile)
	.set('view engine', 'ejs')
	.set('views', './src/website/views')
	.use('/', require('./routes'))
	.listen(port, () => console.log(`Started on PORT: ${port}`));


module.exports = app;
