/* Main page of the app */
Page({
    //允许接收服务通知
    async requestSubscribeMessage() {
        const templateId = getApp().globalData.templateId
        wx.requestSubscribeMessage({
            tmplIds: [templateId],
            success: (res) => {
                if (res[templateId] === 'accept') {
                    this.setData({
                        requestSubscribeMessageResult: '成功',
                    })
                    wx.showToast({
                        title: '订阅成功',
                        icon: 'success',
                        duration: 2000
                    })
                } else {
                    this.setData({
                        requestSubscribeMessageResult: `失败（${res[templateId]}）`,
                    })
                    wx.showToast({
                        title: '未授权订阅',
                        icon: 'none',
                        duration: 2000
                    })
                }
            },
            fail: (err) => {
                this.setData({
                    requestSubscribeMessageResult: `失败（${JSON.stringify(err)}）`,
                })
                wx.showToast({
                    title: '订阅失败',
                    icon: 'none',
                    duration: 2000
                })
            },
        })
    },
    data: {
        creditA: 0,
        creditB: 0,

        userA: '',
        userB: '',
        openid: '',

        daysTogether: 0,
    },

    async onLoad() {
        this.calculateDaysTogether();
    },

    // 计算在一起的天数
    calculateDaysTogether() {
        const startDate = new Date('2025-10-15');
        const today = new Date();
        const diffTime = Math.abs(today - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        this.setData({ daysTogether: diffDays });
    },

    async onShow() {
        this.getCreditA()
        this.getCreditB()
        this.setData({
            userA: getApp().globalData.userA,
            userB: getApp().globalData.userB,
        })
        wx.cloud.callFunction({ name: 'getOpenId' }).then(res => {
            this.setData({ openid: res.result })
        })
    },

    getCreditA() {
        wx.cloud.callFunction({ name: 'getElementByOpenId', data: { list: getApp().globalData.collectionUserList, _openid: getApp().globalData._openidA } })
            .then(res => {
                this.setData({ creditA: res.result.data[0].credit })
            })
    },

    getCreditB() {
        wx.cloud.callFunction({ name: 'getElementByOpenId', data: { list: getApp().globalData.collectionUserList, _openid: getApp().globalData._openidB } })
            .then(res => {
                this.setData({ creditB: res.result.data[0].credit })
            })
    },
})