# 🚀 小程序自动部署快速入门

只需 5 分钟，即可配置完成小程序的自动部署！

---

## 📖 快速开始（3步完成）

### 步骤 1️⃣：获取密钥（2分钟）

1. 打开微信开发者工具
2. 点击右上角「设置」
3. 进入「开发管理」→「开发设置」
4. 找到「小程序代码上传」
5. 点击「生成」并下载私钥文件
6. 将私钥文件保存为 `private.key`，放在项目根目录

### 步骤 2️⃣：配置环境变量（1分钟）

复制配置文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 必填项
MINIPROGRAM_APPID=wxeb1d51afc9237cda
MINIPROGRAM_PRIVATE_KEY_PATH=./private.key

# 可选项（有默认值，可留空）
MINIPROGRAM_ROBOT_VERSION=1
MINIPROGRAM_VERSION=1.0.0
MINIPROGRAM_DESC=我的第一个自动部署
```

### 步骤 3️⃣：一键部署（1分钟）

**上传预览版：**

```bash
pnpm deploy:preview
```

**上传体验版：**

```bash
pnpm deploy:review
```

**上传正式版：**

```bash
pnpm deploy:production
```

---

## ✅ 完成！

看到这个提示，说明部署成功了：

```
==================================================
🎉 部署完成！
==================================================
```

---

## 🔧 进阶配置

### 配置 GitHub Actions 自动部署

#### 1. 在 GitHub 仓库配置密钥

进入仓库设置：
- `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

添加以下密钥：

| 密钥名称 | 值 |
|---------|---|
| `MINIPROGRAM_APPID` | `wxeb1d51afc9237cda` |
| `MINIPROGRAM_PRIVATE_KEY` | 打开 `private.key` 文件，复制全部内容粘贴 |
| `MINIPROGRAM_ROBOT_VERSION` | `1` |

#### 2. 推送代码自动部署

将代码推送到 `main` 分支，自动触发部署：

```bash
git add .
git commit -m "feat: 新功能"
git push origin main
```

#### 3. 手动触发部署

在 GitHub 仓库：
1. 进入「Actions」标签页
2. 选择「Deploy WeChat Mini Program」
3. 点击「Run workflow」
4. 选择部署类型（preview / review / production）
5. 点击「Run workflow」

---

## 🎯 常用命令

```bash
# 上传预览版
pnpm deploy:preview

# 上传体验版
pnpm deploy:review

# 上传正式版
pnpm deploy:production

# 或使用 Node.js 直接调用
node deploy.js preview
node deploy.js review
node deploy.js production
```

---

## ⚠️ 安全提醒

**重要**：
- ❌ 不要将 `private.key` 上传到 Git 仓库
- ✅ 将 `private.key` 添加到 `.gitignore`
- ✅ 在 GitHub Actions 中使用 Secrets 存储私钥

在 `.gitignore` 中添加：

```gitignore
# 私钥文件
private.key
.env
```

---

## 📚 需要更多帮助？

查看完整文档：[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

---

**就这么简单，开始使用吧！🎉**
