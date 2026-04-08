const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { name, phone, location, floor, room, bed, station, note } = event

  // 验证必填字段
  if (!name || !phone || !location || !floor || (!bed && !room)) {
    return {
      code: 400,
      msg: '缺少必填字段'
    }
  }

  try {
    // 查询床铺是否已被占用
    if (bed) {
      const existing = await db.collection('checkin_records').where({
        location,
        floor,
        bed,
        checkout_time: db.command.exists(false)
      }).get()

      if (existing.data.length > 0) {
        return {
          code: 400,
          msg: '该床铺已被占用'
        }
      }
    }

    // 生成入住记录
    const result = await db.collection('checkin_records').add({
      data: {
        name,
        phone,
        location,
        floor,
        room: room || '',
        bed: bed || '',
        station: station || '',
        note: note || '',
        checkin_time: new Date().toISOString(),
        checkout_time: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    })

    return {
      code: 200,
      msg: '入住登记成功',
      data: {
        id: result._id
      }
    }
  } catch (error) {
    console.error('入住登记失败:', error)
    return {
      code: 500,
      msg: '入住登记失败: ' + error.message
    }
  }
}
