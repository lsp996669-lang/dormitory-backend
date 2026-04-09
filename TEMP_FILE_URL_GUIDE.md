# 临时下载链接功能使用指南

## 📋 功能说明

临时下载链接功能可以帮助您**获取云存储文件的临时访问链接**，用于：
- 分享导出的 Excel 文件
- 下载历史导出的文件
- 在外部应用中访问云存储文件

## 🚀 使用方法

### 方法 1: 使用小程序界面

1. **进入临时下载链接页面**
   ```bash
   Taro.navigateTo({ url: '/pages/temp-file-url/index' })
   ```

2. **输入文件 ID**
   - 在输入框中输入云存储文件的 ID
   - 文件 ID 格式: `cloud://xxx.xxx.xxx/exports/xxx.xlsx`

3. **获取临时链接**
   - 点击"获取临时链接"按钮
   - 系统会返回一个临时下载链接
   - 链接有效期为 2 小时

4. **使用链接**
   - 复制链接分享给他人
   - 直接点击"下载文件"按钮下载

### 方法 2: 使用代码调用

```typescript
import { Cloud } from '@/cloud'

// 获取临时链接
const res = await Cloud.callFunction('getTempFileURL', {
  fileIDs: ['cloud://xxx.xxx.xxx/exports/xxx.xlsx']
})

if (res.result?.code === 200) {
  const tempFileURL = res.result.data[0].tempFileURL
  console.log('临时链接:', tempFileURL)
}
```

## 🎯 快速测试

小程序提供了一个**快速测试**功能，可以：
1. 自动导出最新的数据
2. 获取导出文件的临时链接
3. 直接下载或复制链接

点击页面上的「导出并获取链接」按钮即可。

## 📱 使用场景

### 场景 1: 分享导出的 Excel 文件

```typescript
// 1. 导出数据
const exportRes = await Cloud.callFunction('exportData', {})
const fileID = exportRes.result.data.fileID

// 2. 获取临时链接
const tempRes = await Cloud.callFunction('getTempFileURL', {
  fileIDs: [fileID]
})

// 3. 复制链接分享
Taro.setClipboardData({
  data: tempRes.result.data[0].tempFileURL
})
```

### 场景 2: 下载历史文件

```typescript
// 如果您有历史的 fileID，可以随时获取临时链接下载
const tempRes = await Cloud.callFunction('getTempFileURL', {
  fileIDs: ['your-history-file-id']
})

// 下载文件
Taro.downloadFile({
  url: tempRes.result.data[0].tempFileURL
})
```

## ⚠️ 注意事项

1. **链接有效期**
   - 临时链接有效期为 **2 小时**
   - 超期后需要重新获取

2. **文件大小限制**
   - 单个文件最大 10GB
   - 建议导出的 Excel 文件控制在 10MB 以内

3. **安全提示**
   - 临时链接可以被任何人访问
   - 建议仅用于内部数据分享
   - 不要分享敏感数据

4. **网络环境**
   - 需要网络连接才能访问
   - 建议在稳定的网络环境下使用

## 🔧 云函数说明

### getTempFileURL 云函数

**功能**: 获取云存储文件的临时下载链接

**输入参数**:
```javascript
{
  fileIDs: string[]  // 文件 ID 数组
}
```

**返回数据**:
```javascript
{
  code: 200,
  msg: '获取成功',
  data: [
    {
      fileID: 'cloud://xxx.xxx.xxx/exports/xxx.xlsx',
      tempFileURL: 'https://xxx.tcb.qcloud.la/xxx.xlsx?...',
      maxAge: 7200,  // 有效期（秒），默认 2 小时
      status: 0  // 0: 成功，其他: 失败
    }
  ]
}
```

## 📚 相关文档

- [云存储 - 获取临时链接](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/reference-sdk-api/storage/Cloud.getTempFileURL.html)
- [云函数开发指南](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/functions.html)

## 💡 常见问题

### Q: 为什么链接失效了？
A: 临时链接有效期为 2 小时，超期后需要重新获取。

### Q: 可以上传文件吗？
A: 此功能仅用于获取下载链接，如需上传请使用云存储的 `uploadFile` API。

### Q: 可以批量获取链接吗？
A: 可以，传入多个 fileID 即可一次性获取多个文件的临时链接。

### Q: 链接可以在浏览器中打开吗？
A: 可以，临时链接是标准的 HTTP/HTTPS 链接，可以在浏览器中直接访问。

---

**提示**: 临时下载链接功能已集成到小程序中，您可以直接使用！
