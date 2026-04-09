const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  try {
    console.log('[getAllBeds] 开始获取所有床位...')

    // 获取南四巷所有床位
    const nansiResult = await db.collection('beds').where({
      dormitory: 'nansi'
    }).get()

    const nansiBeds = nansiResult.data.map(bed => ({
      id: bed._id,
      floor: parseInt(bed.floor),
      bed_number: parseInt(bed.bed_number),
      position: bed.position,
      room: bed.room,
      dormitory: 'nansi',
      status: bed.status
    }))

    // 获取南二巷所有床位
    const nantwoResult = await db.collection('beds').where({
      dormitory: 'nantwo'
    }).get()

    const nantwoBeds = nantwoResult.data.map(bed => ({
      id: bed._id,
      floor: parseInt(bed.floor),
      bed_number: parseInt(bed.bed_number),
      position: bed.position,
      room: bed.room,
      dormitory: 'nantwo',
      status: bed.status
    }))

    console.log('[getAllBeds] 南四巷床位:', nansiBeds.length, '南二巷床位:', nantwoBeds.length)

    return {
      code: 200,
      msg: '获取所有床位成功',
      data: {
        nansiBeds,
        nantwoBeds
      }
    }
  } catch (error) {
    console.error('[getAllBeds] 获取所有床位失败:', error)
    return {
      code: 500,
      msg: '获取所有床位失败: ' + error.message,
      data: {
        nansiBeds: [],
        nantwoBeds: []
      }
    }
  }
}
