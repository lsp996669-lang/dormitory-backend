# Vercel 部署指南（免费方案）

## 准备工作

### 1. 注册账号

- **GitHub**：https://github.com/signup（如果没有）
- **Vercel**：https://vercel.com/signup（可用 GitHub 登录）

---

## 第一步：推送代码到 GitHub

### 方式一：下载代码后上传

1. **下载后端代码**
   - 在 Coze 平台左侧文件目录
   - 找到 `server` 文件夹
   - 右键下载整个文件夹

2. **创建 GitHub 仓库**
   - 登录 GitHub
   - 点击右上角「+」→「New repository」
   - 名称：`dormitory-backend`
   - 设为 Private 或 Public
   - 点击「Create repository」

3. **上传代码**
   ```bash
   cd dormitory-backend
   git init
   git add .
   git commit -m "初始化后端代码"
   git branch -M main
   git remote add origin https://github.com/你的用户名/dormitory-backend.git
   git push -u origin main
   ```

---

## 第二步：在 Vercel 部署

### 1. 导入项目

1. 登录 Vercel：https://vercel.com
2. 点击「Add New」→「Project」
3. 选择「Import Git Repository」
4. 找到 `dormitory-backend` 仓库
5. 点击「Import」

### 2. 配置项目

**Root Directory 设置**：
- Framework Preset: `NestJS`（或 Other）
- Root Directory: `.`（默认，不需要改）

**环境变量配置**（重要！）：

点击「Environment Variables」添加：

```
COZE_SUPABASE_URL=https://br-pure-tody-80144a67.supabase2.aidap-global.cn-beijing.volces.com
```

```
COZE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyLXB1cmUtdG9keS04MDE0NGE2NyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzQyNDUzNTk2LCJleHAiOjIwNTgwMjk1OTZ9.ji36nz8lDSuSBWE-rU-_5S2VB0qP8qhrVabYpVEsCcs
```

```
INVITE_CODES=TEST2024,DORM2024,ADMIN2024
```

### 3. 点击 Deploy

等待部署完成（约 1-2 分钟）

---

## 第三步：获取域名

### 1. 查看部署域名

部署成功后，Vercel 会显示：
```
https://dormitory-backend-xxx.vercel.app
```

### 2. 测试域名

访问：
```
https://你的域名/api/health
```

应该返回：
```json
{"status":"success","data":"..."}
```

---

## 第四步：配置微信小程序域名

1. 登录微信公众平台：https://mp.weixin.qq.com
2. 开发管理 → 开发设置 → 服务器域名
3. 在「request 合法域名」添加：
   ```
   https://你的Vercel域名
   ```
   例如：`https://dormitory-backend.vercel.app`

---

## 第五步：重新构建小程序

告诉我 Vercel 域名后，我会帮您重新构建小程序。

或者您自己运行：
```bash
cd /workspace/projects
PROJECT_DOMAIN=https://你的Vercel域名 pnpm build:weapp
```

---

## 常见问题

### Q1: 部署失败？

检查 Vercel 部署日志，可能是环境变量配置错误。

### Q2: API 返回 500 错误？

检查 Vercel 函数日志，可能是数据库连接问题。

### Q3: 如何更新代码？

推送新代码到 GitHub，Vercel 会自动重新部署。

---

## 预估时间

- GitHub 创建仓库：5 分钟
- Vercel 部署：5 分钟
- 域名配置：5 分钟
- **总计：约 15 分钟**
