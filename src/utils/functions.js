module.exports.functiondate = () => {
	const datefu = new Date();
	const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	const year = datefu.getFullYear();
	const month = months[datefu.getMonth()];
	const getdate = datefu.getDate();
	return getdate + ' ' + month + ' ' + year;
};

module.exports.functiontime = () => {
	const datefu = new Date();
	const hour = datefu.getHours();
	const min = datefu.getMinutes();
	const sec = datefu.getSeconds();
	return hour + ':' + min + ':' + sec;
};
