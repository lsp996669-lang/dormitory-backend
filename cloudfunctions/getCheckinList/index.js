const cloud = require('wx-server-sdk')
const _ = db.command

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { location } = event

  try {
    // 构建查询条件
    const whereCondition = {
      checkout_time: _.exists(false)
    }

    // 如果指定了位置，过滤该位置的记录
    if (location) {
      whereCondition.location = location
    }

    // 查询所有未搬离的记录
    const result = await db.collection('checkin_records')
      .where(whereCondition)
      .orderBy('created_at', 'desc')
      .get()

    return {
      code: 200,
      msg: '获取成功',
      data: result.data
    }
  } catch (error) {
    console.error('获取入住列表失败:', error)
    return {
      code: 500,
      msg: '获取入住列表失败: ' + error.message
    }
  }
}
