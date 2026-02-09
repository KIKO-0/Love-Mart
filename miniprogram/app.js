App({
  async onLaunch() {
    this.initcloud()

    this.globalData = {
      //记录使用者的openid
      // (IMPORTANT: 请将下面的 OpenID 替换为您和您女朋友的实际 OpenID)
      // 您可以在小程序主页底部看到您当前登录账号的 OpenID
      _openidA: 'oDkJR3fqMsoXjy4hABCZ4l8NBkb8',
      _openidB: 'oDkJR3ctXb27TjVORGgEIWhOWEzs',

      //记录使用者的名字
      userA: '张博',
      userB: '方柯人',

      //用于存储待办记录的集合名称
      collectionMissionList: 'MissionList',
      collectionMarketList: 'MarketList',
      collectionStorageList: 'StorageList',
      collectionUserList: 'UserList',

      //最多单次交易积分
      maxCredit: 500,

      // 订阅消息模板ID
      templateId: '773KsGCgHf7cp-6LZNeSPWpQFEC4Y3MazIi9_YxOQPU',
    }
  },

  flag: false,

  /**
   * 初始化云开发环境
   */
  async initcloud() {
    const normalinfo = require('./envList.js').envList || [] // 读取 envlist 文件
    if (normalinfo.length != 0 && normalinfo[0].envId != null) { // 如果文件中 envlist 存在
      wx.cloud.init({ // 初始化云开发环境
        traceUser: true,
        env: normalinfo[0].envId
      })
      // 装载云函数操作对象返回方法
      this.cloud = () => {
        return wx.cloud // 直接返回 wx.cloud
      }
    } else { // 如果文件中 envlist 不存在，提示要配置环境
      this.cloud = () => {
        wx.showModal({
          content: '无云开发环境',
          showCancel: false
        })
        throw new Error('无云开发环境')
      }
    }
  },

  // 获取云数据库实例
  async database() {
    return (await this.cloud()).database()
  },
})