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
      let date = !!newVal ? !!newVal.date ? newVal.date : new Date().getTime() : ''
      let dateText = !!date ? formatTime(new Date(date)) : ''
      let isOnDate = !!newVal ? !!newVal.date : false
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
        that.triggerEvent('saveRemind', propItem)
      }, 100)
    },
    onTitleChange(e) {
      var that = this
      clearTimeout(that.data.timer) // 防抖
      var timer = setTimeout(() => {
        let item = this.data.item
        item.title = e.detail
        that.setData({
          item
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
        let item = this.data.item
        item.remark = e.detail
        that.setData({
          item
        })
        that.saveItem()
      }, 500)
      that.setData({
        timer
      })
    },
    onDateSelec() { // 日期选择
      var that = this,
        item = this.data.item,
        isOnDate = that.data.isOnDate

      if (isOnDate) {
        item.date = ''
      } else {
        item.date = that.data.currentDate
      }
      that.setData({
        isOnDate: !isOnDate,
        item
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
    onComfirm() {
      var dateText = !!this.data.currentDate ? formatTime(new Date(this.data.currentDate)) : '',
        item = this.data.item;
      item.date = this.data.currentDate

      this.setData({
        showDatePick: false,
        dateText,
        item
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

			let howToRepeat = e.detail,
        item = this.data.item;
			console.log(howToRepeat)
      item.repeat = howToRepeat
      this.setData({
        showRepeatPopup: false,
        item
      });
      this.saveItem()
    }
  }

});