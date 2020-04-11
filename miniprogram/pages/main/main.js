import Notify from '../../miniprogram_npm/@vant/weapp/notify/notify.js';

const {
  formatTime
} = require('../../utils/util.js');
const db = wx.cloud.database()
const TODOS = db.collection('todos')
const app = getApp()
const templateId = '_Czn6Rny00Y5EBY9nzVFvzhwvu3ManUnwCGSodOHvEw';

Page({
  data: {
    remindList: [],
    // {
    //   isCompleted: false,
    //   title: '摇号延期',
    //   remark: '',
    // 		date: {
    // 		formaDate: 'Y年M月D日 h:m', // 表述时间
    // 		formaDate1: '昨天', // 语义化的时间
    // 		DateObj: null, // 时间对象
    // 		dateStr: '' // 时间戳
    // 			},
    //   repeat: {name:'永不',type:0},
    //   focus: false
    // }
    popupItem: null,
    popupIndex: -1,
    showPopup: false,
    timer: null,
    openid: '',
    counterId: '',
    triggered: false
  },
  onLoad() {
    if (app.globalData.openid) {
      this.setData({
        openid: app.globalData.openid
      })
    } else {
      wx.cloud.callFunction({
        name: 'login',
        data: {},
        success: res => {
          app.globalData.openid = res.result.openid
          this.setData({
            openid: app.globalData.openid
          })
        }
      })
    }
    // console.log('openid',this.data.openid)
    let that = this
    TODOS.where({
        _openid: that.data.openid
      }).get()
      .then(res => { // 获取列表
        // console.log(res)
        if (res.data.length > 0) {
          let remindList = [...res.data[0].remindList],
            counterId = res.data[0]._id
          remindList.forEach(item => {
            item.date.formaDate = formatTime(item.date.dateStr)
          })

          that.setData({
            remindList,
            counterId
          })
        } else { // 如无该用户数据库则添加
          TODOS.add({
            data: {
              remindList: []
            }
          }).then(res => {
            that.setData({
              counterId: res._id
            })
          })
        }
      }).catch(rea => {
        wx.showToast({
          title: '获取列表失败',
          icon: 'none',
          image: '',
          duration: 1000,
          mask: true
        })
      })
  },
  onRefresh() { // 下拉刷新
    let that = this
    TODOS.where({
      _openid: that.data.openid
    }).get().then(res => {
      if (res.data.length > 0) {
        let remindList = [...res.data[0].remindList],
          counterId = res.data[0]._id;

        that.setData({
          remindList,
          counterId,
          triggered: false
        })
        Notify({
          type: 'success',
          message: '刷新成功',
          background: '#FFDAB9',
          duration: 666
        });
      }
    })
  },
  updateCloudList() { // 更新数据库
    // console.log('updateCloud')
    let remindList = [...this.data.remindList]
    TODOS.doc(this.data.counterId).update({
      data: {
        remindList
      }
    })
  },
  onChangeCom(e) { // 点击完成按钮
    let i = e.currentTarget.dataset.index,
      that = this,
      remindList = [...that.data.remindList]
    remindList[i].isCompleted = !remindList[i].isCompleted
    // console.log(remindList[i]);

    let timer = setTimeout(() => { // 1s后删除
      if ((!!remindList[i].isCompleted && !remindList[i].date) || remindList[i].repeat.type === 0) {
        remindList.splice(i, 1)
        that.setData({
          remindList
        }, that.updateCloudList)
      }
    }, 1000)
    that.setData({
      remindList,
      timer
    }, that.updateCloudList)
  },
  newRemind(e) { // 新待办，设置订阅
    let that = this,
      remindList = [...that.data.remindList]
    // console.log('消息订阅调起')
    wx.requestSubscribeMessage({
      tmplIds: [templateId],
      success(res) {
        if (res[templateId] == 'accept') {
          //用户同意了订阅，允许订阅消息
          remindList.push({
            isCompleted: false,
            title: '',
            remark: '',
            date: {
              formaDate: '',
              formaDate1: '',
              DateObj: null,
              dateStr: '' // 时间戳
            },
            repeat: {
              name: '永不',
              type: 0
            },
            focus: true
          })

          that.setData({
            remindList
          }, that.updateCloudList)

        } else {
          //用户拒绝了订阅，禁用订阅消息
          Notify({
            type: 'warning',
            message: '请允许订阅提醒',
            background: '#FF7F50',
            duration: 1000
          });
        }
      },
      fail(err) {
        wx.showToast({
          title: '订阅调起失败'
        })
        console.error(err)
      }
    })

  },
  inputBlur(e) { // 保存事项，删除空事项
    // console.log('blur');
    let that = this,
      i = e.currentTarget.dataset.index,
      remindList = [...that.data.remindList]
    remindList[i].focus = false

    if (e.detail.value === '') {
      remindList.splice(i, 1)
    } else {
      remindList[i].title = e.detail.value
    }
    that.setData({
      remindList
    }, that.updateCloudList)
  },
  inputChange(e) {
    // console.log('change');

    let that = this
    clearTimeout(that.data.timer) // 输入防抖
    let timer = setTimeout(() => {
      let i = e.currentTarget.dataset.index,
        remindList = [...that.data.remindList]
      remindList[i].title = e.detail.value
      that.setData({
        remindList
      }, that.updateCloudList)
    }, 500)
    that.setData({
      timer
    })
  },
  inputFocus(e) {
    // console.log('focus');

    clearTimeout(this.data.timer) // 清除（删除）定时器
    let i = e.currentTarget.dataset.index,
      remindList = [...this.data.remindList],
      that = this;
    remindList[i].focus = true
    that.setData({
      remindList
    }, that.updateCloudList)
  },
  showDetail(e) { // 显示详情
    let popupItem = e.currentTarget.dataset.item,
      popupIndex = e.currentTarget.dataset.index,
      that = this;
    that.setData({
      showPopup: true,
      popupItem,
      popupIndex
    });
  },
  onCloseDeta() {
    // console.log('关闭详情')
    this.setData({
      showPopup: false,
      popupIndex: -1
    });
  },
  saveByDetail(e) { // 子组件触发保存

    let that = this
    let remindList = [...that.data.remindList],
      i = that.data.popupIndex;
    if (i === -1) return
    // console.log('触发保存', remindList[i]);

    remindList[i] = e.detail
    remindList[i].date.formaDate = formatTime(remindList[i].date.dateStr)

    that.setData({
      remindList
    }, that.updateCloudList)
  }
})