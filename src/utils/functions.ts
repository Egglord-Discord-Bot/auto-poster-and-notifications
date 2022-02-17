module.exports = {
	getDate: function() {
		const date = new Date(),
			months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
			year = date.getFullYear(),
			month = months[date.getMonth()],
			getdate = date.getDate();
		return `${getdate} ${month} ${year}`;
	},
	getTime: function() {
		const date = new Date();
		return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
	},
};
