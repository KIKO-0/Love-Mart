Page({
  //保存正在编辑的商品
  data: {
    title: '',
    desc: '',

    credit: 0,
    maxCredit: getApp().globalData.maxCredit,
    presetIndex: 0,
    presets: [{
      name: "无预设",
      title: "",
      desc: "",
    }, {
      name: "薯片",
      title: "美味薯片",
      desc: "诱人的零食，夜宵绝佳伴侣，咔嘣脆！凭此商品可以向对方索要薯片。",
    }, {
      name: "奶茶券",
      title: "奶茶权限",
      desc: "凭此券可以向对方索要一杯奶茶。",
    }, {
      name: "夜宵券",
      title: "夜宵放开闸",
      desc: "凭此券可以让自己在夜里狂野干饭。",
    }, {
      name: "洗碗券",
      title: "洗碗券",
      desc: "凭此券可以让对方洗碗一次！若都有洗碗券则互相抵消。",
    }, {
      name: "做家务",
      title: "家务券",
      desc: "凭此券可以让对方做一次轻型家务，比如扔垃圾，打扫一个的房间，领一天外卖什么的。",
    }, {
      name: "不赖床",
      title: "早起券",
      desc: "凭此券可以让对方早起床一次。熬夜对身体很不好，还是要早点睡觉第二天才能有精神！",
    }, {
      name: "做运动",
      title: "减肥券",
      desc: "凭此券可以逼迫对方做一次运动，以此来达到减肥维持健康的目的。",
    }, {
      name: "给饭吃",
      title: "饭票",
      desc: "凭此券可以让对方做一次或请一次饭，具体视情况而定。",
    }, {
      name: "买小礼物",
      title: "小礼物盒",
      desc: "凭此券可以让对方买点小礼物，像泡泡马特什么的。",
    }, {
      name: "跑腿",
      title: "跑腿召唤",
      desc: "凭此券可以让对方跑腿一天，拿外卖，拿零食，开空调，开电视，在所不辞。",
    }],
    list: getApp().globalData.collectionMarketList,
  },

  //数据输入填写表单
  onTitleInput(e) {
    this.setData({ title: e.detail.value })
  },
  onDescInput(e) {
    this.setData({ desc: e.detail.value })
  },
  onCreditInput(e) {
    this.setData({ credit: Number(e.detail.value) })
  },
  // 预设积分点击
  onPresetCredit(e) {
    const value = Number(e.currentTarget.dataset.value)
    this.setData({ credit: value })
  },

  onPresetChange(e) {
    this.setData({
      presetIndex: e.detail.value,
      title: this.data.presets[e.detail.value].title,
      desc: this.data.presets[e.detail.value].desc,
    })
  },

  //保存商品
  async saveItem() {
    // 对输入框内容进行校验
    if (this.data.title === '') {
      wx.showToast({ title: '标题未填写', icon: 'error', duration: 2000 })
      return
    }
    if (this.data.title.length > 12) {
      wx.showToast({ title: '标题过长', icon: 'error', duration: 2000 })
      return
    }
    if (this.data.desc.length > 100) {
      wx.showToast({ title: '描述过长', icon: 'error', duration: 2000 })
      return
    }
    if (this.data.credit <= 0) {
      wx.showToast({ title: '一定要有积分', icon: 'error', duration: 2000 })
      return
    }

    wx.showLoading({ title: '保存中...', mask: true })

    try {
      // 1. 保存到数据库
      await wx.cloud.callFunction({ name: 'addElement', data: this.data })

      // 2. 发送订阅消息通知对方
      const openidRes = await wx.cloud.callFunction({ name: 'getOpenId' })
      const currentOpenId = openidRes.result
      const globalData = getApp().globalData
      // 确定发送目标
      let targetOpenId = ''
      if (currentOpenId === globalData._openidA) targetOpenId = globalData._openidB
      else if (currentOpenId === globalData._openidB) targetOpenId = globalData._openidA

      if (targetOpenId) {
        const date = new Date()
        const timeStr = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}`

        await wx.cloud.callFunction({
          name: 'sendMessage',
          data: {
            touser: targetOpenId,
            templateId: globalData.templateId,
            page: 'pages/Market/index',
            data: {
              thing1: { value: this.data.title.substring(0, 20) },
              phrase2: { value: '新商品上架' },
              date3: { value: timeStr }
            }
          }
        }).catch(err => console.error('发送消息失败', err))
      }

      wx.hideLoading()
      wx.showToast({ title: '添加成功', icon: 'success', duration: 1000 })

      setTimeout(function () {
        wx.navigateBack()
      }, 1000)

    } catch (err) {
      wx.hideLoading()
      console.error(err)
      wx.showToast({ title: '保存失败', icon: 'error' })
    }
  },

  // 重置所有表单项
  resetItem() {
    this.setData({
      title: '',
      desc: '',
      credit: 0,
      presetIndex: 0,
      list: getApp().globalData.collectionMarketList,
    })
  }
})