module.exports.functiondate = () => {
	const datefu = new Date();
	const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	const year = datefu.getFullYear();
	const month = months[datefu.getMonth()];
	const getdate = datefu.getDate();
	const date = getdate + ' ' + month + ' ' + year;
	return date;
};

module.exports.functiontime = () => {
	const datefu = new Date();
	const hour = datefu.getHours();
	const min = datefu.getMinutes();
	const sec = datefu.getSeconds();
	const time = hour + ':' + min + ':' + sec;
	return time;
};
