const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  try {
    console.log('[getStats] 开始获取统计数据...')

    // 获取入住记录总数
    const checkinCount = await db.collection('checkin_records').count()
    const totalCheckins = checkinCount.total || 0

    // 获取搬离记录总数
    const checkoutCount = await db.collection('checkout_records').count()
    const totalCheckouts = checkoutCount.total || 0

    // 获取当前入住人数（未搬离的）
    const checkinResult = await db.collection('checkin_records').get()
    const currentCheckins = checkinResult.data.length || 0

    // 获取床位总数
    const bedsCount = await db.collection('beds').count()
    const totalBeds = bedsCount.total || 0

    // 获取空床位数量
    const emptyBedsResult = await db.collection('beds').where({
      status: 'empty'
    }).get()
    const emptyBeds = emptyBedsResult.data.length || 0

    // 获取已入住床位数量
    const occupiedBedsResult = await db.collection('beds').where({
      status: 'occupied'
    }).get()
    const occupiedBeds = occupiedBedsResult.data.length || 0

    // 获取红名人员数量
    const flaggedResult = await db.collection('checkin_records').where({
      is_flagged: true
    }).get()
    const flaggedCount = flaggedResult.data.length || 0

    const stats = {
      totalCheckins,
      totalCheckouts,
      currentCheckins,
      totalBeds,
      emptyBeds,
      occupiedBeds,
      flaggedCount
    }

    console.log('[getStats] 统计数据:', stats)

    return {
      code: 200,
      msg: '获取统计数据成功',
      data: stats
    }
  } catch (error) {
    console.error('[getStats] 获取统计数据失败:', error)
    return {
      code: 500,
      msg: '获取统计数据失败: ' + error.message,
      data: null
    }
  }
}
