module.exports.getdate = () => {
	const date = new Date(),
		months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
		year = date.getFullYear(),
		month = months[date.getMonth()],
		getdate = date.getDate();
	return `${getdate} ${month} ${year}`;
};

module.exports.gettime = () => {
	const date = new Date(),
		hour = date.getHours(),
		min = date.getMinutes(),
		sec = date.getSeconds();
	return `${hour}:${min}:${sec}`;
};
