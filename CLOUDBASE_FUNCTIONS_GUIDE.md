# CloudBase 云函数迁移总结

## 已创建的云函数（8个）

### 1. getStats
**功能**：获取统计数据
**用途**：心跳机制、导出统计
**返回数据**：
```json
{
  "code": 200,
  "msg": "获取统计数据成功",
  "data": {
    "totalCheckins": 100,
    "totalCheckouts": 50,
    "currentCheckins": 50,
    "totalBeds": 120,
    "emptyBeds": 70,
    "occupiedBeds": 50,
    "flaggedCount": 5
  }
}
```

### 2. getFloorStats
**功能**：获取南四巷楼层统计
**用途**：楼层页面统计数据
**返回数据**：
```json
{
  "code": 200,
  "msg": "获取楼层统计数据成功",
  "data": [
    {
      "floor": 2,
      "totalBeds": 40,
      "occupiedBeds": 20,
      "emptyBeds": 20,
      "maintenanceBeds": 0
    },
    {
      "floor": 3,
      "totalBeds": 40,
      "occupiedBeds": 15,
      "emptyBeds": 25,
      "maintenanceBeds": 0
    },
    {
      "floor": 4,
      "totalBeds": 40,
      "occupiedBeds": 15,
      "emptyBeds": 25,
      "maintenanceBeds": 0
    }
  ]
}
```

### 3. getNantwoFloorStats
**功能**：获取南二巷楼层统计
**用途**：楼层页面统计数据
**返回数据**：
```json
{
  "code": 200,
  "msg": "获取南二巷楼层统计数据成功",
  "data": [
    {
      "floor": 2,
      "totalBeds": 20,
      "occupiedBeds": 10,
      "emptyBeds": 10,
      "maintenanceBeds": 0
    }
  ]
}
```

### 4. getCheckinList
**功能**：获取入住人员列表
**用途**：入住列表、搜索
**返回数据**：
```json
{
  "code": 200,
  "msg": "获取入住人员列表成功",
  "data": [
    {
      "id": "xxx",
      "check_in_id": "xxx",
      "bed_id": "xxx",
      "name": "张三",
      "id_card": "110101199001011234",
      "phone": "13800138000",
      "checkin_time": "2024-04-09 12:00:00",
      "floor": 2,
      "bed_number": 1,
      "position": "upper",
      "dormitory": "nansi",
      "room": "201",
      "station_name": "exhibition",
      "is_flagged": false,
      "payment_type": "公司支付",
      "payment_amount": 500,
      "remark": ""
    }
  ]
}
```

### 5. getFlaggedPeople
**功能**：获取红名人员列表
**用途**：红名人员管理
**返回数据**：
```json
{
  "code": 200,
  "msg": "获取红名人员列表成功",
  "data": [...]
}
```

### 6. getNotificationCount
**功能**：获取通知数量
**用途**：通知提示
**返回数据**：
```json
{
  "code": 200,
  "msg": "获取通知数量成功",
  "data": {
    "count": 5
  }
}
```

### 7. getAllBeds
**功能**：获取所有床位
**用途**：床位互换、转移
**返回数据**：
```json
{
  "code": 200,
  "msg": "获取所有床位成功",
  "data": {
    "nansiBeds": [...],
    "nantwoBeds": [...]
  }
}
```

## 需要创建的云函数（剩余7个）

### 8. toggleFlag
**功能**：切换红名标记
**参数**：`{ checkInId: string }`
**实现**：更新 `checkin_records` 中的 `is_flagged` 字段

### 9. toggleStation
**功能**：切换站点标注
**参数**：`{ checkInId: string, stationName: string }`
**实现**：更新 `checkin_records` 中的 `station_name` 字段

### 10. transferBed
**功能**：转移床位
**参数**：`{ checkInId: string, targetBedId: string }`
**实现**：
1. 更新原床位状态为 empty
2. 更新新床位状态为 occupied
3. 更新入住记录的 bed_id

### 11. updateCheckinDate
**功能**：修改入住日期
**参数**：`{ checkInId: string, checkInDate: string }`
**实现**：更新 `checkin_records` 中的 `checkin_time` 字段

### 12. updateCheckoutDates
**功能**：修改搬离日期
**参数**：`{ checkOutId: string, checkInDate?: string, checkOutDate?: string }`
**实现**：更新 `checkout_records` 中的日期字段

### 13. batchDeleteCheckout
**功能**：批量删除搬离记录
**参数**：`{ ids: string[] }`
**实现**：批量删除 `checkout_records` 中的记录

### 14. getTransferableBeds
**功能**：获取可转移床位
**参数**：`{ bedId: string }`
**实现**：获取所有空床位
**返回数据**：
```json
{
  "code": 200,
  "msg": "获取可转移床位成功",
  "data": {
    "currentBed": {...},
    "transferableBeds": [...]
  }
}
```

## 云函数配置文件

每个云函数目录需要包含：
1. `index.js` - 云函数入口
2. `package.json` - 依赖配置
3. `config.json` - 云函数配置

### package.json
```json
{
  "name": "云函数名称",
  "version": "1.0.0",
  "description": "云函数描述",
  "main": "index.js",
  "dependencies": {
    "wx-server-sdk": "~2.6.3"
  }
}
```

### config.json
```json
{
  "permissions": {
    "openapi": []
  }
}
```

## 部署步骤

1. 在微信开发者工具中，右键点击云函数文件夹
2. 选择「上传并部署：云端安装依赖」
3. 等待上传完成
4. 重复以上步骤，部署所有云函数

## 测试云函数

在微信开发者工具中：
1. 点击「云开发」->「云函数」
2. 选择云函数
3. 点击「云端测试」
4. 输入测试参数
5. 点击「测试」

## 注意事项

1. **环境 ID**：确保所有云函数使用相同的环境 ID
2. **数据库集合**：确保已创建 `beds`、`checkin_records`、`checkout_records` 集合
3. **权限配置**：确保数据库权限正确配置
4. **错误处理**：所有云函数都应该包含错误处理
5. **日志记录**：使用 `console.log` 记录关键操作

## 前端调用示例

```typescript
import { Cloud } from '@/cloud'

// 调用云函数
const result = await Cloud.callFunction('getStats', {})

if (result.result?.code === 200) {
  console.log('统计数据:', result.result.data)
} else {
  console.error('获取失败:', result.result?.msg)
}
```
