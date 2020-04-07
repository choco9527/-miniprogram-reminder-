const {
  formatTime
} = require('../../utils/util.js');
const db = wx.cloud.database()
const TODOS = db.collection('todos')
const app = getApp()
Page({

  data: {
    remindList: [
      // {
      //   isCompleted: false,
      //   title: '摇号延期',
      //   remark: '',
      //   date: new Date().getTime(),
      //   formDate: '',
      //   repeat: '每周',
      //   focus: false
      // }
    ],
    popupItem: null,
    popupIndex: -1,
    showPopup: false,
    timer: null,
    openid: '',
    counterId: ''
  },
  onLoad() {
    if (app.globalData.openid) {
      this.setData({
        openid: app.globalData.openid
      })
    }
    let that = this
    TODOS.where({
      _openid: that.data.openid
    }).get().then(res => { // 获取列表
      // console.log(res)
      let remindList = [...res.data[0].remindList],
        counterId = res.data[0]._id

      remindList.forEach(item => {
        item.formDate = that._formatDate(item.date)
      })

      that.setData({
        remindList,
        counterId
      })
    })
  },
  _formatDate(date) {
    if (date === '') return ''
    let newDate = new Date(date)
    return formatTime(newDate)
  },
  updateCloudList() { // 更新数据库
    console.log('updateCloud')
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
      if ((!!remindList[i].isCompleted && !remindList[i].date) || remindList[i].repeat === '永不') {
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
  newRemind(e) {
    let that = this,
      remindList = [...that.data.remindList]

    remindList.push({
      isCompleted: false,
      title: '',
      remark: '',
      date: '',
      formDate: '',
      repeat: '',
      focus: true
    })

    that.setData({
      remindList
    }, that.updateCloudList)
  },
  inputBlur(e) { // 保存事项，删除空事项
    // console.log(e);
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
  onCloseDeta() { // 关闭详情
    this.setData({
      showPopup: false,
      popupIndex: -1
    });
  },
  saveByDetail(e) { // 子组件触发保存
    // console.log('触发保存', remindList[i]);

    let that = this
    let remindList = [...that.data.remindList],
      i = that.data.popupIndex;
    if (i === -1) return

    remindList[i] = e.detail
    remindList[i].formDate = that._formatDate(remindList[i].date)

    that.setData({
      remindList
    },that.updateCloudList)
  }

})