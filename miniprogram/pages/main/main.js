import Notify from '../../miniprogram_npm/@vant/weapp/notify/notify.js';
const moment = require('../../utils/moment.js');
moment.locale('zh-cn', {
  months: '一月_二月_三月_四月_五月_六月_七月_八月_九月_十月_十一月_十二月'.split('_'),
  monthsShort: '1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月'.split('_'),
  weekdays: '星期日_星期一_星期二_星期三_星期四_星期五_星期六'.split('_'),
  weekdaysShort: '周日_周一_周二_周三_周四_周五_周六'.split('_'),
  weekdaysMin: '日_一_二_三_四_五_六'.split('_'),
  longDateFormat: {
    LT: 'HH:mm',
    LTS: 'HH:mm:ss',
    L: 'YYYY-MM-DD',
    LL: 'YYYY年MM月DD日',
    LLL: 'YYYY年MM月DD日Ah点mm分',
    LLLL: 'YYYY年MM月DD日ddddAh点mm分',
    l: 'YYYY-M-D',
    ll: 'YYYY年M月D日',
    lll: 'YYYY年M月D日 HH:mm',
    llll: 'YYYY年M月D日dddd HH:mm'
  },
  meridiemParse: /凌晨|早上|上午|中午|下午|晚上/,
  meridiemHour: function(hour, meridiem) {
    if (hour === 12) {
      hour = 0;
    }
    if (meridiem === '凌晨' || meridiem === '早上' ||
      meridiem === '上午') {
      return hour;
    } else if (meridiem === '下午' || meridiem === '晚上') {
      return hour + 12;
    } else {
      // '中午'
      return hour >= 11 ? hour : hour + 12;
    }
  },
  meridiem: function(hour, minute, isLower) {
    const hm = hour * 100 + minute;
    if (hm < 600) {
      return '凌晨';
    } else if (hm < 900) {
      return '早上';
    } else if (hm < 1130) {
      return '上午';
    } else if (hm < 1230) {
      return '中午';
    } else if (hm < 1800) {
      return '下午';
    } else {
      return '晚上';
    }
  },
  calendar: {
    sameDay: '[今天]LT',
    nextDay: '[明天]LT',
    nextWeek: '[下]ddddLT',
    lastDay: '[昨天]LT',
    lastWeek: '[上]ddddLT',
    sameElse: 'L'
  },
  dayOfMonthOrdinalParse: /\d{1,2}(日|月|周)/,
  ordinal: function(number, period) {
    switch (period) {
      case 'd':
      case 'D':
      case 'DDD':
        return number + '日';
      case 'M':
        return number + '月';
      case 'w':
      case 'W':
        return number + '周';
      default:
        return number;
    }
  },
  relativeTime: {
    future: '%s内',
    past: '%s前',
    s: '几秒',
    ss: '%d秒',
    m: '1分钟',
    mm: '%d分钟',
    h: '1小时',
    hh: '%d小时',
    d: '1天',
    dd: '%d天',
    M: '1个月',
    MM: '%d个月',
    y: '1年',
    yy: '%d年'
  },
  week: {
    // GB/T 7408-1994《数据元和交换格式·信息交换·日期和时间表示法》与ISO 8601:1988等效
    dow: 1, // Monday is the first day of the week.
    doy: 4 // The week that contains Jan 4th is the first week of the year.
  }
})
const {
  _formatTime
} = require('../../utils/util.js');

