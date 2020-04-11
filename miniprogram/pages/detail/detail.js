const {
  formatTime
} = require('../../utils/util.js');

Component({
  options: {
    styleIsolation: 'isolated'
  },
  properties: {
    propItem: {
      type: Object,
      value: null
    }

  },
  data: {
    item: null,
    timer: null,
    isOnDate: false,
    showDatePick: false,
    currentDate: '',
    dateText: '',
    howToRepeat: '',
    formatter(type, value) {
      if (type === 'year') {
        return `${value}年`;
      } else if (type === 'month') {
        return `${value}月`;
      } else if (type === 'day') {
        return `${value}日`;
      }
      return value;
    },
    modalName: '',
    showRepeatPopup: false,
    repeatList: [{
      name: '永不',
      type: 0
    }, {
      name: '每小时',
      type: 1
    }, {
      name: '每天',
      type: 2
    }, {
      name: '每周',
      type: 3
    }, {
      name: '每月',
      type: 4
    }]
  },
  observers: {
    'propItem': function(newVal) {
      let date = !!newVal ? !!newVal.date.dateStr ? newVal.date.dateStr : new Date().getTime() : ''
      let dateText = !!date ? formatTime(new Date(date)) : ''
      let isOnDate = !!newVal ? !!newVal.date.dateStr : false
      this.setData({
        item: newVal,
        currentDate: date,
        dateText,
        isOnDate
      })
    },
  },
  lifetimes: {
    attached: function() { // 在组件实例进入页面节点树时执行
      var that = this
      var dateText = !!that.data.currentDate ? formatTime(new Date(that.data.currentDate)) : '';

      that.setData({
        isOnDate: false,
        dateText
      })
    }
  },
  methods: {
    saveItem() {
      var that = this
      setTimeout(() => {
        var propItem = that.data.item
        propItem.focus = false
        that.triggerEvent('saveRemind', propItem)
      }, 100)
    },
    onTitleChange(e) {
      var that = this
      clearTimeout(that.data.timer) // 防抖
      var timer = setTimeout(() => {
        that.setData({
          'item.title': e.detail
        })
        that.saveItem()
      }, 500)
      that.setData({
        timer
      })
    },
    onRemindChange(e) {
      var that = this
      clearTimeout(this.data.timer)
      var timer = setTimeout(() => {
        that.setData({
          'item.remark': e.detail
        })
        that.saveItem()
      }, 500)
      that.setData({
        timer
      })
    },
    onDateSelec() { // 开启日期选择
      var that = this,
        isOnDate = that.data.isOnDate,
        date = '',
        DateObj = null;

      if (isOnDate) {
        date = ''
      } else {
        date = that.data.currentDate
        DateObj = new Date(date)
      }
      that.setData({
        isOnDate: !isOnDate,
        'item.date.dateStr': date,
        'item.date.DateObj': DateObj
      })
      that.saveItem()
    },
    onTimeInput(e) {
      this.setData({
        currentDate: e.detail
      });
    },
    isDatePick() { // 具体时间选择
      this.setData({
        showDatePick: true
      })
    },
    onComfirm() { // 确认时间选择
      let that = this
      var dateText = !!this.data.currentDate ? formatTime(new Date(this.data.currentDate)) : '';

      this.setData({
        showDatePick: false,
        dateText,
        'item.date.dateStr': that.data.currentDate,
        'item.date.DateObj': new Date(that.data.currentDate)
      })
      this.saveItem()
    },
    onCancel() {
      this.setData({
        showDatePick: false
      })

    },
    isRepeat() { // 如何重复
      this.setData({
        showRepeatPopup: true
      })
    },
    selectRepeat(e) { // 选择重复周期

      let howToRepeat = e.detail
      console.log(howToRepeat)
      this.setData({
        showRepeatPopup: false,
        'item.repeat': howToRepeat
      });
      this.saveItem()
    }
  }

});