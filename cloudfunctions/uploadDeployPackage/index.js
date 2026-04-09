const cloud = require('wx-server-sdk')
const fs = require('fs')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  console.log('[uploadDeployPackage] 收到请求:', event)

  // 检查文件是否存在
  const filePath = '/tmp/miniprogram-deploy-v1.0.0.tar.gz'

  if (!fs.existsSync(filePath)) {
    return {
      code: 404,
      msg: '文件不存在，请先构建小程序',
      data: null
    }
  }

  try {
    // 读取文件
    const fileContent = fs.readFileSync(filePath)

    console.log('[uploadDeployPackage] 文件大小:', fileContent.length, 'bytes')

    // 上传到云存储
    const uploadResult = await cloud.uploadFile({
      cloudPath: `packages/miniprogram-deploy-v1.0.0.tar.gz`,
      fileContent: fileContent
    })

    console.log('[uploadDeployPackage] 上传成功:', uploadResult)

    // 获取临时链接
    const tempFileResult = await cloud.getTempFileURL({
      fileList: [uploadResult.fileID]
    })

    console.log('[uploadDeployPackage] 临时链接:', tempFileResult)

    return {
      code: 200,
      msg: '上传成功',
      data: {
        fileID: uploadResult.fileID,
        tempFileURL: tempFileResult.fileList[0].tempFileURL,
        maxAge: tempFileResult.fileList[0].maxAge,
        fileName: 'miniprogram-deploy-v1.0.0.tar.gz',
        fileSize: `${(fileContent.length / 1024).toFixed(2)} KB`,
        uploadTime: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('[uploadDeployPackage] 上传失败:', error)
    return {
      code: 500,
      msg: '上传失败: ' + error.message,
      data: null
    }
  }
}
