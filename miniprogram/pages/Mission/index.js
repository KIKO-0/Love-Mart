Page({
  data: {
    screenWidth: 1000,
    screenHeight: 1000,

    search: "",

    allMissions: [],
    unfinishedMissions: [],
    finishedMissions: [],

    _openidA: getApp().globalData._openidA,
    _openidB: getApp().globalData._openidB,

    slideButtons: [
      { extClass: 'markBtn', text: '标记', src: "Images/icon_mark.svg" },
      { extClass: 'starBtn', text: '星标', src: "Images/icon_star.svg" },
      { extClass: 'removeBtn', text: '删除', src: 'Images/icon_del.svg' }
    ],
  },

  //页面加载时运行
  async onShow() {
    await wx.cloud.callFunction({ name: 'getList', data: { list: getApp().globalData.collectionMissionList } }).then(data => {
      this.setData({ allMissions: data.result.data })
      this.filterMission()
      this.getScreenSize()
    })
  },

  //获取页面大小
  async getScreenSize() {
    wx.getSystemInfo({
      success: (res) => {
        this.setData({
          screenWidth: res.windowWidth,
          screenHeight: res.windowHeight,
          // 初始位置设为右下角 (80%处)，避免直接设为窗口宽高导致可能的越界
          xPosition: res.windowWidth * 0.8,
          yPosition: res.windowHeight * 0.8
        })
      }
    })
  },

  //转到任务详情
  async toDetailPage(element, isUpper) {
    const missionIndex = element.currentTarget.dataset.index
    const mission = isUpper ? this.data.unfinishedMissions[missionIndex] : this.data.finishedMissions[missionIndex]
    wx.navigateTo({ url: '../MissionDetail/index?id=' + mission._id })
  },
  //转到任务详情[上]
  async toDetailPageUpper(element) {
    this.toDetailPage(element, true)
  },
  //转到任务详情[下]
  async toDetailPageLower(element) {
    this.toDetailPage(element, false)
  },
  //转到添加任务
  async toAddPage() {
    wx.navigateTo({ url: '../MissionAdd/index' })
  },

  //设置搜索
  onSearch(element) {
    this.setData({
      search: element.detail.value
    })

    this.filterMission()
  },

  //将任务划分为：完成，未完成
  filterMission() {
    let missionList = []
    if (this.data.search != "") {
      for (let i in this.data.allMissions) {
        if (this.data.allMissions[i].title.match(this.data.search) != null) {
          missionList.push(this.data.allMissions[i])
        }
      }
    } else {
      missionList = this.data.allMissions
    }

    this.setData({
      unfinishedMissions: missionList.filter(item => item.available === true),
      finishedMissions: missionList.filter(item => item.available === false),
    })
  },

  //响应左划按钮事件[上]
  async slideButtonTapUpper(element) {
    this.slideButtonTap(element, true)
  },

  //响应左划按钮事件[下]
  async slideButtonTapLower(element) {
    this.slideButtonTap(element, false)
  },

  //响应左划按钮事件逻辑
  async slideButtonTap(element, isUpper) {
    //得到UI序号
    const { index } = element.detail

    //根据序号获得任务
    const missionIndex = element.currentTarget.dataset.index
    const mission = isUpper === true ? this.data.unfinishedMissions[missionIndex] : this.data.finishedMissions[missionIndex]

    await wx.cloud.callFunction({ name: 'getOpenId' }).then(async openid => {

      //处理完成点击事件
      if (index === 0) {
        if (isUpper) {
          this.finishMission(element)
        } else {
          wx.showToast({
            title: '任务已经完成',
            icon: 'error',
            duration: 2000
          })
        }

      } else if (mission._openid === openid.result) {
        //处理星标按钮点击事件
        if (index === 1) {
          wx.cloud.callFunction({ name: 'editStar', data: { _id: mission._id, list: getApp().globalData.collectionMissionList, value: !mission.star } })
          //更新本地数据
          mission.star = !mission.star
        }

        //处理删除按钮点击事件
        else if (index === 2) {
          wx.cloud.callFunction({ name: 'deleteElement', data: { _id: mission._id, list: getApp().globalData.collectionMissionList } })
          //更新本地数据
          if (isUpper) this.data.unfinishedMissions.splice(missionIndex, 1)
          else this.data.finishedMissions.splice(missionIndex, 1)
          //如果删除完所有事项，刷新数据，让页面显示无事项图片
          if (this.data.unfinishedMissions.length === 0 && this.data.finishedMissions.length === 0) {
            this.setData({
              allMissions: [],
              unfinishedMissions: [],
              finishedMissions: []
            })
          }
        }

        //触发显示更新
        this.setData({ finishedMissions: this.data.finishedMissions, unfinishedMissions: this.data.unfinishedMissions })

        //如果编辑的不是自己的任务，显示提醒
      } else {
        wx.showToast({
          title: '只能编辑自己的任务',
          icon: 'error',
          duration: 2000
        })
      }
    })
  },

  //完成任务
  async finishMission(element) {
    //根据序号获得触发切换事件的待办
    const missionIndex = element.currentTarget.dataset.index
    const mission = this.data.unfinishedMissions[missionIndex]

    await wx.cloud.callFunction({ name: 'getOpenId' }).then(async openid => {
      if (mission._openid != openid.result) {
        //完成对方任务，奖金打入对方账号
        await wx.cloud.callFunction({ name: 'editAvailable', data: { _id: mission._id, value: false, list: getApp().globalData.collectionMissionList } })

        const creditRes = await wx.cloud.callFunction({ name: 'editCredit', data: { _openid: openid.result, value: mission.credit, list: getApp().globalData.collectionUserList } })

        if (creditRes && creditRes.result && creditRes.result.stats && creditRes.result.stats.updated === 0) {
          wx.showModal({
            title: '积分更新失败',
            content: '未找到您的用户记录。请确保您的 OpenID 已正确配置在 app.js 中，并且 UserList 数据库中有对应记录。',
            showCancel: false
          })
        }

        //触发显示更新
        mission.available = false
        this.filterMission()

        //显示提示
        wx.showToast({
          title: '任务完成',
          icon: 'success',
          duration: 2000
        })

        // 发送订阅消息通知对方
        // 注意：这里需要根据实际模板ID的关键词进行修改
        const timeStr = util.formatTime(new Date())
        wx.cloud.callFunction({
          name: 'sendMessage',
          data: {
            touser: mission._openid, // 通知任务发布者
            templateId: getApp().globalData.templateId,
            page: 'pages/Mission/index',
            data: {
              // 示例数据，请根据您的实际模板关键词修改
              // key 通常为 thing1, phrase2, date3 等
              thing1: { value: mission.title.substring(0, 20) },
              phrase2: { value: '任务已完成' },
              date3: { value: timeStr }
            }
          }
        }).then(res => {
          console.log('发送消息结果', res)
        }).catch(err => {
          console.error('发送消息失败', err)
        })

      } else {
        wx.showToast({
          title: '不能完成自己的任务',
          icon: 'error',
          duration: 2000
        })
      }
    })
  },
})