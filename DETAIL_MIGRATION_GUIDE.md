# detail/index.tsx 云函数迁移指南

## 当前状态

`detail/index.tsx` 中还有 11 处 Network.request 调用需要迁移到云函数。

## 需要创建的云函数

### 1. `getTransferableBeds` - 获取可转移床位
**API**: `/api/beds/transferable/${bedId}`
**用途**: 获取当前入住人员可以转移到的床位列表

**输入参数**:
```javascript
{
  bedId: number  // 当前床位 ID
}
```

**输出数据**:
```javascript
{
  code: 200,
  msg: '获取成功',
  data: {
    dormitory: 'nansi' | 'nantwo',
    currentBed: { id, floor, bedNumber, position, room },
    transferableBeds: [
      { id, floor, bed_number, position, room }
    ]
  }
}
```

---

### 2. `transferCheckin` - 转移床位
**API**: `POST /api/checkin/transfer`
**用途**: 将入住人员转移到新床位

**输入参数**:
```javascript
{
  checkInId: number,   // 入住记录 ID
  targetBedId: number  // 目标床位 ID
}
```

**操作**:
1. 更新 `checkin_records` 表中的 `bed_id` 字段
2. 更新原床位的 `status` 为 `empty`
3. 更新新床位的 `status` 为 `occupied`

---

### 3. `updateCheckinDate` - 修改入住日期
**API**: `POST /api/checkin/update-date`
**用途**: 修改入住记录的入住日期

**输入参数**:
```javascript
{
  checkInId: number,
  checkInDate: string  // 格式: 'YYYY-MM-DD'
}
```

**操作**:
- 更新 `checkin_records` 表中的 `checkin_time` 字段

---

### 4. `updateCheckoutCheckinDate` - 修改搬离记录的入住日期
**API**: `POST /api/checkout/update-checkin-date`
**用途**: 修改搬离记录的入住日期

**输入参数**:
```javascript
{
  checkOutId: number,
  checkInDate: string
}
```

---

### 5. `updateCheckoutDate` - 修改搬离记录的搬离日期
**API**: `POST /api/checkout/update-checkout-date`
**用途**: 修改搬离记录的搬离日期

**输入参数**:
```javascript
{
  checkOutId: number,
  checkOutDate: string
}
```

---

### 6. `toggleStation` - 切换站点标注
**API**: `POST /api/checkin/toggle-station`
**用途**: 设置或取消入住人员的站点标注

**输入参数**:
```javascript
{
  checkInId: number,
  stationName: string | null  // 'exhibition' | 'wuyue' | 'rider' | null
}
```

**操作**:
- 更新 `checkin_records` 表中的 `station` 和 `is_rider` 字段

---

### 7. `toggleFlag` - 切换红名标记
**API**: `POST /api/checkin/toggle-flag`
**用途**: 标记或取消标记红名人员

**输入参数**:
```javascript
{
  checkInId: number
}
```

**操作**:
- 更新 `checkin_records` 表中的 `is_flagged` 字段

---

### 8. `swapBeds` - 床位互换
**API**: `POST /api/beds/swap`
**用途**: 互换两个人的床位

**输入参数**:
```javascript
{
  checkInId: number,   // 当前人员的入住记录 ID
  targetBedId: number  // 目标床位 ID
}
```

**操作**:
1. 找到目标床位的入住人员
2. 交换两个人的 `bed_id`
3. 保持其他信息不变

---

### 9. `deleteCheckout` - 删除搬离记录
**API**: `DELETE /api/checkout/${checkOutId}`
**用途**: 删除搬离记录

**输入参数**:
```javascript
{
  checkOutId: number
}
```

---

## 已存在的云函数

- ✅ `getAllBeds` - 获取所有床位
- ✅ `checkout` - 搬离登记（但不支持删除）
- ✅ `getCheckinList` - 获取入住列表

---

## 快速开始

### 方案 1：快速创建所有云函数（推荐）

在微信开发者工具中：

1. 右键点击 `cloudfunctions` 目录
2. 选择「新建 Node.js 云函数」
3. 输入云函数名称（如 `getTransferableBeds`）
4. 复制对应的代码到 `index.js`
5. 右键点击云函数目录 → 「上传并部署：云端安装依赖」

### 方案 2：使用测试数据

如果暂时不需要这些功能，可以先使用占位符云函数：

```javascript
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  return {
    code: 500,
    msg: '功能开发中，请稍后使用',
    data: null
  }
}
```

---

## detail/index.tsx 修改示例

### 修改前:
```typescript
const res = await Network.request({
  url: '/api/beds/all'
})
if (res.data?.code === 200) {
  // ...
}
```

### 修改后:
```typescript
const res = await Cloud.callFunction('getAllBeds', {})
if (res.result?.code === 200) {
  // ...
}
```

---

## 下一步

1. 创建所有缺失的云函数
2. 修改 `detail/index.tsx` 中的 Network.request 调用
3. 测试所有功能是否正常

## 注意事项

- 云函数名称必须与调用名称一致
- 数据格式需要与前端调用保持一致
- 错误处理需要统一
- 建议在云函数中添加详细的日志
