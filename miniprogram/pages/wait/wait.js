const db = wx.cloud.database() // 获取数据库
const TODOS = db.collection('todos')
const app = getApp()
import Notify from '../../miniprogram_npm/@vant/weapp/notify/notify.js';
import Dialog from '../../miniprogram_npm/@vant/weapp/dialog/dialog';
import Toast from '../../miniprogram_npm/@vant/weapp/toast/toast';
Page({
  data: {
    openid: '',
    counterId: '',
    index: -1, // 任务在数组中的位置
    task: {}, // 当前任务对象
    time: 0,
    timeData: {},
    showLater: false,
    currentDate: '1:00',
    filter(type, options) {
      if (type === 'minute') {
        return options.filter(option => option % 5 === 0)
      }
      return options;
    },
    showCell: false
  },
  page: {
    timeTemp: 0, // 中转储存time
    currentDateStr: 0, // 当前时间时间戳
		title: ''
  },
  onLoad: function(options) {
    let that = this
    if (!options.index) {
      Notify({
        type: 'danger',
        message: '未获取参数'
      });
      wx.navigateTo({
        url: '../main/main'
      })
      return
    }
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
		that.page.title = !!options.title ? options.title : ''
    this.setData({
      index: options.index
    }, this._getTaskData()) // 加載主數據庫
  },
  _getTaskData() {
    let that = this
    // console.log('openid', that.data.openid)
    TODOS.where({
        _openid: that.data.openid
      }).get()
      .then(res => { // 获取列表
        // console.log(res)
        if (res.data.length > 0) {
          let remindList = [...res.data[0].remindList],
            counterId = res.data[0]._id,
            task = remindList[that.data.index];
					if (!!that.page.title && task.title !== that.page.title) { // 通过title判断
						wx.showToast({
							title: '该任务已不存在',
							icon: 'none',
							image: '',
							duration: 600,
							mask: true
						})
						wx.navigateTo({
							url: '../main/main'
						})
						return
					}
          console.log(task)
          that.setData({
            task,
            counterId
          }, setTimeout(_ => {
            that.setData({
              showCell: true
            })
          }, 200))
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
    if (!!addTime) {
      console.log('开始提醒')
    } else {
      console.log('取消提醒')
    }
    let remindList = [],
      that = this;
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
            remindList: list
          }
        })
      })
  },
  remindLater() {
    let cancelLater = () => {
      if (!this.data.showLater) { // 关闭时取消提醒
        this._updateMainCloudList() // 更新为0，即不提醒
      }
    }
    this.setData({
      showLater: !this.data.showLater
    }, cancelLater)
  },
  onInput(e) { // 确认时间
    // console.log(e.detail) // 12:05 
    let timeStr = e.detail,
      a = timeStr.split(':');
    let h = +(a[0]),
      m = +(a[1]);
    if (h === 0 && m === 0) return
    this.page.timeTemp = (h * 60 * 60 * 1000) + (m * 60 * 1000)
  },

  start() {
    const countDown = this.selectComponent('.control-count-down');
    countDown.start();
    this.setData({
      time: this.page.timeTemp
    })
    this._updateMainCloudList(this.data.time)
    console.log(this.data.timeData, this.data.time)
  },

  pause() {
    const countDown = this.selectComponent('.control-count-down');
    countDown.pause();
    this._updateMainCloudList() // 更新为0，即不提醒
  },

  reset() {
    const countDown = this.selectComponent('.control-count-down');
    countDown.reset();
    this._updateMainCloudList(this.data.time)
  },
	onDateChanging() { // 滑动timepicker振动
		wx.vibrateShort({})
	},
  onChange(e) {
    this.setData({
      timeData: e.detail
    });
  },
  onCompelete() { // 点击已完成
    let task = this.data.task,
      remindList = [],
      that = this;
    TODOS.doc(that.data.counterId).get().then(res => {
      // console.log(res.data.remindList,that.data.index)
      remindList = [...res.data.remindList]
      Dialog.confirm({
        title: '确认完成？',
        message: !!task.past ? '该事项已过期' : '该事项未到期'
      }).then(() => {
        task.isCompleted = true
        if ((!task.date) || task.repeat.type === 0) {
          remindList.splice(that.data.index, 1)
        } else {
          remindList[that.data.index] = task
        }
        console.log(remindList)
        // return remindList
        if (!!remindList) {
          TODOS.doc(that.data.counterId).update({
            data: {
              remindList
            }
          }).then(_ => {
            that.setData({
              showCell: false
            })
            Toast.success('已完成');
            setTimeout(() => {
              wx.navigateTo({
                url: '../main/main'
              })
            }, 500)
          })
        }
      }).catch(() => {
        return false
      });

    })
  }

})