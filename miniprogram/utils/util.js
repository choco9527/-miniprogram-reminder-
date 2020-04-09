const formatTime1 = number => {
	// console.log(date)
	var date = new Date(number);

  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()
  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute].map(formatNumber).join(':')
}

const formatNumber = n => {
	n = n.toString()
	return n[1] ? n : '0' + n
}
/** 
 * 时间戳转化为年 月 日 时 分 秒 
 * number: 传入时间戳 
 * format：返回格式，支持自定义，但参数必须与formateArr里保持一致 
*/
function formatTime(number, format) {
	if (number === '') return ''
	var format = format || 'Y年M月D日 h:m'

	var formateArr = ['Y', 'M', 'D', 'h', 'm'];
	var returnArr = [];

	var date = new Date(number);
	returnArr.push(date.getFullYear());
	returnArr.push((date.getMonth() + 1));
	returnArr.push((date.getDate()));

	returnArr.push(formatNumber(date.getHours()));
	returnArr.push(formatNumber(date.getMinutes()));
	// returnArr.push((date.getSeconds()));

	for (var i in returnArr) {
		format = format.replace(formateArr[i], returnArr[i]);
	}
	return format;
}

module.exports = {
	formatTime: formatTime,
	formatTime1: formatTime1
}