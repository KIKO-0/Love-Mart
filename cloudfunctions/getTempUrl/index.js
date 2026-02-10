// cloudfunctions/getTempUrl/index.js
const cloud = require('wx-server-sdk')

cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
    const fileList = event.fileList || []

    if (fileList.length === 0) {
        return { fileList: [] }
    }

    try {
        const result = await cloud.getTempFileURL({
            fileList: fileList,
        })
        return result
    } catch (err) {
        return {
            error: err,
            fileList: []
        }
    }
}
