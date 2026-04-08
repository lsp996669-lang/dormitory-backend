# 🚀 小程序自动化配置脚本

## 📋 一键配置清单

您的云开发环境 ID：`cloud1-9gxn7yw03252175a`

---

## ✅ 已完成的配置

- ✅ 环境 ID 已配置到 `src/app.tsx`
- ✅ 项目配置文件已更新
- ✅ 云开发初始化代码已添加

---

## 🔄 自动化配置步骤

### 步骤 1：同步代码到本地（1 分钟）

**方法 A：在微信开发者工具中**

1. 打开微信开发者工具
2. 如果已经打开，按 `Ctrl + B` 重新编译
3. 确保 `src/app.tsx` 中的环境 ID 已更新为 `cloud1-9gxn7yw03252175a`

**方法 B：重新导入项目**

1. 关闭当前项目
2. 点击「+」导入项目
3. 选择 `/workspace/projects/` 目录
4. 点击「导入」

---

### 步骤 2：批量上传云函数（3 分钟）

**一键上传所有云函数**：

在微信开发者工具左侧文件树中，依次右键点击以下文件夹，选择「上传并部署：云端安装依赖」：

```
☐ cloudfunctions/checkin
☐ cloudfunctions/checkout
☐ cloudfunctions/getCheckinList
☐ cloudfunctions/getCheckoutList
☐ cloudfunctions/exportData
☐ cloudfunctions/addBed
```

**上传顺序建议**：
1. `checkin` （核心功能）
2. `checkout` （核心功能）
3. `getCheckinList` （查询功能）
4. `getCheckoutList` （查询功能）
5. `exportData` （导出功能）
6. `addBed` （扩展功能）

**等待每个云函数上传完成后再上传下一个**，看到绿色✓标记表示成功。

---

### 步骤 3：批量创建数据库集合（2 分钟）

**一键创建所有数据库集合**：

打开云开发控制台（https://console.cloud.tencent.com/tcb），选择您的环境，然后：

**集合 1：beds**
1. 点击「数据库」
2. 点击「添加集合」
3. 集合名称：`beds`
4. 权限设置：选择「所有用户可读，仅创建者可写」
5. 点击「确定」

**集合 2：checkin_records**
1. 点击「添加集合」
2. 集合名称：`checkin_records`
3. 权限设置：选择「所有用户可读，仅创建者可写」
4. 点击「确定」

**集合 3：checkout_records**
1. 点击「添加集合」
2. 集合名称：`checkout_records`
3. 权限设置：选择「所有用户可读，仅创建者可写」
4. 点击「确定」

---

### 步骤 4：初始化床位数据（1 分钟）

**自动初始化床位数据**：

在云开发控制台的「数据库」中：

1. 选择 `beds` 集合
2. 点击「添加记录」
3. 添加以下 3 条记录：

**记录 1（南四巷180号 2楼）**：
```json
{
  "location": "南四巷180号",
  "floor": "2楼",
  "beds": ["1", "2", "3", "4"]
}
```

**记录 2（南四巷180号 3楼）**：
```json
{
  "location": "南四巷180号",
  "floor": "3楼",
  "beds": ["1", "2", "3", "4"]
}
```

**记录 3（南四巷180号 4楼）**：
```json
{
  "location": "南四巷180号",
  "floor": "4楼",
  "beds": ["1", "2", "3", "4"]
}
```

---

### 步骤 5：功能测试（2 分钟）

**自动测试所有功能**：

在微信开发者工具中：

1. 点击「编译」按钮
2. 进入「云开发测试页面」（pages/test-cloud/index）

**测试 1：入住登记**
- 填写姓名和手机号
- 点击「测试入住登记」
- ✅ 看到「入住成功」提示

**测试 2：获取入住列表**
- 点击「测试获取入住列表」
- ✅ 看到刚才添加的记录

**测试 3：导出数据**
- 点击「测试导出数据」
- ✅ 看到「导出成功」提示

---

## ✅ 验证清单

完成以上所有步骤后，请确认：

- [ ] 环境 ID 已配置为 `cloud1-9gxn7yw03252175a`
- [ ] 6 个云函数已上传成功
- [ ] 3 个数据库集合已创建
- [ ] 床位数据已初始化（至少 3 条记录）
- [ ] 入住登记功能测试通过
- [ ] 获取列表功能测试通过
- [ ] 导出数据功能测试通过

---

## 🎯 完成后的操作

### 验证云函数上传成功

1. 点击「云开发」按钮
2. 点击「云函数」
3. 应该能看到 6 个云函数：
   - ✅ checkin
   - ✅ checkout
   - ✅ getCheckinList
   - ✅ getCheckoutList
   - ✅ exportData
   - ✅ addBed

### 验证数据库集合已创建

1. 点击「云开发」按钮
2. 点击「数据库」
3. 应该能看到 3 个集合：
   - ✅ beds
   - ✅ checkin_records
   - ✅ checkout_records

### 验证床位数据已初始化

1. 点击 `beds` 集合
2. 查看记录数量
3. 应该至少有 3 条记录（2楼、3楼、4楼）

---

## 🆘 常见问题

### Q1：云函数上传失败

**原因**：云开发环境未开通或环境 ID 错误

**解决方法**：
1. 确认云开发已开通
2. 确认环境 ID 为 `cloud1-9gxn7yw03252175a`
3. 重新编译项目
4. 重新上传云函数

### Q2：数据库集合创建失败

**原因**：集合名称错误或权限设置错误

**解决方法**：
1. 确认集合名称拼写正确（区分大小写）
2. 确认权限设置为「所有用户可读，仅创建者可写」
3. 重新创建集合

### Q3：功能测试失败

**原因**：云函数未上传成功或数据库未初始化

**解决方法**：
1. 检查云函数是否全部上传成功
2. 检查数据库集合是否已创建
3. 检查床位数据是否已初始化
4. 重新编译项目

### Q4：提示"云开发未初始化"

**原因**：环境 ID 未配置或配置错误

**解决方法**：
1. 确认 `src/app.tsx` 中的环境 ID 为 `cloud1-9gxn7yw03252175a`
2. 重新编译项目
3. 重新测试

---

## 📱 快速测试命令

在微信开发者工具控制台中输入：

```javascript
// 测试云开发是否初始化
console.log('环境 ID:', wx.cloud.getWXContext().ENV);

// 测试云函数调用
wx.cloud.callFunction({
  name: 'getCheckinList',
  data: { location: '南四巷180号' },
  success: res => console.log('✅ 云函数调用成功', res),
  fail: err => console.error('❌ 云函数调用失败', err)
});
```

---

## 🎉 完成后

一旦完成所有步骤，您的小程序应该可以正常使用了！

### 可用的功能：

- ✅ 入住登记
- ✅ 搬离登记
- ✅ 查看入住列表
- ✅ 查看搬离列表
- ✅ 导出数据
- ✅ 添加床位

---

## 📚 参考文档

- [微信云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)
- [云函数文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/functions.html)
- [数据库文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/database.html)

---

**祝配置顺利！** 🚀

如果遇到问题，随时告诉我！
