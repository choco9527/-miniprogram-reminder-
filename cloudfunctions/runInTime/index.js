// 定时提醒云函数
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()
const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}
const _formatTime = (number, _Date) => {
  if (number === '') return ''
  var format = 'Y/M/D h:m'
  var formateArr = ['Y', 'M', 'D', 'h', 'm'];
  var returnArr = [];
  if (_Date) {
    var date = _Date; // 时区出现问题
  } else {
    var date = new Date(number);
  }

  returnArr.push(date.getFullYear());
  returnArr.push((date.getMonth() + 1));
  returnArr.push((date.getDate()));
  returnArr.push(formatNumber(date.getHours()));
  returnArr.push(formatNumber(date.getMinutes()));

  for (var i in returnArr) {
    format = format.replace(formateArr[i], returnArr[i]);
  }
  return format;
}
exports.main = async(event, context) => {
	let currentDate = _formatTime((Math.round(new Date().getTime() / 1000)) * 1000);
  // 1.筛选数据 
	let TODOS = db.collection('todos')
  let res = await TODOS.get() // 返回一个数组,包含所有用户数据
  let allData = [...res.data] // 获取全部信息
	let taskList = [] // 保存时间匹配的task
  for (let i = 0, l = allData.length; i < l; i++) {
    let remindList = allData[i].remindList
    for (let j = 0, rl = remindList.length; j < rl; j++) { // 循环每个用户的list
      let now = currentDate
      let dateStr = _formatTime(remindList[j].date.dateStr)
			let title = remindList[j].title
      // return { now, dateStr }
			if (now === dateStr && !!title) {
        taskList.push({
          openid: allData[i]._openid, // 提醒谁
          taskId: allData[i]._id, // 提醒哪份
          index: j // 提醒哪条
        })
      }
    }
  }
	let list = [...taskList]
	taskList = []

  // 2.执行数据提醒
	for (let k = 0; k < list.length; k++) {
    await cloud.callFunction({
      name: 'msgMe',
      data: {
        openid: list[k].openid,
        taskId: list[k].taskId,
        index: list[k].index
      }
    })
  }
}
// wx.cloud.callFunction({name: 'runInTime',data: {} }).then(res => {console.log(res.result)})