const db = wx.cloud.database() // 获取数据库
const TODOS = db.collection('todos')
const app = getApp()
import Notify from '../../miniprogram_npm/@vant/weapp/notify/notify.js';

Page({
	data: {
		openid:'',
		counterId:'',
		index:-1, // 任务在数组中的位置
		task:{}, // 当前任务对象
		time: 0,
		timeData: {},
		showLater:false,
		currentDate: '1:00',
		filter(type, options) {
			 if(type === 'minute') {
				return options.filter(option => option % 5 === 0)
			}
			return options;
		}
	},
	page:{
		timeTemp:0, // 中转储存time
		currentDateStr: 0 // 当前时间时间戳
	},
	onLoad: function (options) {
		if(!options.index) {
			Notify({ type: 'danger', message: '未获取参数' });
			wx.navigateTo({
				url: '../main/main'
			})
			return
			}
		let that = this
		// 获取openid
		if (app.globalData.openid) {
			that.setData({
				openid: app.globalData.openid
			})
		} else {
			wx.cloud.callFunction({
				name: 'login',
				data: {},
				success: res => {
					app.globalData.openid = res.result.openid
					that.setData({
						openid: app.globalData.openid
					})
				}
			})
		}
		// console.log('openid', that.data.openid, options.index)
		TODOS.where({
			_openid: that.data.openid
		}).get()
			.then(res => { // 获取列表
				// console.log(res)
				if (res.data.length > 0) {
					let remindList = [...res.data[0].remindList],
						counterId = res.data[0]._id,
						task = remindList[options.index],
						index = options.index;

					console.log(task)
					that.setData({
						task,
						counterId,
						index
					})
				}
			}).catch(err => {
				console.log(err)
				wx.showToast({
					title: '获取列表失败',
					icon: 'none',
					image: '',
					duration: 1000,
					mask: true
				})
			})
	},
	_updateMainCloudList(addTime) { // 更新数据库稍后提醒时间(接收时间戳）
		let t = !!addTime ? addTime + new Date().getTime() : 0
		if(!!addTime) {
			console.log('开始提醒')
		}else{
			console.log('取消提醒')
		}
		let remindList = [],that = this;
		TODOS.doc(that.data.counterId).get().then(res => {
			// console.log(res.data.remindList,that.data.index)
			remindList = [...res.data.remindList]
			let task = that.data.task
			task.date['rLater'] = t
			remindList[that.data.index] = task
			return remindList
		})
		.then(list => {
			// console.log(list)
			TODOS.doc(that.data.counterId).update({
				data: {
					remindList:list
				}
			})
		})

	},
	remindLater () {
		this.setData({
			showLater: !this.data.showLater
		})
	},
	onInput (e) { // 确认时间
		// console.log(e.detail) // 12:05 
		let timeStr = e.detail,
		 a = timeStr.split(':');
		let h = +(a[0]),m = +(a[1]);
		if(h===0 && m===0) return
		this.page.timeTemp = (h * 60 * 60 * 1000) + (m * 60 * 1000)
	},

	start() {
		this._getStart()
		const countDown = this.selectComponent('.control-count-down');
		countDown.start();
		this.setData({time:this.page.timeTemp})
		this._updateMainCloudList(this.data.time)
		// console.log(this.data.timeData,this.data.time)
	},

	pause() {
		const countDown = this.selectComponent('.control-count-down');
		countDown.pause();
		this._updateMainCloudList() // 更新为0，即不提醒
		// console.log(this.page.currentDateStr)
	},

	reset() {
		const countDown = this.selectComponent('.control-count-down');
		countDown.reset();
	},

	onChange(e) {
		this.setData({
			timeData: e.detail
		});
	}

})