# ⚡ 5 分钟快速配置指南

## 🎯 您的环境 ID

```
cloud1-9gxn7yw03252175a
```

---

## ✅ 已自动完成

- ✅ 环境 ID 已配置
- ✅ 代码已更新

---

## 🚀 接下来只需 3 步

### 步骤 1️⃣：上传云函数（3 分钟）

在微信开发者工具左侧，依次右键点击，选择「上传并部署：云端安装依赖」：

1. `cloudfunctions/checkin` ✓
2. `cloudfunctions/checkout` ✓
3. `cloudfunctions/getCheckinList` ✓
4. `cloudfunctions/getCheckoutList` ✓
5. `cloudfunctions/exportData` ✓
6. `cloudfunctions/addBed` ✓

等待全部显示绿色✓

---

### 步骤 2️⃣：创建数据库（2 分钟）

打开云开发控制台，创建 3 个集合：

1. `beds` - 权限：所有用户可读，仅创建者可写
2. `checkin_records` - 权限：所有用户可读，仅创建者可写
3. `checkout_records` - 权限：所有用户可读，仅创建者可写

---

### 步骤 3️⃣：测试（1 分钟）

在微信开发者工具中：

1. 点击「编译」
2. 进入「云开发测试页面」
3. 点击「测试入住登记」
4. ✅ 成功说明配置完成！

---

## 🎉 完成！

现在您的小程序可以正常使用了！

- ✅ 入住登记
- ✅ 搬离登记
- ✅ 查看列表
- ✅ 导出数据

---

**就这么简单！** 🚀
