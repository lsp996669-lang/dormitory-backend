const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { recordId, note } = event

  // 验证必填字段
  if (!recordId) {
    return {
      code: 400,
      msg: '缺少记录ID'
    }
  }

  try {
    // 查询入住记录
    const record = await db.collection('checkin_records').doc(recordId).get()

    if (!record.data) {
      return {
        code: 404,
        msg: '入住记录不存在'
      }
    }

    // 检查是否已经搬离
    if (record.data.checkout_time) {
      return {
        code: 400,
        msg: '该人员已经搬离'
      }
    }

    // 更新为搬离状态
    await db.collection('checkin_records').doc(recordId).update({
      data: {
        checkout_time: new Date().toISOString(),
        checkout_note: note || '',
        updated_at: new Date().toISOString()
      }
    })

    // 同时添加到搬离记录表
    await db.collection('checkout_records').add({
      data: {
        ...record.data,
        checkout_time: new Date().toISOString(),
        checkout_note: note || '',
        updated_at: new Date().toISOString()
      }
    })

    return {
      code: 200,
      msg: '搬离登记成功'
    }
  } catch (error) {
    console.error('搬离登记失败:', error)
    return {
      code: 500,
      msg: '搬离登记失败: ' + error.message
    }
  }
}
