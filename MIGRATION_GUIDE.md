# 完整迁移到 CloudBase 指南

## 📋 迁移进度

### ✅ 已完成的工作

1. **创建了 8 个核心云函数**：
   - `getStats` - 获取统计数据
   - `getFloorStats` - 获取南四巷楼层统计
   - `getNantwoFloorStats` - 获取南二巷楼层统计
   - `getCheckinList` - 获取入住人员列表
   - `getFlaggedPeople` - 获取红名人员列表
   - `getNotificationCount` - 获取通知数量
   - `getAllBeds` - 获取所有床位
   - `addBed` - 添加床位（已存在）
   - `checkin` - 入住登记（已存在）
   - `checkout` - 搬离登记（已存在）
   - `getCheckoutList` - 获取搬离列表（已存在）
   - `exportData` - 导出数据（已存在）

2. **修改了 `app.tsx`**：
   - 移除了废弃的心跳机制
   - 移除了对 `Network` 的依赖
   - 保留了 CloudBase 初始化代码

### 🔄 需要用户完成的工作

#### 1. 部署云函数到 CloudBase

在微信开发者工具中：

1. 确保已开通 CloudBase 环境
2. 获取 CloudBase 环境 ID
3. 更新 `src/app.tsx` 中的环境 ID：

```typescript
Taro.cloud.init({
  env: '你的真实环境ID', // ✅ 替换为你的 CloudBase 环境 ID
  traceUser: true,
});
```

4. 逐个上传云函数：
   - 右键点击 `cloudfunctions/getStats`
   - 选择「上传并部署：云端安装依赖」
   - 重复以上步骤，上传所有云函数

#### 2. 创建剩余的云函数（可选）

根据需要，可以创建以下云函数：

- `toggleFlag` - 切换红名标记
- `toggleStation` - 切换站点标注
- `transferBed` - 转移床位
- `updateCheckinDate` - 修改入住日期
- `updateCheckoutDates` - 修改搬离日期
- `batchDeleteCheckout` - 批量删除搬离记录
- `getTransferableBeds` - 获取可转移床位

#### 3. 修改前端页面代码

将所有页面中的 `Network.request` 替换为 `Cloud.callFunction`。

**示例**：

**原代码**：
```typescript
const res = await Network.request({
  url: '/api/checkout/list'
})
```

**新代码**：
```typescript
import { Cloud } from '@/cloud'

const res = await Cloud.callFunction('getCheckoutList', {})

if (res.result?.code === 200) {
  const data = res.result.data
  // 处理数据
}
```

#### 4. 需要修改的页面清单

| 页面 | 需要修改的 API | 优先级 |
|------|---------------|--------|
| `floor/index.tsx` | `/api/export/stats`, `/api/floors/stats`, `/api/floors/nantwo/floor-stats`, `/api/checkin/list`, `/api/checkin/flagged`, `/api/notification/count` | 🔴 高 |
| `checkout/index.tsx` | `/api/checkout/list`, `/api/checkout/batch-delete` | 🔴 高 |
| `detail/index.tsx` | `/api/beds/all`, `/api/beds/transferable/${bedId}`, `/api/checkin/transfer`, `/api/checkin/update-date`, `/api/checkout/update-checkin-date`, `/api/checkout/update-checkout-date`, `/api/checkin/toggle-station`, `/api/checkin/toggle-flag` | 🟡 中 |
| `qrcode/index.tsx` | `/api/export/stats` | 🟡 中 |
| `import/index.tsx` | `/api/import/url` | 🟢 低 |
| `login/index.tsx` | `/api/auth/login` | 🟢 低 |

#### 5. 更新配置文件

**删除或注释**：
```bash
# 删除或重命名
rm .env.local
# 或
mv .env.local .env.local.backup
```

**修改 `config/index.ts`**（可选）：
可以移除 `PROJECT_DOMAIN` 的注入，但保留也不会影响运行。

## 📝 修改示例

### 示例 1：修改 floor/index.tsx

**原代码**：
```typescript
const loadFloorStats = async () => {
  setLoading(true)
  try {
    const res = await Network.request({
      url: '/api/floors/stats'
    })

    if (res.statusCode === 200) {
      setFloorStats(res.data.data)
    }
  } catch (error) {
    console.error('[Floor] 加载楼层统计失败:', error)
  } finally {
    setLoading(false)
  }
}
```

**新代码**：
```typescript
import { Cloud } from '@/cloud'

const loadFloorStats = async () => {
  setLoading(true)
  try {
    const res = await Cloud.callFunction('getFloorStats', {})

    if (res.result?.code === 200) {
      setFloorStats(res.result.data)
    } else {
      console.error('[Floor] 获取楼层统计失败:', res.result?.msg)
    }
  } catch (error) {
    console.error('[Floor] 加载楼层统计失败:', error)
  } finally {
    setLoading(false)
  }
}
```

### 示例 2：修改 checkout/index.tsx

**原代码**：
```typescript
const loadRecords = async () => {
  setLoading(true)
  try {
    const res = await Network.request({
      url: '/api/checkout/list'
    })

    if (res.data?.code === 200 && res.data?.data) {
      setRecords(res.data.data)
    }
  } catch (error) {
    console.error('[CheckOut] 加载搬离记录失败:', error)
  } finally {
    setLoading(false)
  }
}
```

**新代码**：
```typescript
import { Cloud } from '@/cloud'

const loadRecords = async () => {
  setLoading(true)
  try {
    const res = await Cloud.callFunction('getCheckoutList', {})

    if (res.result?.code === 200 && res.result?.data) {
      setRecords(res.result.data)
    }
  } catch (error) {
    console.error('[CheckOut] 加载搬离记录失败:', error)
  } finally {
    setLoading(false)
  }
}
```

## 🎯 迁移完成后的验证

### 1. 检查云函数部署

在微信开发者工具中：
1. 点击「云开发」->「云函数」
2. 确认所有云函数都已部署
3. 确认云函数状态为「正常」

### 2. 测试云函数调用

在云函数控制台中：
1. 选择 `getStats` 云函数
2. 点击「云端测试」
3. 点击「测试」
4. 确认返回正确的数据

### 3. 测试小程序功能

1. 重新编译小程序
2. 测试楼层页面
3. 测试入住/搬离功能
4. 测试其他功能

### 4. 检查错误日志

在云开发控制台中：
1. 点击「云开发」->「云函数」
2. 查看云函数日志
3. 检查是否有错误信息

## ⚠️ 注意事项

1. **环境 ID**：确保 `src/app.tsx` 中的环境 ID 正确
2. **数据库权限**：确保数据库集合已创建且权限正确
3. **云函数部署**：确保所有云函数都已成功部署
4. **错误处理**：所有页面都应该包含错误处理
5. **数据格式**：注意云函数返回的数据格式可能与原 API 不同

## 🚀 快速开始

如果你只需要快速验证 CloudBase 是否工作，可以：

1. **只修改 floor/index.tsx**
2. **只修改 checkout/index.tsx**
3. **暂时保留其他页面的 Network.request**

这样可以快速验证 CloudBase 是否工作，然后再逐步迁移其他页面。

## 📞 需要帮助？

如果遇到问题，请检查：

1. CloudBase 环境是否已开通
2. 环境 ID 是否正确
3. 云函数是否已部署
4. 数据库集合是否已创建
5. 数据库权限是否正确

## 🎉 完成标志

迁移完成标志：

- ✅ 所有云函数已部署
- ✅ 所有页面已修改为使用 CloudBase
- ✅ 小程序功能正常
- ✅ 控制台没有错误
- ✅ 心跳机制已移除
- ✅ 废弃的 API 调用已删除
