const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { location } = event

  try {
    // 构建查询条件
    const whereCondition = {}

    // 如果指定了位置，过滤该位置的记录
    if (location) {
      whereCondition.location = location
    }

    // 查询搬离记录（从 checkout_records 集合）
    const result = await db.collection('checkout_records')
      .where(whereCondition)
      .orderBy('checkout_time', 'desc')
      .get()

    return {
      code: 200,
      msg: '获取成功',
      data: result.data
    }
  } catch (error) {
    console.error('获取搬离列表失败:', error)
    return {
      code: 500,
      msg: '获取搬离列表失败: ' + error.message
    }
  }
}
