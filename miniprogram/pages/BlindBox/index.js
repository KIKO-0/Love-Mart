const app = getApp()

Page({
    data: {
        loading: false,
        isShaking: false,
        showResult: false,
        resultItem: '',
        rewards: [
            "无条件原谅券",
            "指定夜宵券",
            "做家务券",
            "按摩券",
            "甚至可以是一辆保时捷(模型)",
            "再接再厉",
            "亲亲一个",
            "抱抱一个",
            "100 积分返还"
        ]
    },

    onLoad() {

    },

    async getOpenId() {
        if (this.data.openid) return this.data.openid
        const res = await wx.cloud.callFunction({ name: 'getOpenId' })
        this.setData({ openid: res.result })
        return res.result
    },

    async getUserCredit(openid) {
        const res = await wx.cloud.callFunction({
            name: 'getElementByOpenId',
            data: { _openid: openid, list: getApp().globalData.collectionUserList }
        })
        if (res && res.result && res.result.data && res.result.data.length > 0) {
            return res.result.data[0].credit
        }
        return 0
    },

    async deductCredit(openid, amount) {
        // 1. 扣除积分
        await wx.cloud.callFunction({
            name: 'editCredit',
            data: { _openid: openid, value: -amount, list: getApp().globalData.collectionUserList }
        })
    },

    async addRewardToStorage(rewardName) {
        // 将奖品添加到“仓库” (StorageList)
        await wx.cloud.callFunction({
            name: 'addElement',
            data: {
                list: getApp().globalData.collectionStorageList,
                credit: 0, // 盲盒奖品无价值或已通过积分支付
                title: `盲盒奖励: ${rewardName}`,
                desc: '来自幸运盲盒的惊喜奖励',
            }
        })
    },

    async openBox() {
        if (this.data.loading) return

        this.setData({ loading: true })

        try {
            const openid = await this.getOpenId()
            const credit = await this.getUserCredit(openid)

            if (credit < 100) {
                wx.showToast({ title: '积分不足 100 啦', icon: 'none' })
                this.setData({ loading: false })
                return
            }

            wx.showModal({
                title: '确认开启',
                content: '将消耗 100 积分开启盲盒',
                success: async (res) => {
                    if (res.confirm) {
                        // 扣除积分
                        await this.deductCredit(openid, 100)
                        // 开始动画
                        this.startAnimation()
                    } else {
                        this.setData({ loading: false })
                    }
                }
            })
        } catch (err) {
            console.error(err)
            this.setData({ loading: false })
            wx.showToast({ title: '发生错误', icon: 'none' })
        }
    },

    startAnimation() {
        this.setData({ isShaking: true })

        // 模拟抽奖耗时
        setTimeout(async () => {
            const randomIndex = Math.floor(Math.random() * this.data.rewards.length)
            const reward = this.data.rewards[randomIndex]

            this.setData({
                isShaking: false,
                loading: false,
                showResult: true,
                resultItem: reward
            })

            // 发放奖励
            if (reward === "100 积分返还") {
                await this.deductCredit(this.data.openid, -100) // 负负得正，加回100
            } else if (reward !== "再接再厉") {
                // 其他实物/券类奖励添加到仓库
                await this.addRewardToStorage(reward)
            }

        }, 2000)
    },

    closeResult() {
        this.setData({ showResult: false })
    }
})
