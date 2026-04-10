# Vercel 部署失败排查指南

## 当前状态

- ✅ 本地构建成功
- ✅ 代码已推送到 GitHub
- ✅ vercel.json 已更新并推送
- ⏳ Vercel 正在自动部署（或需要手动触发）

---

## 部署失败的可能原因及解决方法

### 原因 1：Root Directory 配置错误 ⚠️ 最常见

**问题：**
- Root Directory 没有设置为 `server`
- Vercel 在根目录查找代码，但实际代码在 `server` 子目录

**解决方法：**
1. 登录 Vercel：https://vercel.com
2. 进入你的项目（`server` 或 `dormitory-backend`）
3. 点击 **"Settings"** 标签
4. 找到 **"General"** → **"Root Directory"**
5. 修改为：`server`
6. 点击 **"Save"**
7. 返回 **"Deployments"** 标签，点击 **"Redeploy"**

---

### 原因 2：环境变量缺失

**问题：**
- 缺少 DATABASE_URL、SUPABASE_URL、SUPABASE_ANON_KEY 环境变量
- 导致数据库连接失败

**解决方法：**
1. 在 Vercel 项目页面
2. 点击 **"Settings"** 标签
3. 找到 **"Environment Variables"**
4. 添加以下环境变量：

| Name | Value |
|------|-------|
| DATABASE_URL | 从 Supabase 获取的连接字符串 |
| SUPABASE_URL | 从 Supabase 获取的项目 URL |
| SUPABASE_ANON_KEY | 从 Supabase 获取的 anon key |

5. 每个 Environment 都勾选：Production, Preview, Development
6. 保存后，返回 **"Deployments"**，点击 **"Redeploy"**

**如何获取 Supabase 配置：**
1. 访问 https://supabase.com
2. 登录你的项目
3. **Settings** → **Database** → 复制 Connection String (PostgreSQL)
4. **Settings** → **API** → 复制 Project URL 和 anon public key

---

### 原因 3：依赖安装失败

**问题：**
- package.json 中的依赖无法安装
- 网络问题或依赖版本冲突

**检查方法：**
1. 在 Vercel 部署页面
2. 点击失败的部署记录
3. 查看 **"Build Log"**
4. 找到 `npm ERR` 或类似的错误信息

**解决方法：**
- 如果是版本冲突，更新依赖版本
- 如果是网络问题，等待几分钟后重新部署

---

### 原因 4：构建命令错误

**问题：**
- Vercel 没有正确识别构建命令
- 需要手动指定

**解决方法：**
1. 在 Vercel 项目页面
2. 点击 **"Settings"** 标签
3. 找到 **"General"**
4. 检查 **"Build Command"** 是否为：`npm run build`
5. 如果不对，修改为：`npm run build`
6. 检查 **"Output Directory"** 是否为：`dist`
7. 保存后，重新部署

---

## 🔍 如何查看详细错误日志

### 方法 1：在 Vercel 网页查看

1. 登录 Vercel：https://vercel.com
2. 进入你的项目
3. 点击 **"Deployments"** 标签
4. 点击失败的部署记录（红色 ❌）
5. 滚动查看 **"Build Log"**
6. 找到错误信息（通常以 `Error:` 开头）

### 方法 2：运行 Vercel CLI 命令

如果你已经在本地登录了 Vercel：

```bash
cd /workspace/projects/server
npx vercel inspect dpl_6cizWMzKrE2ezR8atHwNh9XxjxJU --logs
```

---

## 🚀 快速修复步骤

### 步骤 1：修改 Root Directory（最重要！）

1. 进入 Vercel 项目设置
2. 找到 **Root Directory**
3. 修改为：`server`
4. 保存

### 步骤 2：添加环境变量

1. 在 Settings → Environment Variables
2. 添加 3 个环境变量（DATABASE_URL、SUPABASE_URL、SUPABASE_ANON_KEY）
3. 从 Supabase 获取这些值
4. 勾选所有 Environment（Production, Preview, Development）

### 步骤 3：重新部署

1. 返回 **"Deployments"** 标签
2. 点击最新部署记录右侧的 **"···"**（三个点）
3. 选择 **"Redeploy"**
4. 等待部署完成（2-3 分钟）

---

## ✅ 部署成功的标志

如果部署成功，你会看到：

1. **部署记录显示绿色对勾 ✅**
2. **状态显示：Ready**
3. **显示你的后端域名**，例如：
   ```
   https://server-xxx.vercel.app
   ```

---

## 🎯 下一步

部署成功后：

1. **复制后端域名**（例如：`https://server-xxx.vercel.app`）

2. **告诉我这个域名**，我会帮你：
   - 重新构建小程序，配置新域名
   - 验证后端服务是否正常
   - 指导配置微信小程序后台

---

## 💡 常见部署错误信息及解决

| 错误信息 | 原因 | 解决方法 |
|---------|------|---------|
| `File not found` | Root Directory 错误 | 修改为 `server` |
| `DATABASE_URL is not defined` | 环境变量缺失 | 添加 DATABASE_URL |
| `Connection refused` | 数据库连接失败 | 检查 DATABASE_URL 是否正确 |
| `Cannot find module` | 依赖安装失败 | 检查 package.json，更新依赖 |
| `Build failed` | 构建命令错误 | 检查 Build Command 是否为 `npm run build` |

---

## 📞 需要帮助？

如果按照以上步骤仍然无法解决：

1. **查看 Build Log**
   - 在 Vercel 部署页面查看详细日志
   - 找到具体的错误信息

2. **告诉我错误信息**
   - 把 Build Log 中的错误信息复制给我
   - 我会帮你分析并解决

3. **截图帮助**
   - 如果方便，可以截图 Vercel 部署页面
   - 这样我能更准确地定位问题

---

## 📋 检查清单

部署前确认：

- [ ] Root Directory 已设置为 `server`
- [ ] Build Command 为 `npm run build`
- [ ] Output Directory 为 `dist`
- [ ] 已添加 DATABASE_URL 环境变量
- [ ] 已添加 SUPABASE_URL 环境变量
- [ ] 已添加 SUPABASE_ANON_KEY 环境变量
- [ ] 所有环境变量都勾选了 Production, Preview, Development

---

**修改配置后，等待 Vercel 自动部署，或手动点击 Redeploy。部署成功后，把域名告诉我！** 🚀
