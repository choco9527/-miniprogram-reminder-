// 定时提醒云函数
const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()
const TODOS = db.collection('todos')
const formatNumber = n => {
	n = n.toString()
	return n[1] ? n : '0' + n
}
const _formatTime = (number,changeHours=false) => {
	if (number === '') return ''
	var format = 'Y/M/D h:m'
	var formateArr = ['Y', 'M', 'D', 'h', 'm'];
	var returnArr = [];
	var date = new Date(number); // 时区出现问题
	returnArr.push(date.getFullYear());
	returnArr.push((date.getMonth() + 1));
	returnArr.push((date.getDate()));
	// if (changeHours) {
		returnArr.push(formatNumber(date.getHours() + 8)); // 服务器时区转换东8区
	// }
	returnArr.push(formatNumber(date.getMinutes()));

	for (var i in returnArr) {
		format = format.replace(formateArr[i], returnArr[i]);
	}
	return format;
}
const currentDate = _formatTime((Math.round(new Date().getTime() / 1000)) * 1000);
const date1 = (Math.round(new Date().getTime() / 1000)) * 1000
exports.main = async(event, context) => {
	return {
		currentDate,
		date1,
		date2:(Math.round(new Date().getTime() / 1000)) * 1000
		}
  // 1.筛选数据
  let res = await TODOS.get() // 返回一个数组,包含所有用户数据
  let allData = res.data // 获取全部信息
  let taskList = [] // 保存时间匹配的task
  for (let i = 0, l = allData.length; i < l; i++) {
    let remindList = allData[i].remindList
    for (let j = 0, rl = remindList.length; j < rl; j++) { // 循环每个用户的list
      if (_formatTime(remindList[j].date) == currentDate) {
        taskList.push({
          openid: allData[i]._openid, // 提醒谁
          taskId: allData[i]._id, // 提醒哪份
          index: j // 提醒哪条
        })
      }
    }
  }
  // 2.执行数据提醒
  if (taskList.length > 0) {
    for (let k in taskList) {
      await cloud.callFunction({
        name: 'msgMe',
        data: {
          openid: taskList[k].openid,
          taskId: taskList[k].taskId,
          index: taskList[k].index
        }
      })
    }
  }
}
// wx.cloud.callFunction({name: 'runInTime',data: {} }).then(res => {console.log(res.result)})