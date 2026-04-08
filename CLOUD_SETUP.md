# 微信云开发设置指南

## 概述

本项目已迁移到微信云开发，使用云函数和云数据库替代原有的 NestJS 后端。

## 已完成的云函数

### 1. checkin（入住登记）
- **功能**：处理宿舍入住登记
- **输入**：name, phone, location, floor, bed/room, station, note
- **输出**：入住记录ID

### 2. checkout（搬离登记）
- **功能**：处理宿舍搬离登记
- **输入**：recordId, note
- **输出**：成功/失败状态

### 3. getCheckinList（获取入住列表）
- **功能**：获取所有未搬离的入住记录
- **输入**：location（可选）
- **输出**：入住记录列表

### 4. getCheckoutList（获取搬离列表）
- **功能**：获取所有搬离记录
- **输入**：location（可选）
- **输出**：搬离记录列表

### 5. exportData（导出数据）
- **功能**：导出入住和搬离数据为 Excel 文件
- **输入**：无
- **输出**：Excel 文件的 fileID

### 6. addBed（添加床位）
- **功能**：为指定房间添加床位（自动创建上下铺）
- **输入**：dormitory（宿舍名称）, floor（楼层）, room（房号）, bedNumber（床位编号）
- **输出**：添加成功的床位信息
- **示例**：
  ```javascript
  {
    dormitory: 'nantwo',
    floor: 2,
    room: '201',
    bedNumber: 3
  }
  ```

## 云数据库集合

### beds（床位集合）
```javascript
{
  _id: string,
  dormitory: string,      // 宿舍名称（nansi=南四巷180号, nantwo=南二巷24号）
  floor: string,          // 楼层（如：'2'）
  room: string,           // 房号（如：'201'，南四巷无房号则为空）
  bed_number: string,     // 床位编号（如：'3'）
  position: string,       // 位置（upper=上铺, lower=下铺）
  status: string,         // 状态（empty=空闲, occupied=已入住, maintenance=维修中）
  created_at: Date,
  updated_at: Date
}
```

### checkin_records（入住记录集合）
```javascript
{
  _id: string,
  name: string,           // 姓名
  phone: string,          // 手机号
  location: string,       // 位置（南四巷180号/南二巷24号）
  floor: string,          // 楼层
  room: string,           // 房号（可选）
  bed: string,            // 床铺号（可选）
  station: string,        // 站点标注
  note: string,           // 备注
  checkin_time: Date,     // 入住时间
  checkout_time: Date,    // 搬离时间（未搬离时为 null）
  created_at: Date,
  updated_at: Date
}
```

### checkout_records（搬离记录集合）
```javascript
{
  _id: string,
  name: string,
  phone: string,
  location: string,
  floor: string,
  room: string,
  bed: string,
  station: string,
  note: string,
  checkin_time: Date,
  checkout_time: Date,
  checkout_note: string,  // 搬离备注
  created_at: Date,
  updated_at: Date
}
```

## 设置步骤

### 1. 开通云开发

1. 打开微信开发者工具
2. 打开本项目
3. 点击顶部菜单「云开发」→「开通」
4. 选择「按量付费」（免费版）或「包年包月」
5. 创建环境，记录环境 ID

### 2. 初始化云开发

在微信开发者工具中：

1. 右键点击 `cloudfunctions` 目录
2. 选择「当前环境」→选择刚创建的环境

### 3. 上传云函数

1. 右键点击每个云函数目录（checkin, checkout, getCheckinList, getCheckoutList, exportData, addBed）
2. 选择「上传并部署：云端安装依赖（不上传 node_modules）」
3. 等待所有云函数上传完成

### 4. 创建数据库集合

1. 打开云开发控制台
2. 进入「数据库」
3. 创建以下集合：
   - `checkin_records`（入住记录）
   - `checkout_records`（搬离记录）
   - `beds`（床位信息）
4. 为每个集合设置权限（建议选择「所有用户可读，仅创建者可写」）

### 5. 配置云存储

1. 打开云开发控制台
2. 进入「存储」
3. 创建 `exports` 目录（用于存放导出的 Excel 文件）
4. 设置存储权限（建议选择「所有用户可读，仅创建者可写」）

### 6. 测试云函数

1. 在微信开发者工具中编译项目
2. 访问测试页面：`pages/test-cloud/index`
3. 测试各个云函数是否正常工作
4. 检查云数据库中是否正确创建了记录

