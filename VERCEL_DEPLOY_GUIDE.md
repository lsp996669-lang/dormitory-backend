# 📦 Vercel 部署详细步骤

## 🎯 部署目标

将原始后端 `github.com/lsp996669-lang/dormitory-backend` 部署到 Vercel

---

## 📋 前置要求

- 已安装 Node.js（推荐 v18+）
- 已安装 Git
- 已有 Vercel 账号（可免费注册）

---

## 🚀 详细部署步骤

### 步骤 1：克隆代码并安装依赖

#### 1.1 克隆仓库

```bash
# 克隆原始后端仓库
git clone https://github.com/lsp996669-lang/dormitory-backend.git

# 进入项目目录
cd dormitory-backend
```

#### 1.2 安装依赖

```bash
# 安装项目依赖
npm install

# 或使用 pnpm
pnpm install

# 或使用 yarn
yarn install
```

#### 1.3 检查项目结构

```bash
# 查看项目结构
ls -la

# 应该看到类似以下文件：
# package.json
# src/
# nest-cli.json
# tsconfig.json
# vercel.json (如果有的话)
```

---

### 步骤 2：准备 Vercel 配置

#### 2.1 创建 vercel.json

如果项目中没有 `vercel.json`，创建一个：

```bash
# 创建 vercel.json 文件
cat > vercel.json << 'EOF'
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/"
    }
  ]
}
EOF
```

#### 2.2 检查 package.json

确保 `package.json` 中有以下配置：

```json
{
  "name": "dormitory-backend",
  "version": "1.0.0",
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:prod": "node dist/main"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

---

### 步骤 3：安装 Vercel CLI

```bash
# 全局安装 Vercel CLI
npm install -g vercel

# 或使用 npx（无需全局安装）
npx vercel --version
```

---

### 步骤 4：登录 Vercel

```bash
# 登录 Vercel
vercel login

# 选择登录方式：
# - GitHub（推荐）
# - GitLab
# - Bitbucket
# - Email

# 按照提示完成登录
```

**登录流程**：
1. Vercel 会打开浏览器
2. 登录您的 Vercel 账号（或注册新账号）
3. 授权 CLI 访问权限
4. 返回终端，登录成功

---

### 步骤 5：部署到 Vercel

#### 5.1 初始化项目

```bash
# 在项目根目录运行
vercel

# 按照提示操作：
# 1. Set up and deploy? [Y/n] -> 输入 Y
# 2. Which scope? -> 选择您的账号
# 3. Link to existing project? [y/N] -> 输入 N
# 4. What's your project's name? -> 输入 dormitory-backend
# 5. In which directory is your code located? -> 按回车（使用当前目录）
# 6. Want to override the settings? [y/N] -> 输入 N
```

#### 5.2 等待部署

Vercel 会自动：
1. 检测项目类型（NestJS）
2. 安装依赖
3. 构建项目
4. 部署到 Vercel

**部署输出示例**：
```
Vercel CLI 28.4.8
? Set up and deploy? [Y/n] y
? Which scope? Your Name
? Link to existing project? [y/N] n
? What's your project's name? dormitory-backend
? In which directory is your code located? ./
? Want to override the settings? [y/N] n

🔍  Inspect: https://vercel.com/yourusername/dormitory-backend/abc123
🚀  Preview: https://dormitory-backend-abc123.vercel.app
✅  Production: https://dormitory-backend.vercel.app
```

#### 5.3 记录域名

部署成功后，Vercel 会提供两个域名：

1. **预览域名**（Preview URL）
   ```
   https://dormitory-backend-abc123.vercel.app
   ```

2. **生产域名**（Production URL）
   ```
   https://dormitory-backend.vercel.app
   ```

**记录您的生产域名，例如：`https://dormitory-backend.vercel.app`**

---

### 步骤 6：验证部署

#### 6.1 测试域名

```bash
# 测试域名是否可访问
curl https://dormitory-backend.vercel.app

# 或在浏览器中打开
# https://dormitory-backend.vercel.app
```

#### 6.2 测试 API 端点

```bash
# 测试健康检查接口（如果有的话）
curl https://dormitory-backend.vercel.app/api/health

# 测试入住登记接口
curl -X POST https://dormitory-backend.vercel.app/api/checkin \
  -H "Content-Type: application/json" \
  -d '{"name":"张三","phone":"13800138000"}'
```

---

### 步骤 7：配置小程序连接

#### 7.1 修改小程序网络配置

在小程序项目中，修改 `src/network.ts` 或相关配置文件：

