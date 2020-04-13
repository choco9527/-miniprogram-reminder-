const _formatTime1 = number => {
  // console.log(date)
  var date = new Date(number);

  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()
  return [year, month, day].map(_formatNumber).join('/') + ' ' + [hour, minute].map(_formatNumber).join(':')
}

const _formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}
/** 
 * format：返回格式，支持自定义，但参数必须与formateArr里保持一致 
 */
const _formatTime = (number) => {
  if (number === '') return ''
  var format = 'Y年M月D日 h:m'
  var formateArr = ['Y', 'M', 'D', 'h', 'm']; // xx年xx月xx日 15:54
  var dateArr = [];
  var date = new Date(number);

  dateArr.push(date.getFullYear());
  dateArr.push((date.getMonth() + 1));
  dateArr.push((date.getDate()));
  dateArr.push(_formatNumber(date.getHours()));
  dateArr.push(_formatNumber(date.getMinutes()));

  for (var i in dateArr) {
    format = format.replace(formateArr[i], dateArr[i]);
  }
  return format;
}


module.exports = {
  _formatTime,
  _formatTime1
}