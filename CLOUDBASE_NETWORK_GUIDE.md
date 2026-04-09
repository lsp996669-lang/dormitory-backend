# 使用腾讯云 CloudBase 让小程序联网

## 📌 重要说明

**你的项目已经在使用 CloudBase 了！**

微信小程序的 `wx.cloud` 就是腾讯云 CloudBase 的小程序版本。它们是同一个服务，只是在不同平台有不同的称呼：
- **微信小程序平台**：叫"微信云开发"
- **腾讯云平台**：叫"CloudBase（腾讯云开发）"

所以你不需要"迁移"，只需要正确配置 CloudBase 环境即可。

## 🔍 当前问题

检查你的代码，我发现以下问题：

1. **环境 ID 配置错误**：`src/app.tsx` 中配置的是示例 ID `cloud1-7g1234567890`，需要替换为真实的 CloudBase 环境 ID
2. **混合使用 HTTP API 和 CloudBase**：代码中既有 `Taro.cloud.init()` 又有 `Network.request()`

## ✅ 解决方案

### 步骤 1：获取 CloudBase 环境 ID

#### 方法 A：使用微信云开发（推荐，最快）

1. 打开微信开发者工具
2. 点击顶部「云开发」按钮
3. 如果未开通，点击「开通」
4. 创建环境后，点击「设置」->「环境设置」
5. 复制「环境 ID」（格式如：`cloud1-8g7f6e5d4c3b`）

#### 方法 B：使用腾讯云 CloudBase

