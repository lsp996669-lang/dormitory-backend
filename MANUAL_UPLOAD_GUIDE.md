# 🚀 小程序体验版上传指南（手动方式）

## ⚠️ 自动上传失败

由于 miniprogram-ci 的 Babel 编译器存在依赖冲突（`_lruCache is not a constructor`），暂时无法使用命令行自动上传。

## ✅ 手动上传步骤

### 1. 确保编译完成

```bash
cd /workspace/projects
pnpm build:weapp
```

**编译成功标志**：
```
✓ built in 9.23s
```

### 2. 打开微信开发者工具

1. 下载并安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 打开微信开发者工具

### 3. 导入项目

1. 点击「导入项目」
2. 填写项目信息：
   - **项目名称**: 宿舍管理助手
   - **目录**: `/workspace/projects/dist-weapp`（选择编译后的目录）
   - **AppID**: `wxeb1d51afc9237cda`
   - **后端服务**: 不使用云服务（因为已迁移到云函数）

3. 点击「导入」

### 4. 上传体验版

1. 在微信开发者工具顶部菜单栏，点击「上传」
2. 填写版本信息：
   - **版本号**: `1.0.0`（或自定义版本号）
   - **项目备注**: 宿舍管理助手 - 迁移到云函数版本
3. 点击「上传」

### 5. 提交审核（可选）

1. 上传成功后，前往 [微信小程序管理后台](https://mp.weixin.qq.com/)
2. 登录账号
3. 点击「版本管理」→「体验版」
4. 点击「提交审核」
5. 填写审核信息：
   - **服务类目**: 工具 - 效率
   - **功能页面**: 首页（楼层管理）
   - **功能介绍**: 企业内部宿舍入住与搬离管理系统

### 6. 设置体验成员

1. 在微信小程序管理后台
2. 点击「成员管理」→「体验成员」
3. 输入微信号或手机号
4. 点击「添加」

## 📋 上传前检查清单

- ✅ 代码已编译成功
- ✅ 云函数已部署
- ✅ 私钥文件 `private.key` 存在
- ✅ AppID 正确：`wxeb1d51afc9237cda`
- ✅ 版本号已更新

## 🔧 故障排除

### 问题：上传失败

**解决方案**：
1. 检查网络连接
2. 清理缓存：删除 `dist-weapp` 目录，重新编译
3. 检查 AppID 是否正确
4. 确保微信开发者工具已登录

### 问题：云函数未生效

**解决方案**：
1. 在微信开发者工具中，右键点击 `cloudfunctions` 目录
2. 选择「上传并部署：云端安装依赖」
3. 等待部署完成

### 问题：无法添加体验成员

**解决方案**：
1. 确保微信号或手机号已注册微信
2. 确保该用户未被添加到正式版用户
3. 体验成员最多 15 人

## 📱 体验版二维码

上传成功后，可以：

1. 在微信小程序管理后台获取体验版二维码
2. 扫码预览体验版
3. 分享给体验成员

## 🚀 快速上传命令

如果您想快速准备上传环境：

```bash
# 1. 清理并重新编译
cd /workspace/projects
rm -rf dist-weapp node_modules/.cache node_modules/.vite
pnpm build:weapp

# 2. 检查编译结果
ls -la dist-weapp/

# 3. 在微信开发者工具中导入 dist-weapp 目录
```

## 📚 相关文档

- [微信小程序上传与发布](https://developers.weixin.qq.com/miniprogram/dev/devtools/upload.html)
- [微信小程序体验版说明](https://developers.weixin.qq.com/miniprogram/dev/framework/ability/preview.html)

## 💡 下次自动上传

当 miniprogram-ci 的 Babel 依赖问题修复后，可以使用以下命令自动上传：

```bash
pnpm deploy:review  # 上传体验版
pnpm deploy:upload  # 上传正式版
```

---

**祝您上传顺利！** 🎉
