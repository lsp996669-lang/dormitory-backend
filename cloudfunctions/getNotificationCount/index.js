const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  try {
    console.log('[getNotificationCount] 开始获取通知数量...')

    // 获取未读通知数量（假设通知存储在 checkin_records 中，通过某种方式标记）
    // 这里简化为获取所有红名人员数量作为通知
    const flaggedResult = await db.collection('checkin_records').where({
      is_flagged: true
    }).get()

    const count = flaggedResult.data.length || 0
    console.log('[getNotificationCount] 通知数量:', count)

    return {
      code: 200,
      msg: '获取通知数量成功',
      data: {
        count
      }
    }
  } catch (error) {
    console.error('[getNotificationCount] 获取通知数量失败:', error)
    return {
      code: 500,
      msg: '获取通知数量失败: ' + error.message,
      data: {
        count: 0
      }
    }
  }
}
