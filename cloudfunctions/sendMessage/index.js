// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
    try {
        const { touser, templateId, page, data } = event

        const result = await cloud.openapi.subscribeMessage.send({
            touser,
            templateId,
            page,
            data,
            miniprogramState: 'developer' // 开发版: 'developer', 体验版: 'trial', 正式版: 'formal'
        })

        return result
    } catch (err) {
        return err
    }
}