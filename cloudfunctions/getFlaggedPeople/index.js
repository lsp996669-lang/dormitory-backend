const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  try {
    console.log('[getFlaggedPeople] 开始获取红名人员列表...')

    // 获取所有红名标记的入住记录
    const result = await db.collection('checkin_records')
      .where({
        is_flagged: true
      })
      .orderBy('checkin_time', 'desc')
      .get()

    const records = result.data || []
    console.log('[getFlaggedPeople] 红名人员总数:', records.length)

    // 格式化数据
    const formattedRecords = records.map(record => ({
      id: record._id,
      check_in_id: record._id,
      bed_id: record.bed_id,
      name: record.person_name,
      id_card: record.person_id,
      phone: record.phone,
      checkin_time: record.checkin_time,
      floor: record.floor,
      bed_number: record.bed_number,
      position: record.position,
      dormitory: record.dormitory,
      room: record.room,
      station_name: record.station_name || null,
      is_flagged: true,
      payment_type: record.payment_type,
      payment_amount: record.payment_amount,
      remark: record.remark
    }))

    return {
      code: 200,
      msg: '获取红名人员列表成功',
      data: formattedRecords
    }
  } catch (error) {
    console.error('[getFlaggedPeople] 获取红名人员列表失败:', error)
    return {
      code: 500,
      msg: '获取红名人员列表失败: ' + error.message,
      data: []
    }
  }
}