1. 访问 [腾讯云 CloudBase 控制台](https://console.cloud.tencent.com/tcb)
2. 创建或选择一个环境
3. 在环境详情页找到「环境 ID」
4. 复制环境 ID

### 步骤 2：更新环境 ID 配置

打开 `src/app.tsx`，修改环境 ID：

```typescript
Taro.cloud.init({
  env: '你的真实环境ID', // 替换为你的 CloudBase 环境 ID
  traceUser: true,
});
```

**示例**：
```typescript
Taro.cloud.init({
  env: 'cloud1-8g7f6e5d4c3b', // 这是真实的 CloudBase 环境 ID
  traceUser: true,
});
```

### 步骤 3：同时更新 project.config.json

打开 `project.config.json`，添加或更新 `cloudbase` 配置：

```json
{
  "miniprogramRoot": "./dist-weapp",
  "projectname": "宿舍管理助手",
  "appid": "wxeb1d51afc9237cda",
  "cloudfunctionRoot": "./cloudfunctions/",
  "cloudbaseRoot": "./cloudfunctions/",
  "cloudbase": {
    "env": "你的真实环境ID"
  },
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
  }
}
```

### 步骤 4：部署云函数

如果你的云函数代码在 `cloudfunctions/` 目录下：

1. 在微信开发者工具中，右键点击 `cloudfunctions/checkin` 文件夹
2. 选择「上传并部署：云端安装依赖」
3. 等待上传完成
4. 重复以上步骤，上传所有云函数

云函数列表：
- `checkin` - 入住登记
- `checkout` - 搬离登记
- `getCheckinList` - 获取入住列表
- `getCheckoutList` - 获取搬离列表
- `exportData` - 导出数据
- `addBed` - 添加床位

### 步骤 5：创建数据库集合

在云开发控制台中：

1. 点击「数据库」
2. 点击「添加集合」
3. 创建以下集合：
   - `beds` - 床位表
   - `checkin_records` - 入住记录表
   - `checkout_records` - 搬离记录表

### 步骤 6：配置数据库权限

每个集合创建后，需要配置权限：

1. 点击集合名称（如 `beds`）
2. 点击「权限设置」
3. 选择「自定义」
4. 添加权限规则：

```json
{
  "read": true,
  "write": true
}
```

**注意**：生产环境中应该使用更严格的权限规则，但为了快速测试，可以先使用全读写权限。

### 步骤 7：测试 CloudBase 连接

创建一个测试页面，验证 CloudBase 是否正常工作：

#### 方法 A：使用云函数测试

在云开发控制台中：

1. 点击「云函数」
2. 选择任意云函数（如 `checkin`）
3. 点击「云端测试」
4. 输入测试参数：

```json
{
  "dormitory": "南四巷180号",
  "floor": "2",
  "room": "201",
  "position": "upper",
  "bed_number": "1",
  "person_name": "测试",
  "person_id": "110101199001011234",
  "phone": "13800138000",
  "checkin_time": "2024-04-09 12:00:00",
  "payment_type": "公司支付",
  "payment_amount": 500,
  "remark": "测试"
}
```

5. 点击「测试」，查看返回结果

#### 方法 B：在小程序中测试

在小程序的某个页面中添加测试代码：

```typescript
import Taro from '@tarojs/taro'

const testCloudBase = async () => {
  try {
    // 测试云函数调用
    const result = await Taro.cloud.callFunction({
      name: 'checkin',
      data: {
        dormitory: '南四巷180号',
        floor: '2',
        room: '201',
        position: 'upper',
        bed_number: '1',
        person_name: '测试',
        person_id: '110101199001011234',
        phone: '13800138000',
        checkin_time: '2024-04-09 12:00:00',
        payment_type: '公司支付',
        payment_amount: 500,
        remark: '测试'
      }
    })

    console.log('✅ 云函数调用成功:', result)
    Taro.showToast({
      title: 'CloudBase 连接成功',
      icon: 'success'
    })
  } catch (error) {
    console.error('❌ 云函数调用失败:', error)
    Taro.showToast({
      title: 'CloudBase 连接失败',
      icon: 'none'
    })
  }
}
```

## 🔧 CloudBase vs 传统 HTTP API

当前项目中混合使用了 CloudBase 和传统 HTTP API，建议统一使用 CloudBase：

### 当前问题

```typescript
// ❌ 混合使用，容易出问题
Network.request({
  url: '/api/export/stats',
  method: 'GET',
})
```

### 建议方案

#### 方案 A：纯 CloudBase（推荐）

所有操作都通过 CloudBase 云函数：

```typescript
// ✅ 使用 CloudBase 云函数
Taro.cloud.callFunction({
  name: 'getStats',
  data: {}
})
```

#### 方案 B：CloudBase + HTTP API（过渡期）

保留 HTTP API，但使用 CloudBase 作为后端：

1. 在 CloudBase 中创建 HTTP 触发的云函数
2. 通过 HTTP API 调用云函数
3. 逐步迁移到纯 CloudBase

## 📋 完整操作清单

按照以下顺序操作：

- [ ] 步骤 1：获取 CloudBase 环境 ID
- [ ] 步骤 2：更新 `src/app.tsx` 中的环境 ID
- [ ] 步骤 3：更新 `project.config.json` 中的环境 ID
- [ ] 步骤 4：部署所有云函数（6 个）
- [ ] 步骤 5：创建数据库集合（3 个）
- [ ] 步骤 6：配置数据库权限
- [ ] 步骤 7：测试 CloudBase 连接

## 🎯 验证成功的标志

配置成功后，你应该能看到：

- ✅ 小程序能够正常调用云函数
- ✅ 数据库能够正常读写
- ✅ 云存储能够正常上传/下载
- ✅ 控制台没有 "env not found" 或 "cloud function not found" 错误

## ❓ 常见问题

### Q1：提示 "env not found"

**原因**：环境 ID 配置错误

**解决**：
1. 检查 `src/app.tsx` 中的环境 ID 是否正确
2. 检查 `project.config.json` 中的环境 ID 是否正确
3. 确保环境已开通且未过期

### Q2：提示 "cloud function not found"

**原因**：云函数未部署或部署失败

**解决**：
1. 在微信开发者工具中检查云函数部署状态
2. 重新上传并部署云函数
3. 查看云函数日志，排查错误

### Q3：网络请求失败

**原因**：可能仍在使用旧的 HTTP API

**解决**：
1. 检查是否正确初始化 CloudBase
2. 确保云函数已部署
3. 使用 `Taro.cloud.callFunction()` 替代 `Network.request()`

### Q4：数据库操作失败

**原因**：数据库集合未创建或权限配置错误

**解决**：
1. 确保数据库集合已创建
2. 检查数据库权限配置
3. 查看云开发控制台的日志

## 📚 参考文档

- [微信云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)
- [腾讯云 CloudBase 文档](https://cloud.tencent.com/document/product/876)
- [CloudBase MCP 文档](https://skills.sh/tencentcloudbase/cloudbase-skills)

## 🚀 下一步

配置成功后，你可以：

1. 使用云函数处理业务逻辑
2. 使用云数据库存储数据
3. 使用云存储管理文件
4. 添加 AI 功能（使用 CloudBase AI）

需要我帮你修改代码或解决具体问题吗？
