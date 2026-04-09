const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  try {
    console.log('[getNantwoFloorStats] 开始获取南二巷楼层统计数据...')

    // 获取所有床位
    const bedsResult = await db.collection('beds').where({
      dormitory: 'nantwo' // 南二巷
    }).get()

    const beds = bedsResult.data || []
    console.log('[getNantwoFloorStats] 南二巷床位总数:', beds.length)

    // 按楼层分组统计
    const floorStats = {}
    const floors = [2] // 南二巷只有 2 楼

    floors.forEach(floor => {
      floorStats[floor] = {
        floor,
        totalBeds: 0,
        occupiedBeds: 0,
        emptyBeds: 0,
        maintenanceBeds: 0
      }
    })

    beds.forEach(bed => {
      const floor = parseInt(bed.floor)
      if (floorStats[floor]) {
        floorStats[floor].totalBeds++
        if (bed.status === 'occupied') {
          floorStats[floor].occupiedBeds++
        } else if (bed.status === 'empty') {
          floorStats[floor].emptyBeds++
        } else if (bed.status === 'maintenance') {
          floorStats[floor].maintenanceBeds++
        }
      }
    })

    const stats = Object.values(floorStats).map(f => ({
      floor: f.floor,
      totalBeds: f.totalBeds,
      occupiedBeds: f.occupiedBeds,
      emptyBeds: f.emptyBeds,
      maintenanceBeds: f.maintenanceBeds
    }))

    console.log('[getNantwoFloorStats] 楼层统计数据:', stats)

    return {
      code: 200,
      msg: '获取南二巷楼层统计数据成功',
      data: stats
    }
  } catch (error) {
    console.error('[getNantwoFloorStats] 获取南二巷楼层统计数据失败:', error)
    return {
      code: 500,
      msg: '获取南二巷楼层统计数据失败: ' + error.message,
      data: null
    }
  }
}
