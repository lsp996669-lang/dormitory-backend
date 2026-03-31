const ci = require('miniprogram-ci')
const path = require('path')

;(async () => {
  const project = new ci.Project({
    appid: 'wxeb1d51afc9237cda',
    type: 'miniProgram',
    projectPath: path.resolve(__dirname, './dist-weapp'),
    privateKeyPath: path.resolve(__dirname, './key/private.wxeb1d51afc9237cda.key'),
    ignores: ['node_modules/**/*'],
  })

  try {
    const uploadResult = await ci.upload({
      project,
      version: '1.0.1',
      desc: '修复审核被拒问题，移除测试内容',
      setting: {
        es6: false,
        es7: false,
        minify: true,
        codeProtect: false,
        minifyWXML: true,
        minifyWXSS: true,
        autoPrefixWXSS: true,
      },
      onProgressUpdate: console.log,
    })
    console.log('上传成功！')
    console.log(uploadResult)
  } catch (error) {
    console.error('上传失败：', error)
    process.exit(1)
  }
})()
