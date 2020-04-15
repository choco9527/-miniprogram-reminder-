const db = wx.cloud.database() // 获取数据库
const TODOS = db.collection('todos')
const app = getApp()
import Notify from '../../miniprogram_npm/@vant/weapp/notify/notify.js';

Page({

	data: {
		openid:'',
		counterId:'',
		task:'', // 当前任务对象
		time: 0,
		timeData: {},
		showTimePicker:false,
		currentDate: '12:00',
		filter(type, options) {
			if (type === 'minute') {
				return options.filter(option => option % 5 === 0)
			}
			return options;
		}
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
						task = remindList[options.index];
					
					console.log(task)
					that.setData({
						task,
						counterId
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
	remindLater () {
		this.setData({
			showTimePicker: true
		})
	},
	onComfirm (e) { // 确认时间
		// console.log(e.detail) // 12:05
		let timeStr = e.detail,
		 a = timeStr.split(':');
		let h = +a[0],m = +a[1];
		console.log(h,m)

		this.setData({
			time: (h * 60 * 60 * 1000) + (m * 60 * 1000),
			showTimePicker: false
		})
	},
	onCancel () {
		this.setData({
			showTimePicker: false
		})
	},
	start() {
		const countDown = this.selectComponent('.control-count-down');
		countDown.start();
	},

	pause() {
		const countDown = this.selectComponent('.control-count-down');
		countDown.pause();
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