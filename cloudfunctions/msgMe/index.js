const cloud = require('wx-server-sdk')
cloud.init()
const templateId = '_Czn6Rny00Y5EBY9nzVFvzhwvu3ManUnwCGSodOHvEw'
const db = cloud.database()
const TODOS = db.collection('todos')

exports.main = async (event, context) => {
	try {
		let res = await TODOS.doc(event.taskId).get() // 获取当前用户全部list
		let i = event.index
		let remindList = res.data.remindList
		const wxContext = cloud.getWXContext()
		return result = await cloud.openapi.subscribeMessage.send({
			touser: wxContext.OPENID,
			page: 'pages/main/main',
			lang: 'zh_CN',
			data: {
				thing1: {	// 日程主题
					value: remindList[i].title
				},
				time2: { // 日程时间
					value: remindList[i].formDate
				},
				thing6: {	// 备注
					value: remindList[i].remark
				}
			},
			templateId: templateId,
			miniprogramState: 'developer'
		})
		return result
	} catch (err) {
		return err
	}
}
// test代码
wx.cloud.callFunction({
	name: 'msgMe',
	data: {
		taskId: '2b4144565e8c7870004740ee09e932cb',
		index: 0
	}
}).then(console.log)