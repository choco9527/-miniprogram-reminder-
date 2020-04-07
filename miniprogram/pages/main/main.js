const {
  formatTime
} = require('../../utils/util.js');
const db = wx.cloud.database()
const TODOS = db.collection('todos')
const app = getApp()
Page({

  data: {
    remindList: [{
        isCompleted: false,
        title: '摇号延期',
        remark: '',
        date: new Date().getTime(),
        formDate: '',
        repeat: '每周',
        focus: false
      },
      {
        isCompleted: false,
        title: 'eee',
        remark: '22',
        date: new Date().getTime(),
        formDate: '',
        repeat: '每天',
        focus: false
      },
      {
        isCompleted: false,
        title: 'www',
        remark: 'w备注',
        date: '',
        formDate: '',
        repeat: '每天',
        focus: false
      }
    ],
    popupItem: null,
    popupIndex: -1,
    showPopup: false,
    timer: null
  },
  onLoad() {
		if (app.globalData.openid) {
			this.setData({
				openid: app.globalData.openid
			})
		}

    let that = this
    let remindList = [...that.data.remindList]

    remindList.forEach(item => {
      item.formDate = that.formatDate(item.date)
    })

		TODOS.where({
			_openid: this.data.openid
		}).get().then(res => {
			console.log(res)
		})

    that.setData({
      remindList
    })

  },
  formatDate(date) {
    if (date === '') return ''
    let newDate = new Date(date)
    return formatTime(newDate)
  },
  onChangeCom(e) { // 点击完成按钮
    // console.log(e);

    let i = e.currentTarget.dataset.index,
      that = this,
      remindList = [...that.data.remindList]
    remindList[i].isCompleted = !remindList[i].isCompleted
    console.log(remindList[i]);

    let timer = setTimeout(() => { // 1s后删除
      if ((!!remindList[i].isCompleted && !remindList[i].date) || remindList[i].repeat === '永不') {
        remindList.splice(i, 1)
      }
      that.setData({
        remindList
      })
    }, 1000)
    that.setData({
      remindList,
      timer
    })
  },
  newRemind(e) {
    let remindList = [...this.data.remindList]

    remindList.push({
      isCompleted: false,
      title: '',
			remark: '',
      date: '',
			formDate: '',
      repeat: '',
      focus: true
    })
		
		// TODOS.add({
		// 	data:{

		// 	}
		// })
		// .then(res=>{
		// 	console.log(res)
		// })

    this.setData({
      remindList
    })
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
    })
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
      })
    }, 500)
    that.setData({
      timer
    })
  },
  inputFocus(e) {
    clearTimeout(this.data.timer) // 清除（删除）定时器
    let i = e.currentTarget.dataset.index,
      remindList = [...this.data.remindList]
    remindList[i].focus = true
    this.setData({
      remindList
    })
  },
  showDetail(e) { // 显示详情
    let popupItem = e.currentTarget.dataset.item,
      popupIndex = e.currentTarget.dataset.index
    this.setData({
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
    remindList[i].formDate = that.formatDate(remindList[i].date)

    that.setData({
      remindList
    })
  }

})