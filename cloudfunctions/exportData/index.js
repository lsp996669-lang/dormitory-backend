const cloud = require('wx-server-sdk')
const ExcelJS = require('exceljs')
const fs = require('fs')
const path = require('path')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  try {
    // 查询所有入住记录
    const checkinResult = await db.collection('checkin_records')
      .where({
        checkout_time: _.exists(false)
      })
      .orderBy('location', 'asc')
      .orderBy('floor', 'asc')
      .orderBy('bed', 'asc')
      .get()

    // 查询所有搬离记录
    const checkoutResult = await db.collection('checkout_records')
      .orderBy('checkout_time', 'desc')
      .get()

    const checkinRecords = checkinResult.data
    const checkoutRecords = checkoutResult.data

    // 创建 Excel 工作簿
    const workbook = new ExcelJS.Workbook()

    // 创建入住记录 sheet
    if (checkinRecords.length > 0) {
      // 按楼层分类
      const floors = {
        '南四巷180号': { '2楼': [], '3楼': [], '4楼': [] },
        '南二巷24号': []
      }

      checkinRecords.forEach(record => {
        if (record.location === '南四巷180号') {
          const floorKey = `${record.floor}楼`
          if (floors['南四巷180号'][floorKey]) {
            floors['南四巷180号'][floorKey].push(record)
          }
        } else {
          floors['南二巷24号'].push(record)
        }
      })

      // 为每个楼层创建独立的 sheet
      Object.keys(floors).forEach(location => {
        if (location === '南四巷180号') {
          // 南四巷按楼层拆分
          ['2楼', '3楼', '4楼'].forEach(floor => {
            const records = floors[location][floor]
            if (records.length > 0) {
              const sheet = workbook.addWorksheet(`${location}${floor}入住人员`)
              addCheckinSheet(sheet, records)
            }
          })
        } else {
          // 南二巷单独一个 sheet
          const records = floors[location]
          if (records.length > 0) {
            const sheet = workbook.addWorksheet(`${location}入住人员`)
            addCheckinSheet(sheet, records)
          }
        }
      })
    }

    // 创建搬离记录 sheet
    if (checkoutRecords.length > 0) {
      const checkoutSheet = workbook.addWorksheet('搬离人员')
      addCheckoutSheet(checkoutSheet, checkoutRecords)
    }

    // 生成 Excel 文件到临时目录
    const tempDir = '/tmp'
    const fileName = `宿舍登记数据_${new Date().toISOString().slice(0, 10)}.xlsx`
    const filePath = path.join(tempDir, fileName)

    await workbook.xlsx.writeFile(filePath)

    // 读取文件并上传到云存储
    const fileContent = fs.readFileSync(filePath)
    const uploadResult = await cloud.uploadFile({
      cloudPath: `exports/${fileName}`,
      fileContent: fileContent
    })

    // 删除临时文件
    fs.unlinkSync(filePath)

    // 获取文件下载链接（需要设置文件为公开访问或获取临时链接）
    const fileID = uploadResult.fileID

    return {
      code: 200,
      msg: '导出成功',
      data: {
        fileID: fileID,
        fileName: fileName
      }
    }
  } catch (error) {
    console.error('导出数据失败:', error)
    return {
      code: 500,
      msg: '导出数据失败: ' + error.message
    }
  }
}

// 添加入住记录 sheet
function addCheckinSheet(sheet, records) {
  // 设置表头
  sheet.columns = [
    { header: '姓名', key: 'name', width: 15 },
    { header: '联系电话', key: 'phone', width: 15 },
    { header: '位置', key: 'location', width: 15 },
    { header: '楼层', key: 'floor', width: 10 },
    { header: '房号', key: 'room', width: 10 },
    { header: '床铺', key: 'bed', width: 10 },
    { header: '站点标注', key: 'station', width: 15 },
    { header: '入住时间', key: 'checkin_time', width: 25 },
    { header: '备注', key: 'note', width: 20 }
  ]

  // 添加数据
  records.forEach(record => {
    sheet.addRow({
      name: record.name,
      phone: record.phone,
      location: record.location,
      floor: record.floor,
      room: record.room || '',
      bed: record.bed || '',
      station: record.station || '',
      checkin_time: formatDate(record.checkin_time),
      note: record.note || ''
    })
  })

  // 设置表头样式
  sheet.getRow(1).font = { bold: true }
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  }
}

// 添加搬离记录 sheet
function addCheckoutSheet(sheet, records) {
  // 设置表头
  sheet.columns = [
    { header: '姓名', key: 'name', width: 15 },
    { header: '联系电话', key: 'phone', width: 15 },
    { header: '位置', key: 'location', width: 15 },
    { header: '楼层', key: 'floor', width: 10 },
    { header: '房号', key: 'room', width: 10 },
    { header: '床铺', key: 'bed', width: 10 },
    { header: '站点标注', key: 'station', width: 15 },
    { header: '入住时间', key: 'checkin_time', width: 25 },
    { header: '搬离时间', key: 'checkout_time', width: 25 },
    { header: '备注', key: 'note', width: 20 }
  ]

  // 添加数据
  records.forEach(record => {
    sheet.addRow({
      name: record.name,
      phone: record.phone,
      location: record.location,
      floor: record.floor,
      room: record.room || '',
      bed: record.bed || '',
      station: record.station || '',
      checkin_time: formatDate(record.checkin_time),
      checkout_time: formatDate(record.checkout_time),
      note: record.note || ''
    })
  })

  // 设置表头样式
  sheet.getRow(1).font = { bold: true }
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  }
}

// 格式化日期
function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
