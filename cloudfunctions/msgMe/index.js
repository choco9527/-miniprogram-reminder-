// 消息提醒云函数
const cloud = require('wx-server-sdk')
cloud.init({
	env: cloud.DYNAMIC_CURRENT_ENV
})
const templateId = '_Czn6Rny00Y5EBY9nzVFvzhwvu3ManUnwCGSodOHvEw'
const db = cloud.database()
const TODOS = db.collection('todos')
const wxContext = cloud.getWXContext()

exports.main = async (event, context) => {
	// 接收openid、taskid、index三个参数
	try {
		let res = await TODOS.doc(event.taskId).get() // 获取当前用户全部list
		let i = event.index
		let remindList = res.data.remindList
		const result = await cloud.openapi.subscribeMessage.send({
			touser: event.openid,
			page: 'pages/wait/wait?index=' + i,
			lang: 'zh_CN',
			data: {
				thing1: {	// 日程主题
					value: remindList[i].title
				},
				time2: { // 日程时间
					value: remindList[i].date.formaDate1
				},
				thing6: {	// 备注
					value: !!remindList[i].remark ? remindList[i].remark : '无备注'
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
// wx.cloud.callFunction({	name: 'msgMe',	data: {	openid: 'oiLOL5THpcMk1GydSJlz5pejV9nw',taskId: '42c9a7b15e9148ea00772f2976b9493c',	index: 0}}).then(res => {console.log(res.result)})