## 使用说明

### 前端调用云函数

```typescript
import { Cloud } from '@/cloud'

// 调用入住登记云函数
const res = await Cloud.callFunction('checkin', {
  name: '张三',
  phone: '13800138000',
  location: '南四巷180号',
  floor: '2楼',
  bed: '1',
  station: '会展中心站',
  note: '备注信息'
})

if (res.result?.code === 200) {
  console.log('入住成功', res.result.data)
} else {
  console.error('入住失败', res.result?.msg)
}
```

### 云函数返回格式

```javascript
{
  code: 200,           // 状态码：200 成功，400 请求错误，500 服务器错误
  msg: '成功',          // 消息
  data: {              // 返回数据
    id: 'xxx'
  }
}
```

## 添加床位指南

### 方法一：使用 addBed 云函数（推荐）

1. 上传 `addBed` 云函数：
   ```bash
   # 在微信开发者工具中
   # 右键点击 cloudfunctions/addBed 目录
   # 选择「上传并部署：云端安装依赖」
   ```

2. 调用云函数添加床位：
   ```typescript
   import { Cloud } from '@/cloud'

   // 为南二巷24号宿舍 2楼 201房 添加3号床位
   const res = await Cloud.callFunction('addBed', {
     dormitory: 'nantwo',
     floor: 2,
     room: '201',
     bedNumber: 3
   })

   if (res.result?.code === 200) {
     console.log('添加成功', res.result.msg)
     // 输出：成功添加床位：201房3号床（上下铺）
   } else {
     console.error('添加失败', res.result?.msg)
   }
   ```

3. 测试添加床位：
   - 访问测试页面：`pages/test-cloud/index`
   - 在"添加床位测试"部分输入床位编号
   - 点击"添加床位"按钮
   - 检查云数据库的 `beds` 集合是否新增了两条记录（上铺和下铺）

### 方法二：手动在云开发控制台添加

1. 打开云开发控制台
2. 进入「数据库」→「beds」集合
3. 点击「添加记录」
4. 添加上铺记录：
   ```javascript
   {
     "dormitory": "nantwo",
     "floor": "2",
     "room": "201",
     "bed_number": "3",
     "position": "upper",
     "status": "empty",
     "created_at": "2024-01-01T00:00:00.000Z",
     "updated_at": "2024-01-01T00:00:00.000Z"
   }
   ```
5. 添加下铺记录：
   ```javascript
   {
     "dormitory": "nantwo",
     "floor": "2",
     "room": "201",
     "bed_number": "3",
     "position": "lower",
     "status": "empty",
     "created_at": "2024-01-01T00:00:00.000Z",
     "updated_at": "2024-01-01T00:00:00.000Z"
   }
   ```

### 床位数据说明

**dormitory（宿舍名称）**：
- `nansi` - 南四巷180号
- `nantwo` - 南二巷24号

**floor（楼层）**：
- `1` - 1楼
- `2` - 2楼
- `3` - 3楼
- `4` - 4楼

**position（位置）**：
- `upper` - 上铺
- `lower` - 下铺

**status（状态）**：
- `empty` - 空闲
- `occupied` - 已入住
- `maintenance` - 维修中

## 常见问题

### 1. 云函数调用失败

**错误提示**：`cloud.callFunction:fail`

**解决方案**：
- 确认已开通云开发
- 确认云函数已上传
- 确认选择了正确的云环境

### 2. 数据库操作失败

**错误提示**：`Permission denied`

**解决方案**：
- 检查数据库集合权限设置
- 建议设置为「所有用户可读，仅创建者可写」

### 3. 文件导出失败

**错误提示**：`uploadFile:fail`

**解决方案**：
- 检查云存储权限设置
- 确认 exports 目录存在

## 注意事项

1. **环境切换**：开发环境和生产环境使用不同的环境 ID
2. **费用控制**：云开发按量付费，注意监控使用量
3. **数据备份**：定期备份云数据库数据
4. **权限管理**：合理设置数据库和存储的访问权限

## 后续优化建议

1. **性能优化**：对于频繁访问的数据，可以使用云缓存
2. **安全加固**：添加用户认证和权限控制
3. **日志监控**：配置云函数日志和监控告警
4. **自动化测试**：为云函数编写单元测试

## 技术支持

如有问题，请联系技术支持或查阅微信官方文档：
- [云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)
- [云函数文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/functions.html)
