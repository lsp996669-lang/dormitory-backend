/**
 * 微信小程序自动部署脚本
 * 使用 miniprogram-ci 实现 CI/CD 自动部署
 *
 * 使用方法：
 * 1. 设置环境变量（或在 .env 文件中配置）：
 *    - MINIPROGRAM_APPID: 小程序 AppID
 *    - MINIPROGRAM_PRIVATE_KEY_PATH: 私钥文件路径
 *    - MINIPROGRAM_ROBOT_VERSION: 机器人版本号（可选）
 *
 * 2. 运行部署：
 *    node deploy.js
 *
 * 3. 或者使用 npm scripts：
 *    pnpm deploy:preview  # 上传预览版
 *    pnpm deploy:review   # 上传体验版
 *    pnpm deploy:upload   # 上传正式版
 */

const ci = require('miniprogram-ci');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 小程序配置
const projectConfig = {
  appid: process.env.MINIPROGRAM_APPID,
  type: 'miniProgram',
  projectPath: path.resolve(__dirname, 'dist-weapp'),
  privateKeyPath: process.env.MINIPROGRAM_PRIVATE_KEY_PATH,
  ignores: [
    'node_modules/**/*',
    'cloudfunctions/**/*',
  ],
};

// 部署配置
const deployOptions = {
  robot: parseInt(process.env.MINIPROGRAM_ROBOT_VERSION || '1'),
  version: process.env.MINIPROGRAM_VERSION || new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
  desc: process.env.MINIPROGRAM_DESC || `自动部署 - ${new Date().toLocaleString('zh-CN')}`,
  setting: {
    es6: false,
    es7: false,
    minify: false,
    codeProtect: false,
    autoPrefixWXSS: true,
    enhance: false,
    useCompilerPlugins: [],
  },
  onProgressUpdate: (log) => {
    console.log(log);
  },
};

/**
 * 上传预览版
 * 生成预览二维码，扫码可预览
 */
async function uploadPreview() {
  console.log('🚀 开始上传预览版...');

  try {
    const project = new ci.Project(projectConfig);
    const previewResult = await ci.upload({
      project,
      ...deployOptions,
      setting: {
        ...deployOptions.setting,
        minify: false, // 预览版不压缩
      },
    });

    console.log('✅ 预览版上传成功！');
    console.log('预览信息：', previewResult);
  } catch (error) {
    console.error('❌ 预览版上传失败：', error);
    process.exit(1);
  }
}

/**
 * 上传体验版
 * 生成体验版二维码，可分享给测试人员
 */
async function uploadReview() {
  console.log('🚀 开始上传体验版...');

  try {
    const project = new ci.Project(projectConfig);
    const uploadResult = await ci.upload({
      project,
      ...deployOptions,
      desc: `${deployOptions.desc} [体验版]`,
    });

    console.log('✅ 体验版上传成功！');
    console.log('体验版信息：', uploadResult);

    // 生成预览二维码
    console.log('📱 正在生成预览二维码...');
    try {
      const qrcodePath = path.resolve(__dirname, 'qrcode.jpg');
      await ci.getPreviewQRCode({
        project,
        filepath: qrcodePath,
      });
      console.log(`✅ 二维码已生成：${qrcodePath}`);
    } catch (error) {
      console.log('⚠️ 二维码生成失败（可选）：', error.message);
      console.log('✅ 体验版已成功上传，可在微信开发者工具中手动生成二维码');
    }
  } catch (error) {
    console.error('❌ 体验版上传失败：', error);
    process.exit(1);
  }
}

/**
 * 上传正式版
 * 提交微信审核
 */
async function uploadProduction() {
  console.log('🚀 开始上传正式版...');

  try {
    const project = new ci.Project(projectConfig);
    const uploadResult = await ci.upload({
      project,
      ...deployOptions,
      desc: `${deployOptions.desc} [正式版]`,
    });

    console.log('✅ 正式版上传成功！');
    console.log('上传信息：', uploadResult);

    // 提交审核（可选）
    if (process.env.AUTO_SUBMIT_AUDIT === 'true') {
      console.log('📋 正在提交审核...');
      await ci.submitAudit({
        project,
        version: deployOptions.version,
      });
      console.log('✅ 已提交审核');
    }
  } catch (error) {
    console.error('❌ 正式版上传失败：', error);
    process.exit(1);
  }
}

/**
 * 主函数
 */
async function main() {
  const command = process.argv[2] || 'preview';

  console.log('='.repeat(50));
  console.log('🎯 微信小程序自动部署');
  console.log('='.repeat(50));
  console.log('部署类型：', command);
  console.log('版本号：', deployOptions.version);
  console.log('AppID：', projectConfig.appid);
  console.log('='.repeat(50));

  switch (command) {
    case 'preview':
      await uploadPreview();
      break;
    case 'review':
      await uploadReview();
      break;
    case 'production':
    case 'upload':
      await uploadProduction();
      break;
    default:
      console.log('❌ 未知的部署类型：', command);
      console.log('可用命令：preview, review, production');
      process.exit(1);
  }

  console.log('='.repeat(50));
  console.log('🎉 部署完成！');
  console.log('='.repeat(50));
}

// 运行
main().catch((error) => {
  console.error('❌ 部署失败：', error);
  process.exit(1);
});
