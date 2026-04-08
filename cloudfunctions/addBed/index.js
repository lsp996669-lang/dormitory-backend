const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { dormitory, floor, room, bedNumber } = event

  // 验证必填字段
  if (!dormitory || !floor || !room || !bedNumber) {
    return {
      code: 400,
      msg: '缺少必填字段：dormitory, floor, room, bedNumber'
    }
  }

  try {
    // 检查是否已经存在该床位的上铺或下铺
    const existingUpper = await db.collection('beds').where({
      dormitory,
      floor: String(floor),
      room,
      bed_number: String(bedNumber),
      position: 'upper'
    }).get()

    const existingLower = await db.collection('beds').where({
      dormitory,
      floor: String(floor),
      room,
      bed_number: String(bedNumber),
      position: 'lower'
    }).get()

    const existingBeds = existingUpper.data.concat(existingLower.data)

    if (existingBeds.length > 0) {
      return {
        code: 400,
        msg: `该床位已存在：${room}房${bedNumber}号床`,
        data: existingBeds
      }
    }

    // 添加床位的上铺和下铺
    const newBeds = [
      {
        dormitory,
        floor: String(floor),
        room,
        bed_number: String(bedNumber),
        position: 'upper',
        status: 'empty',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        dormitory,
        floor: String(floor),
        room,
        bed_number: String(bedNumber),
        position: 'lower',
        status: 'empty',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]

    // 插入床位
    await db.collection('beds').add({
      data: newBeds[0]
    })

    await db.collection('beds').add({
      data: newBeds[1]
    })

    return {
      code: 200,
      msg: `成功添加床位：${room}房${bedNumber}号床（上下铺）`,
      data: {
        dormitory,
        floor,
        room,
        bedNumber,
        positions: ['upper', 'lower']
      }
    }
  } catch (error) {
    console.error('添加床位失败:', error)
    return {
      code: 500,
      msg: '添加床位失败: ' + error.message
    }
  }
}
