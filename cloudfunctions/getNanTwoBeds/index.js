const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { floor, room } = event

  // 验证必填字段
  if (!floor) {
    return {
      code: 400,
      msg: '缺少必填字段：floor'
    }
  }

  try {
    console.log('[getNanTwoBeds] 查询参数:', { floor, room })

    // 构建查询条件
    const whereCondition = {
      dormitory: 'nantwo',
      floor: String(floor)
    }

    // 如果指定了房间号，则只查询该房间
    if (room) {
      whereCondition.room = room
    }

    // 查询床位
    const bedsRes = await db.collection('beds')
      .where(whereCondition)
      .orderBy('room', 'asc')
      .orderBy('bed_number', 'asc')
      .orderBy('position', 'asc')
      .get()

    console.log('[getNanTwoBeds] 查询到床位数量:', bedsRes.data.length)

    // 查询入住记录
    const checkinRes = await db.collection('checkin_records')
      .where({
        dormitory: 'nantwo',
        floor: String(floor),
        check_out_time: _.exists(false) // 未搬离
      })
      .get()

    console.log('[getNanTwoBeds] 查询到入住记录数量:', checkinRes.data.length)

    // 构建入住记录映射
    const checkinMap = {}
    checkinRes.data.forEach(checkin => {
      checkinMap[checkin.bed_id] = checkin
    })

    // 合并数据
    const beds = bedsRes.data.map(bed => {
      const checkin = checkinMap[bed._id] || null

      return {
        id: bed._id,
        floor: parseInt(bed.floor, 10),
        bedNumber: parseInt(bed.bed_number, 10),
        position: bed.position,
        status: bed.status,
        room: bed.room,
        dormitory: bed.dormitory,
        checkIn: checkin ? {
          id: checkin.id,
          name: checkin.name,
          idCard: checkin.id_card,
          phone: checkin.phone,
          checkInTime: checkin.check_in_time,
          isStationMarked: checkin.is_station_marked ?? false,
          isRider: checkin.is_rider ?? false,
          isFlagged: checkin.is_flagged ?? false,
          stationName: checkin.station_name ?? null,
        } : undefined
      }
    })

    return {
      code: 200,
      msg: '获取床位成功',
      data: beds
    }
  } catch (error) {
    console.error('[getNanTwoBeds] 获取床位失败:', error)
    return {
      code: 500,
      msg: '获取床位失败: ' + error.message
    }
  }
}
