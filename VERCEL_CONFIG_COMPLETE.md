# ✅ Vercel 后端配置完成

## 🎯 已完成的配置

### 后端地址
```
https://server-tan-nu-43.vercel.app
```

### 环境配置文件
- ✅ `.env.local` - 已配置
- ✅ `.env.production` - 已配置
- ✅ 小程序编译成功

---

## 🚀 接下来需要做的事情

### 步骤 1：配置小程序合法域名（重要！）

**在微信公众平台配置**：

1. 登录：https://mp.weixin.qq.com
2. 进入小程序后台
3. 点击「开发」→「开发管理」→「开发设置」
4. 找到「服务器域名」
5. 在「request 合法域名」中添加：
   ```
   https://server-tan-nu-43.vercel.app
   ```

6. 点击「保存」

**注意**：
- 必须使用 `https://` 协议
- 不要加端口号
- 确认域名拼写正确

---

### 步骤 2：在微信开发者工具中配置

1. 打开微信开发者工具
2. 点击右上角「详情」
3. 点击「本地设置」
4. **取消勾选**「不校验合法域名」

**原因**：
- 开发时可以不校验
- 真机预览必须配置合法域名

---

### 步骤 3：测试后端连接

#### 测试 1：在浏览器中测试

打开浏览器，访问：
```
https://server-tan-nu-43.vercel.app
```

应该能看到后端服务运行正常。

#### 测试 2：测试 API 接口

```bash
# 测试健康检查接口（如果有的话）
curl https://server-tan-nu-43.vercel.app/api/health

# 测试入住登记接口
curl -X POST https://server-tan-nu-43.vercel.app/api/checkin \
  -H "Content-Type: application/json" \
  -d '{"name":"张三","phone":"13800138000","location":"南四巷180号","floor":"2楼","bed":"1"}'
```

---

### 步骤 4：测试小程序连接

1. 在微信开发者工具中，点击「编译」（或按 `Ctrl + B`）
2. 进入小程序
3. 尝试使用「入住登记」功能
4. 查看控制台日志

**成功日志示例**：
```
[Network] 请求：POST /api/checkin
[Network] 完整 URL：https://server-tan-nu-43.vercel.app/api/checkin
[Network] 响应：{ code: 200, msg: "入住成功", data: {...} }
```

---

### 步骤 5：真机测试

1. 点击「预览」按钮
2. 扫码在真机上测试
3. 尝试使用功能
4. 确认能正常连接网络

---

## 🔍 验证清单

完成以上步骤后，确认：

- [ ] 合法域名已配置：`https://server-tan-nu-43.vercel.app`
- [ ] 后端 API 在浏览器中可访问
- [ ] 微信开发者工具中已取消「不校验合法域名」
- [ ] 小程序在模拟器中功能正常
- [ ] 小程序在真机上功能正常

---

## 🆘 常见问题

### Q1：小程序提示"request:fail url not in domain list"

**原因**：合法域名未配置

**解决方法**：
1. 确认已在微信公众平台配置合法域名
2. 确认使用 `https://` 协议
3. 确认域名拼写正确

### Q2：小程序提示"request:fail timeout"

**原因**：网络问题或后端响应慢

**解决方法**：
1. 检查后端是否正常运行
2. 检查网络连接
3. 增加请求超时时间

### Q3：后端 API 返回 404

**原因**：API 路径错误

**解决方法**：
1. 确认 API 路径正确
2. 检查后端路由配置
3. 查看后端日志

---

## 📱 快速测试命令

### 在微信开发者工具控制台中测试

```javascript
// 测试网络请求
Taro.request({
  url: '/api/health',
  method: 'GET',
  success: res => console.log('✅ 请求成功', res),
  fail: err => console.error('❌ 请求失败', err)
})
```

### 使用 curl 测试

```bash
# 测试后端是否正常运行
curl https://server-tan-nu-43.vercel.app

# 测试 API 接口
curl -X POST https://server-tan-nu-43.vercel.app/api/checkin \
  -H "Content-Type: application/json" \
  -d '{"name":"测试","phone":"13800138000"}'
```

---

## 🎉 完成后

一旦完成所有配置，您的小程序将成功连接到 Vercel 后端！

### 可用的功能：

- ✅ 入住登记
- ✅ 搬离登记
- ✅ 查看入住列表
- ✅ 查看搬离列表
- ✅ 数据导出
- ✅ 床位管理

---

## 📚 参考资源

- [Vercel 控制台](https://vercel.com/dashboard)
- [微信小程序网络请求](https://developers.weixin.qq.com/miniprogram/dev/api/network/request/wx.request.html)
- [微信小程序服务器域名配置](https://developers.weixin.qq.com/miniprogram/dev/framework/server-ability/domain.html)

---

## 🚀 开始配置

**现在请按照上述 5 个步骤操作，10 分钟即可完成配置！**

如果遇到问题，随时告诉我具体的错误信息！
