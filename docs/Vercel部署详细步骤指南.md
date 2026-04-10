# Vercel 部署详细步骤指南

## 前置条件

✅ GitHub 仓库已准备完成
✅ 代码已推送到：`https://github.com/lsp996669-lang/dormitory-backend`
✅ vercel.json 配置已更新

---

## 第一步：在 Vercel 导入项目

### 1. 访问 Vercel

打开浏览器，访问：[https://vercel.com](https://vercel.com)

### 2. 登录或注册账号

- **推荐使用 GitHub 账号登录**
- 这样可以直接导入 GitHub 仓库，无需手动配置

### 3. 导入项目

1. 点击页面上的「Add New...」按钮
2. 选择「Project」
3. 在「Import Git Repository」中，找到并选择 `dormitory-backend` 仓库
4. 点击「Import」按钮

---

## 第二步：配置项目参数

Vercel 会自动检测项目配置，但我们需要手动确认以下参数：

### Framework Preset
选择：**Other**

### Root Directory
填写：`server`

**重要**：这个设置确保 Vercel 从 `server` 子目录读取代码

### Build Command
填写：`npm run build`

### Output Directory
填写：`dist`

### Install Command
填写：`npm install`

### Node.js Version
选择：**20.x** 或最新版本

---

## 第三步：配置环境变量（关键步骤）

在「Environment Variables」部分，添加以下环境变量：

### 1. DATABASE_URL
```
postgresql://postgres:你的密码@db.你的项目.supabase.co/postgres
```

**如何获取：**
1. 访问 [https://supabase.com](https://supabase.com)
2. 登录你的 Supabase 项目
3. 进入「Settings」→「Database」
4. 找到「Connection String」→ 选择「PostgreSQL」
5. 复制连接字符串
6. 替换 `[YOUR-PASSWORD]` 为你的数据库密码

### 2. SUPABASE_URL
```
https://你的项目.supabase.co
```

**如何获取：**
1. 在 Supabase 项目页面
2. 进入「Settings」→「API」
3. 复制「Project URL」的值

### 3. SUPABASE_ANON_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...（你的 anon public key）
```

**如何获取：**
1. 在 Supabase 项目页面
2. 进入「Settings」→「API」
3. 复制「anon public」的值

**环境变量配置示例：**

| Name | Value | Environment |
|------|-------|-------------|
| DATABASE_URL | postgresql://postgres:xxx@db.xxx.supabase.co/postgres | Production, Preview, Development |
| SUPABASE_URL | https://xxx.supabase.co | Production, Preview, Development |
| SUPABASE_ANON_KEY | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... | Production, Preview, Development |

**注意**：将 Environment 全部勾选（Production, Preview, Development）

---

## 第四步：部署项目

1. 检查所有配置是否正确
2. 点击「Deploy」按钮
3. 等待部署完成（约 2-3 分钟）

部署过程中，Vercel 会：
1. 安装依赖包（`npm install`）
2. 编译代码（`npm run build`）
3. 启动服务

---

## 第五步：获取后端域名

部署成功后，Vercel 会显示：

```
Congratulations! Your Project is Ready!

Your production URL is:
https://dormitory-backend-xxx.vercel.app
```

**复制这个域名**，这就是你的新后端地址。

例如：`https://dormitory-backend-abc123.vercel.app`

---

## 第六步：测试后端服务

在浏览器或命令行中测试：

### 测试 1：健康检查
```bash
curl https://你的新域名/api
```

应该返回：`404`（这是正常的，因为我们没有 `/` 路由）

### 测试 2：测试 API
```bash
curl https://你的新域名/api/floor-stats
```

应该返回：
```json
{
  "code": 200,
  "msg": "success",
  "data": {...}
}
```

**如果返回 500 错误**：
- 检查环境变量是否配置正确
- 查看部署日志（点击 Vercel 部署记录）

---

## 第七步：配置微信小程序

### 1. 重新构建小程序

在沙箱环境中执行：

```bash
cd /workspace/projects
PROJECT_DOMAIN=https://你的新后端域名 pnpm build:weapp
```

**把你的新后端域名替换到上面的命令中**

例如：
```bash
PROJECT_DOMAIN=https://dormitory-backend-abc123.vercel.app pnpm build:weapp
```

### 2. 配置微信小程序后台

1. 登录微信小程序后台：[https://mp.weixin.qq.com](https://mp.weixin.qq.com)
2. 进入「开发」→「开发管理」→「开发设置」
3. 找到「服务器域名」区域
4. 在 **request 合法域名** 中添加你的新域名：
   ```
   https://你的新后端域名
   ```
5. 点击保存

**注意：**
- 必须以 `https://` 开头
- 不要带端口号
- 不要带 `/` 后缀

### 3. 等待生效

微信域名配置生效时间：5-15 分钟

---

## 第八步：最终验证

### 1. 清除缓存
在微信开发者工具中：
- 点击「清除缓存」→「清除全部缓存」

### 2. 重新预览
- 点击「预览」
- 扫码在真机上测试

### 3. 测试功能
- 楼层信息是否正常加载
- 入住登记是否成功
- 红名标记是否生效

---

## 常见问题

### Q1: 部署失败，显示 "Build failed"

**可能原因**：
- Build Command 错误
- Node.js 版本不兼容
- 依赖包安装失败

**解决方法**：
1. 检查 Root Directory 是否为 `server`
2. Build Command 是否为 `npm run build`
3. 查看 Vercel 部署日志，找到具体错误

### Q2: 部署成功，但 API 返回 500 错误

**可能原因**：
- 环境变量配置错误
- 数据库连接失败

**解决方法**：
1. 检查 DATABASE_URL 是否正确
2. 检查 SUPABASE_URL 和 SUPABASE_ANON_KEY 是否正确
3. 查看 Vercel 函数日志

### Q3: 微信小程序还是无法连接网络

**可能原因**：
- 微信小程序后台域名未配置
- 域名配置未生效

**解决方法**：
1. 确认微信小程序后台已添加域名
2. 等待 15 分钟让配置生效
3. 清除小程序缓存后重试

### Q4: 如何查看 Vercel 日志？

1. 登录 Vercel
2. 进入你的项目
3. 点击「Deployments」
4. 点击最新的部署记录
5. 查看「Build Log」和「Function Logs」

---

## 完成检查清单

- [ ] GitHub 仓库代码已推送
- [ ] Vercel 项目已导入
- [ ] Root Directory 设置为 `server`
- [ ] Build Command 设置为 `npm run build`
- [ ] 环境变量已配置（DATABASE_URL、SUPABASE_URL、SUPABASE_ANON_KEY）
- [ ] 部署成功，获取到新域名
- [ ] 测试后端 API 正常响应
- [ ] 小程序已重新构建
- [ ] 微信小程序后台已配置新域名
- [ ] 真机测试成功

---

## 获取帮助

如果遇到问题，请提供：
1. Vercel 部署日志截图
2. 错误信息或日志
3. 当前配置截图

---

## 预估时间

- Vercel 配置：5 分钟
- 环境变量配置：3 分钟
- 部署等待：2-3 分钟
- 微信小程序配置：5 分钟
- 测试验证：2 分钟

**总计：约 15-20 分钟**
