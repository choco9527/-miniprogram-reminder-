const {
  _formatTime
} = require('../../utils/util.js');
const hourArr = [],dayArr = [],weekArr=[]
for (let i = 1; i <= 24; i++) {
	hourArr.push('每'+i+'小时')
	dayArr.push('每'+i+'天')
	weekArr.push('每'+i+'周')
}
const frequencys = {
  '小时': hourArr,
  '天': dayArr,
	'周': weekArr
};
Component({
  options: {
    styleIsolation: 'isolated'
  },
  properties: {
    propItem:{
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
    }, {
      name: '自定',
      type: -1
    }],
    isSelfChoose: false,
    selfChoose: [{
				values: Object.keys(frequencys),
        className: 'column1'
      },
      {
				values: frequencys['小时'],
        className: 'column2'
      }
    ],
    isOnLocation: false
  },
  observers: {
    'propItem': function(newVal) {
      let date = !!newVal ? !!newVal.date.dateStr ? newVal.date.dateStr : new Date().getTime() : ''
      let dateText = !!date ? _formatTime(new Date(date)) : ''
      let isOnDate = !!newVal ? !!newVal.date.dateStr : false
      if (!!newVal && !newVal.locationObj) {
        newVal.locationObj = {
          name: ''
        }
      }
      let isOnLocation = !!newVal ? !!newVal.locationObj.name : false
      this.setData({
        currentDate: date,
        dateText,
        isOnDate,
        isOnLocation,
				item: newVal
      })
    },
  },
  lifetimes: {
    attached: function() { // 在组件实例进入页面节点树时执行
      var that = this
      var dateText = !!that.data.currentDate ? _formatTime(new Date(that.data.currentDate)) : '';

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
        date = ''
      if (isOnDate) { // 开-> 关
        date = ''
        that.setData({
          'item.repeat': {
            name: "永不",
            type: 0
          }
        })
      } else { // 关->开
        date = that.data.currentDate
      }
      that.setData({
        isOnDate: !isOnDate,
        'item.date.dateStr': date
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
      var dateText = !!this.data.currentDate ? _formatTime(new Date(this.data.currentDate)) : '';

      this.setData({
        showDatePick: false,
        dateText,
        'item.date.dateStr': that.data.currentDate
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
        that = this
      console.log(howToRepeat)
      if (howToRepeat.type === -1) { // 选择自定
        that.setData({
          isSelfChoose: !that.data.isSelfChoose
        });
        return
      }
      that.setData({
        showRepeatPopup: false,
        'item.repeat': howToRepeat
      });
      that.saveItem()
    },
		onCancelSelf() {
			this.setData({
				isSelfChoose: !this.data.isSelfChoose
			});
		},
		onComfirmSelf() { // 确定自定义时间
		let that =this
			let picker = that.selectComponent('#picker'),
			 vals = picker.getValues(),
			 type = vals[0],
			 name = vals[1], // "每3天"
			 howToRepeat =null
			if (type==='小时') {
				 howToRepeat = { name, type: 5 }
			}else if(type==='天') {
				howToRepeat = { name, type: 6 }
			}else if(type==='周') {
				howToRepeat = { name, type: 7 }
			}
			console.log(howToRepeat)
			that.setData({
				'item.repeat': howToRepeat,
				isSelfChoose: !that.data.isSelfChoose
			});
			that.saveItem()
		},
    onSelfChange(event) { // 自定义选择时间
      const {
        picker,
        value
      } = event.detail;
			picker.setColumnValues(1, frequencys[value[0]]); // 设置2级的联动
    },
    cancelRepeat() {
      this.setData({
        showRepeatPopup: false
      });
    },
    onLocationselec() { // 地址选择开关
      let that = this,
        isOnLocation = that.data.isOnLocation,
        locationObj = null
      if (isOnLocation) { // 开-> 关
        locationObj = {
          name: ''
        };
      } else { // 关->开
        locationObj = {
          name: that.data.item.locationObj.name
        };
      }
      that.setData({
        isOnLocation: !isOnLocation,
        'item.locationObj': locationObj
      })
      that.saveItem()
    },
    chooseLocation() { // 选择位置
      let that = this
      wx.chooseLocation({
        success: (res) => {
          let locationObj = {
            latitude: res.latitude,
            longitude: res.longitude,
            name: res.name,
            address: res.address
          }
          that.setData({
            'item.locationObj': locationObj
          })
          that.saveItem()
        },
      })
    },
		closeDetail() {
			this.triggerEvent('closeData')
		}
  }

});