**确保使用 Network 而不是 Cloud**：

```typescript
// ❌ 不要使用云开发
// import { Cloud } from '@/cloud'

// ✅ 使用 HTTP 请求
import { Network } from '@/network'
```

#### 7.2 配置后端地址

创建或修改环境变量文件（`.env` 或 `.env.local`）：

```env
# 后端服务器地址
API_BASE_URL=https://dormitory-backend.vercel.app

# 或使用环境变量
NEXT_PUBLIC_API_URL=https://dormitory-backend.vercel.app
```

#### 7.3 修改网络请求代码

确保所有 API 调用使用正确的路径：

**示例：入住登记**

```typescript
// 使用 Network 请求
const res = await Network.request({
  url: '/api/checkin',  // 注意：不要包含完整域名
  method: 'POST',
  data: {
    name: '张三',
    phone: '13800138000',
    location: '南四巷180号',
    floor: '2楼',
    bed: '1'
  }
})
```

**示例：获取入住列表**

```typescript
const res = await Network.request({
  url: '/api/checkin/list',
  method: 'GET',
  data: {
    location: '南四巷180号'
  }
})
```

---

### 步骤 8：配置小程序合法域名

#### 8.1 在微信公众平台配置

1. 登录：https://mp.weixin.qq.com
2. 进入小程序后台
3. 点击「开发」→「开发管理」→「开发设置」
4. 找到「服务器域名」
5. 在「request 合法域名」中添加：

```
https://dormitory-backend.vercel.app
```

**注意**：
- 必须使用 `https://` 协议
- 不要加端口号（Vercel 自动处理 HTTPS）
- 域名必须已在 Vercel 部署成功

#### 8.2 在开发者工具中配置

1. 打开微信开发者工具
2. 点击右上角「详情」
3. 点击「本地设置」
4. **取消勾选**「不校验合法域名」

---

### 步骤 9：测试小程序连接

#### 9.1 重新编译小程序

```bash
# 在小程序项目中
pnpm build:weapp

# 或在微信开发者工具中
# 按 Ctrl + B 重新编译
```

#### 9.2 测试功能

1. 在微信开发者工具中打开小程序
2. 进入「入住登记」页面
3. 填写信息并提交
4. 查看控制台日志

**成功日志示例**：
```javascript
[Network] 请求：POST /api/checkin
[Network] 响应：{ code: 200, msg: "入住成功", data: {...} }
```

---

## 🔍 验证清单

完成部署后，确认：

- [ ] 原始后端代码已克隆
- [ ] 依赖已安装
- [ ] Vercel CLI 已安装
- [ ] 已登录 Vercel 账号
- [ ] 后端已部署到 Vercel
- [ ] 已记录后端域名（如：`https://dormitory-backend.vercel.app`）
- [ ] 后端 API 测试通过
- [ ] 小程序已配置后端地址
- [ ] 小程序合法域名已配置
- [ ] 小程序功能测试通过

---

## 🆘 常见问题

### Q1：部署失败

**错误提示**：
```
Error: Build failed
```

**解决方法**：
1. 检查 `package.json` 中的 `build` 脚本
2. 确认 `start:prod` 脚本正确
3. 查看部署日志，定位具体错误

### Q2：域名无法访问

**错误提示**：
```
curl: (6) Could not resolve host
```

**解决方法**：
1. 确认 Vercel 部署成功
2. 检查域名拼写
3. 等待几分钟，DNS 可能需要时间

### Q3：小程序连接失败

**错误提示**：
```
request:fail url not in domain list
```

**解决方法**：
1. 确认已在微信公众平台配置合法域名
2. 确认使用 `https://` 协议
3. 重新编译小程序

### Q4：API 调用超时

**错误提示**：
```
request:fail timeout
```

**解决方法**：
1. 检查后端服务是否正常
2. 增加 API 超时时间
3. 优化后端性能

---

## 🎯 完成后

您的小程序已成功连接到原始的 NestJS 后端服务器！

### 可用的功能：

- ✅ 入住登记
- ✅ 搬离登记
- ✅ 查看入住列表
- ✅ 查看搬离列表
- ✅ 数据导出
- ✅ 床位管理

---

## 📚 参考资源

- [Vercel 官方文档](https://vercel.com/docs)
- [NestJS 部署到 Vercel](https://vercel.com/guides/deploying-nestjs-with-vercel)
- [微信小程序网络请求](https://developers.weixin.qq.com/miniprogram/dev/api/network/request/wx.request.html)

---

**部署成功后，告诉我您的域名，我帮您配置小程序连接！** 🚀
