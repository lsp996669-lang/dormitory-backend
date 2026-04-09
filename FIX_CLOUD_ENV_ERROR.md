# 云开发环境错误修复

## 错误信息

```
请在编辑器云函数根目录（cloudfunctionRoot）选择一个云环境
```

## 最快解决方案（3步）

### 步骤 1：开通云开发

1. 在微信开发者工具中，点击顶部「云开发」按钮
2. 点击「开通」
3. 选择「按量付费」或「免费额度」
4. 环境名称填写：`dorm-management`
5. 点击「确定」

### 步骤 2：获取环境 ID

1. 进入「云开发」控制台
2. 点击「设置」->「环境设置」
3. 复制环境 ID（如：`dorm-management-8f7a6b`）

### 步骤 3：更新 project.config.json

打开 `project.config.json` 文件，添加 `cloudbase` 配置：

```json
{
  "miniprogramRoot": "./dist-weapp",
  "projectname": "宿舍管理助手",
  "description": "宿舍管理助手 - 企业内部宿舍入住与搬离管理系统",
  "appid": "wxeb1d51afc9237cda",
  "cloudfunctionRoot": "./cloudfunctions/",
  "cloudbaseRoot": "./cloudfunctions/",
  "setting": {
    "urlCheck": false,
    "es6": false,
    "enhance": false,
    "compileHotReLoad": true,
    "postcss": false,
    "minified": true,
    "ignoreHttpsCase": true,
    "ignoreDomainNameCheck": true
  },
  "compileType": "miniprogram",
  "srcMiniprogramRoot": "./src/",
  "condition": {},
  "debugOptions": {
    "debugAsRelease": true
  },
  "cloudbase": {
    "env": "你的环境ID"
  }
}
```

**重要**：将 `"你的环境ID"` 替换为你复制的真实环境 ID。

### 步骤 4：重启微信开发者工具

1. 关闭微信开发者工具
2. 重新打开项目
3. 检查左侧 `cloudfunctions` 目录是否正常显示（应该有云图标 ☁️）

## 验证是否成功

配置成功后，你应该能看到：

- ✅ 左侧 `cloudfunctions` 目录前有云图标 ☁️
- ✅ 右键点击云函数文件夹，能看到「上传并部署」选项
- ✅ 不再出现"请选择云环境"的错误提示

## 下一步

配置成功后，继续完成以下操作：

1. 上传 6 个云函数（右键云函数文件夹 -> 上传并部署）
2. 创建数据库集合（beds, checkin_records, checkout_records）
3. 创建数据库索引
4. 配置云存储目录

详细步骤请查看 [CLOUD_SETUP_GUIDE.md](./CLOUD_SETUP_GUIDE.md)。

## 常见问题

### Q：找不到「云开发」按钮？

**A**：
- 确保使用最新版微信开发者工具（>= 1.06.2309290）
- 个人小程序无法使用云开发，需要使用测试号或已认证的企业小程序

### Q：云函数目录没有云图标？

**A**：
- 检查 `project.config.json` 中的 `cloudfunctionRoot` 配置是否正确
- 重启微信开发者工具

### Q：如何确认环境 ID 是否正确？

**A**：
- 在「云开发」->「设置」->「环境设置」中查看
- 环境 ID 格式：`项目名-随机字符`（如：`dorm-management-8f7a6b`）

## 需要帮助？

如果以上方法都无法解决问题，请查看详细文档：
- [CLOUD_SETUP_GUIDE.md](./CLOUD_SETUP_GUIDE.md) - 完整的云开发配置指南
- [QUICK_FIX_CLOUD_ENV.md](./QUICK_FIX_CLOUD_ENV.md) - 更详细的故障排查指南
