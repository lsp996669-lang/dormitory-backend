const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { floor, date, dormitory } = event

  // 验证必填字段
  if (!floor || !date) {
    return {
      code: 400,
      msg: '缺少必填字段：floor, date'
    }
  }

  try {
    console.log('[getRollCallList] 查询参数:', { floor, date, dormitory })

    // 构建查询条件
    const whereCondition = {
      floor: String(floor)
    }

    // 如果指定了宿舍区域，则只查询该区域
    if (dormitory) {
      whereCondition.dormitory = dormitory
    }

    // 查询所有入住记录
    const checkinRes = await db.collection('checkin_records')
      .where(whereCondition)
      .orderBy('check_in_time', 'desc')
      .get()

    console.log('[getRollCallList] 入住记录数量:', checkinRes.data.length)

    // 查询当天的点名记录
    const rollcallRes = await db.collection('rollcall_records')
      .where({
        date: date,
        floor: String(floor)
      })
      .get()

    console.log('[getRollCallList] 点名记录数量:', rollcallRes.data.length)

    // 构建点名记录映射
    const rollcallMap = {}
    rollcallRes.data.forEach(record => {
      rollcallMap[record.check_in_id] = record
    })

    // 合并数据
    const rollCallList = checkinRes.data.map(checkin => {
      const rollcall = rollcallMap[checkin.id] || {}
      return {
        checkInId: checkin.id,
        bedId: checkin.bed_id,
        bedNumber: checkin.bed_number,
        position: checkin.position,
        name: checkin.name,
        idCard: checkin.id_card,
        phone: checkin.phone,
        checkInTime: checkin.check_in_time,
        rollCallId: rollcall.id || null,
        status: rollcall.status || null,
        remark: rollcall.remark || null,
        rollCallTime: rollcall.created_at || null,
        dormitory: checkin.dormitory,
        room: checkin.room
      }
    })

    return {
      code: 200,
      msg: '获取点名列表成功',
      data: rollCallList
    }
  } catch (error) {
    console.error('[getRollCallList] 获取点名列表失败:', error)
    return {
      code: 500,
      msg: '获取点名列表失败: ' + error.message
    }
  }
}
