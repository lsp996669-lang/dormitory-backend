const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { floor, checkInId, name, status } = event

  // 验证必填字段
  if (!floor || !checkInId || !name || !status) {
    return {
      code: 400,
      msg: '缺少必填字段：floor, checkInId, name, status'
    }
  }

  try {
    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    console.log('[markRollCall] 标记点名:', { floor, checkInId, name, status, date: today })

    // 检查是否已经存在该入住记录的点名记录
    const existingRes = await db.collection('rollcall_records')
      .where({
        check_in_id: checkInId,
        date: today
      })
      .get()

    if (existingRes.data.length > 0) {
      // 更新现有记录
      await db.collection('rollcall_records')
        .doc(existingRes.data[0]._id)
        .update({
          data: {
            status,
            remark: '',
            updated_at: new Date().toISOString()
          }
        })

      console.log('[markRollCall] 更新点名记录成功')
    } else {
      // 创建新记录
      await db.collection('rollcall_records').add({
        data: {
          check_in_id: checkInId,
          name,
          floor: String(floor),
          date: today,
          status,
          remark: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      })

      console.log('[markRollCall] 创建点名记录成功')
    }

    return {
      code: 200,
      msg: '点名标记成功'
    }
  } catch (error) {
    console.error('[markRollCall] 标记点名失败:', error)
    return {
      code: 500,
      msg: '标记点名失败: ' + error.message
    }
  }
}
