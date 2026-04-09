const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  console.log('[getTempFileURL] 收到请求:', event)

  const { fileIDs } = event

  if (!fileIDs || !Array.isArray(fileIDs) || fileIDs.length === 0) {
    return {
      code: 400,
      msg: '请提供 fileIDs 参数（数组）',
      data: null
    }
  }

  try {
    // 获取临时文件链接
    const result = await cloud.getTempFileURL({
      fileList: fileIDs
    })

    console.log('[getTempFileURL] 获取成功:', result)

    return {
      code: 200,
      msg: '获取成功',
      data: result.fileList
    }
  } catch (error) {
    console.error('[getTempFileURL] 获取失败:', error)
    return {
      code: 500,
      msg: '获取临时链接失败: ' + error.message,
      data: null
    }
  }
}
