# 🔄 恢复到最初的 NestJS 后端服务器

## 📋 目标

恢复到 GitHub 上的最初后端：`github.com/lsp996669-lang/dormitory-backend`

---

## 🚀 恢复步骤

### 步骤 1：获取原始后端代码

#### 方法 1：克隆 GitHub 仓库

在您的本地电脑或服务器上执行：

```bash
# 克隆原始后端仓库
git clone https://github.com/lsp996669-lang/dormitory-backend.git
cd dormitory-backend
```

#### 方法 2：下载 ZIP 文件

1. 访问：https://github.com/lsp996669-lang/dormitory-backend
2. 点击绿色的「Code」按钮
3. 选择「Download ZIP」
4. 下载并解压

---

### 步骤 2：部署后端服务器

#### 选项 A：部署到 Vercel（推荐，简单）

1. **安装 Vercel CLI**

```bash
npm install -g vercel
```

2. **登录 Vercel**

```bash
vercel login
```

3. **部署到 Vercel**

```bash
cd dormitory-backend
vercel
```

4. **记录域名**

部署完成后，Vercel 会给一个域名，例如：
```
https://dormitory-backend-xxx.vercel.app
```

#### 选项 B：部署到自己的服务器

1. **安装依赖**

```bash
cd dormitory-backend
npm install
```

2. **配置环境变量**

创建 `.env` 文件：
```env
PORT=3000
NODE_ENV=production
```

3. **构建项目**

```bash
npm run build
```

4. **启动服务**

```bash
npm run start:prod
```

或使用 PM2：
```bash
npm install -g pm2
pm2 start npm --name "dormitory-backend" -- start:prod
```

#### 选项 C：使用 Docker 部署

1. **构建 Docker 镜像**

```bash
docker build -t dormitory-backend .
```

2. **运行容器**

```bash
docker run -p 3000:3000 dormitory-backend
```

---

### 步骤 3：修改小程序配置以连接到原始后端

#### 修改网络请求配置

在小程序项目中，修改 `src/network.ts` 或相关配置文件：

**当前配置（使用云开发）**：
```typescript
// 云开发模式
import { Cloud } from '@/cloud'
```

**恢复为原始配置（使用 HTTP 请求）**：
```typescript
// HTTP 模式
import { Network } from '@/network'
```

#### 修改环境变量

如果使用环境变量配置后端地址，修改 `.env` 或 `.env.local`：

```env
# 后端服务器地址
API_BASE_URL=https://your-backend-domain.com

# 或使用 Vercel 域名
API_BASE_URL=https://dormitory-backend-xxx.vercel.app
```

#### 修改网络请求代码

确保所有网络请求使用 `Network.request` 而不是 `Cloud.callFunction`：

**修改前（云开发）**：
```typescript
const res = await Cloud.callFunction('checkin', { name, phone })
```

**修改后（HTTP）**：
```typescript
const res = await Network.request({
  url: '/api/checkin',
  method: 'POST',
  data: { name, phone }
})
```

---

### 步骤 4：配置小程序合法域名

#### 在微信公众平台配置

1. 登录：https://mp.weixin.qq.com
2. 进入小程序后台
3. 点击「开发」→「开发管理」→「开发设置」
4. 找到「服务器域名」
5. 在「request 合法域名」中添加您的后端域名

**示例**：
```
https://your-backend-domain.com
或
https://dormitory-backend-xxx.vercel.app
```

#### 在开发者工具中配置

1. 打开微信开发者工具
2. 点击右上角「详情」
3. 点击「本地设置」
4. **取消勾选**「不校验合法域名」

---

### 步骤 5：测试连接

#### 测试后端 API

```bash
# 测试后端是否正常
curl https://your-backend-domain.com/api/health

# 或测试特定接口
curl -X POST https://your-backend-domain.com/api/checkin \
  -H "Content-Type: application/json" \
  -d '{"name":"张三","phone":"13800138000"}'
```

#### 测试小程序连接

1. 编译小程序（`Ctrl + B`）
2. 进入小程序
3. 尝试使用功能（如入住登记）
4. 查看控制台日志

---

## 🔍 验证清单

完成恢复后，确认：

- [ ] 原始后端代码已下载
- [ ] 后端服务已部署（Vercel 或自己的服务器）
- [ ] 小程序已配置后端域名
- [ ] 合法域名已配置
- [ ] 后端 API 测试通过
- [ ] 小程序功能测试通过

---

## 🆘 常见问题

### Q1：小程序提示"request:fail"

**原因**：合法域名未配置或域名配置错误

**解决方法**：
1. 确认域名已在微信公众平台配置
2. 确认使用 `https://` 协议
3. 确认域名没有拼写错误

### Q2：后端部署后无法访问

**原因**：部署失败或网络问题

**解决方法**：
1. 检查 Vercel 部署日志
2. 检查服务器状态
3. 测试域名是否可访问

### Q3：小程序连接后端超时

**原因**：网络问题或后端响应慢

**解决方法**：
1. 检查网络连接
2. 优化后端性能
3. 增加 API 超时时间

---

## 📱 完整示例

### 使用 Vercel 部署

```bash
# 1. 克隆代码
git clone https://github.com/lsp996669-lang/dormitory-backend.git
cd dormitory-backend

# 2. 登录 Vercel
vercel login

# 3. 部署
vercel

# 4. 记录域名，例如：
# https://dormitory-backend-abc123.vercel.app
```

### 配置小程序

```typescript
// 在小程序中配置后端地址
const API_BASE_URL = 'https://dormitory-backend-abc123.vercel.app'

// 使用 Network 请求
const res = await Network.request({
  url: `${API_BASE_URL}/api/checkin`,
  method: 'POST',
  data: { name, phone }
})
```

---

## 🎯 推荐方案

**最简单的恢复方案**：

1. **部署到 Vercel**
   - 快速、免费、自动 HTTPS
   - 适合开发和小型项目

2. **使用 GitHub 自动部署**
   - 推送到 GitHub 自动部署
   - 无需手动操作

---

**现在您想要使用哪种部署方式？告诉我会给您具体的操作步骤！** 🚀