const db = wx.cloud.database() // 获取数据库
const TODOS = db.collection('todos')
const app = getApp()
const templateId = '_Czn6Rny00Y5EBY9nzVFvzhwvu3ManUnwCGSodOHvEw';
const _hasPast = (number) => { // 判断过期与否
  let curNum = new Date().getTime()
  if (!!number) {
    return (curNum > number)
  } else {
    return false
  }
}
Page({
  data: {
    remindList: [],
    showList: false,
    popupItem: null,
    popupIndex: -1,
    showPopup: false,
    timer: null,
    openid: '',
    counterId: '',
    triggered: false,
    showNewBtn: false,
		isNight: new Date().getHours()<=6 || new Date().getHours() >= 20 // 20-6夜间模式

  },
  onLoad() {
    this._getOpenId()
    // console.log('openid',this.data.openid)
    let that = this
    TODOS.where({
        _openid: that.data.openid
      }).get()
      .then(res => { // 获取列表
        // console.log(res)
        if (res.data.length > 0) {
          let remindList = [...res.data[0].remindList],
            counterId = res.data[0]._id;
          remindList = that.updateRemindList(remindList)
          that.setData({
            remindList,
            counterId,
            showList: true,
            showNewBtn: true
          })
        } else { // 如无该用户数据库则添加
          TODOS.add({
            data: {
              remindList: [{
                isCompleted: false,
                title: '點我輸入 試試左右滑動',
                remark: '',
                date: {
                  formaDate: '',
                  formaDate1: '',
                  dateStr: '' // 时间戳
                },
                repeat: {
                  name: '永不',
                  type: 0
                },
                locationObj: {
                  name: ''
                },
                focus: false,
                past: false
              }]
            }
          }).then(res => {
            that.setData({
              counterId: res._id,
              showNewBtn: true
            })
          })
        }
      }).catch(err => {
        // console.log(err)
        wx.showToast({
          title: '获取列表失败',
          icon: 'none',
          image: '',
          duration: 1000,
          mask: true
        })
      })
    this._getSetting()
  },
  onHide() {
    console.log('hide')
    let that = this
    let remindList = [...this.data.remindList]
    remindList = that.updateRemindList(remindList)
    that.setData({
      remindList
    }, that.updateCloudList)
  },
  onRefresh() { // 下拉刷新
    let that = this
    TODOS.where({
      _openid: that.data.openid
    }).get().then(res => {
      if (res.data.length > 0) {
        let remindList = [...res.data[0].remindList],
          counterId = res.data[0]._id;
        remindList = that.updateRemindList(remindList)
        that.setData({
          remindList,
          counterId,
          triggered: false
        })
        Notify({
          type: 'success',
          message: '刷新成功',
          background: '#FFDAB9',
          duration: 1000
        });
      }
    })
  },
  _getOpenId() { // 纯工具函数
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
  },
  _getSetting() {
    wx.getSetting({
      withSubscriptions: true,
      success(res) {
        console.log(res.subscriptionsSetting)
        if (res.subscriptionsSetting.itemSettings && res.subscriptionsSetting.itemSettings[templateId] === 'accept') {
          console.log('用户已同意')
        } else {
          console.log('用户不同意')
        }
      }
    })
  },
  updateRemindList(list) {
    let that = this
    list.forEach(item => {
      item.date.dateStr = that.updateTime(item)
      item.date.formaDate = moment(item.date.dateStr).calendar(null, {
        lastWeek: '[上]ddd kk:mm',
        nextWeek: '[下]ddd kk:mm',
        sameElse: 'YYYY年M月D日 kk:mm'
      })
      item.date.formaDate1 = _formatTime(item.date.dateStr)
      item.past = _hasPast(item.date.dateStr)
      item.isCompleted = false
    })
    return list
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

    let timer = setTimeout(() => { // 1s后删除
      if ((!!remindList[i].isCompleted && !remindList[i].date) || remindList[i].repeat.type === 0) {
        remindList.splice(i, 1)
        that.setData({
          remindList
        }, that.updateCloudList)
      }
    }, 1500)
    that.setData({
      remindList,
      timer
    }, that.updateCloudList)
  },
  delItem(event) { // 右滑删除
    let i = event.currentTarget.dataset.index,
      that = this,
      remindList = [...that.data.remindList];
    remindList.splice(i, 1)
    Notify({
      type: 'success',
      message: '已删除',
      background: '#FFDAB9',
      duration: 1200
    });
    that.setData({
      remindList
    }, that.updateCloudList)
  },
  navToWait(event) { // 左滑跳转
    let i = event.currentTarget.dataset.index
    let url = '../wait/wait?index=' + i
    wx.navigateTo({
      url
    })
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
              dateStr: '' // 时间戳
            },
            repeat: {
              name: '永不',
              type: 0
            },
            locationObj: {
              name: ''
            },
            focus: true,
            past: false
          })
          that.setData({
            remindList,
            showNewBtn: false
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
      remindList = [...that.data.remindList];
    remindList[i].focus = false

    if (e.detail.value === '') {
      remindList.splice(i, 1)
    } else {
      remindList[i].title = e.detail.value
    }
    that.setData({
      remindList,
      showNewBtn: true
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
    setTimeout(_ => { // 需要在blur之後進行
      let popupItem = e.currentTarget.dataset.item,
        popupIndex = e.currentTarget.dataset.index,
        that = this;
      that.setData({
        showPopup: true,
        popupItem,
        popupIndex
      });
    },50)
  },
  onCloseDeta() {
    console.log('关闭详情')
    this.setData({
      showPopup: false,
      popupIndex: -1
    });
  },
	toggleNight() { // 切换夜间模式
		this.setData({ isNight: !this.data.isNight })
	},
  updateTime(task) { // 更新完成项目的时间
    if (!!task.isCompleted) { // 已完成
      console.log('upDateTime')
      let newD = new Date(task.date.dateStr)
      let x = task.repeat.name[1] // 每x小时/天
      if (+task.repeat.name[2] === +task.repeat.name[2]) {
        x = x + task.repeat.name[2] // '1'+'0' = '10'
      }
      // console.log(x)
      switch (task.repeat.type) {
        case 1: // 每小时
          let hour = new Date(task.date.dateStr).getHours() + 1
          newD.setHours(hour)
          break;
        case 2: // 每天
          let day = new Date(task.date.dateStr).getDate() + 1
          newD.setDate(day)
          break;
        case 3: // 每周
          return task.date.dateStr + 604800000
          break;
        case 4: // 每月
          let month = new Date(task.date.dateStr).getMonth() + 1
          newD.setMonth(month)
          break;
        case 5: // 每x小时
          return task.date.dateStr + 3600000 * x;
        case 6: // 每x天
          return task.date.dateStr + 86400000 * x;
        case 7: // 每x周
          return task.date.dateStr + 604800000 * x;
      }
      return newD.getTime()
    } else {
      return task.date.dateStr
    }
  },
  saveByDetail(e) { // 子组件触发保存
    let that = this,
      remindList = [...that.data.remindList],
      i = that.data.popupIndex;
    if (i === -1) return
    remindList[i] = e.detail // 替换为子组件传递propitem
    remindList[i].date.formaDate = moment(remindList[i].date.dateStr).calendar(null, {
      lastWeek: '[上]ddd kk:mm',
      nextWeek: '[下]ddd kk:mm',
      sameElse: 'YYYY年M月D日 kk:mm'
    })
    remindList[i].date.formaDate1 = _formatTime(remindList[i].date.dateStr)
    remindList[i].past = _hasPast(remindList[i].date.dateStr)

    that.setData({
      remindList
    }, that.updateCloudList)
  }

})