const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { floor, items } = event

  // 验证必填字段
  if (!floor || !items || !Array.isArray(items) || items.length === 0) {
    return {
      code: 400,
      msg: '缺少必填字段：floor, items'
    }
  }

  try {
    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    console.log('[batchRollCall] 批量点名:', { floor, itemsCount: items.length, date: today })

    // 查询所有未点名的入住记录
    const checkInIds = items.map(item => item.checkInId)

    // 查询这些入住记录的现有点名记录
    const existingRes = await db.collection('rollcall_records')
      .where({
        check_in_id: _.in(checkInIds),
        date: today
      })
      .get()

    // 构建现有记录的映射
    const existingMap = {}
    existingRes.data.forEach(record => {
      existingMap[record.check_in_id] = record
    })

    // 批量处理
    const operations = items.map(async (item) => {
      const existing = existingMap[item.checkInId]

      if (existing) {
        // 更新现有记录
        return db.collection('rollcall_records')
          .doc(existing._id)
          .update({
            data: {
              status: item.status,
              remark: '',
              updated_at: new Date().toISOString()
            }
          })
      } else {
        // 创建新记录
        return db.collection('rollcall_records').add({
          data: {
            check_in_id: item.checkInId,
            name: item.name,
            floor: String(floor),
            date: today,
            status: item.status,
            remark: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        })
      }
    })

    // 等待所有操作完成
    await Promise.all(operations)

    console.log('[batchRollCall] 批量点名成功')

    return {
      code: 200,
      msg: '批量点名成功',
      data: {
        count: items.length
      }
    }
  } catch (error) {
    console.error('[batchRollCall] 批量点名失败:', error)
    return {
      code: 500,
      msg: '批量点名失败: ' + error.message
    }
  }
}
