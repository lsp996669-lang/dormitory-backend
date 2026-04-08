# 微信小程序自动部署指南

本指南将帮助您设置小程序的 CI/CD 自动部署流程，实现代码提交后自动上传到微信平台。

---

## 📋 目录

- [功能特性](#功能特性)
- [准备工作](#准备工作)
- [本地部署](#本地部署)
- [GitHub Actions 自动部署](#github-actions-自动部署)
- [常见问题](#常见问题)

---

## ✨ 功能特性

### 支持的部署方式

1. **预览版部署** (`deploy:preview`)
   - 快速上传预览版
   - 生成预览二维码
   - 适合开发测试

2. **体验版部署** (`deploy:review`)
   - 上传体验版
   - 可分享给测试人员
   - 适合内部测试

3. **正式版部署** (`deploy:production`)
   - 上传正式版
   - 可选自动提交审核
   - 适合发布上线

### 自动化能力

- ✅ 本地一键部署
- ✅ GitHub Actions CI/CD
- ✅ 版本号自动管理
- ✅ 部署日志实时查看
- ✅ 支持多机器人并发上传

---

## 🛠️ 准备工作

### 步骤 1：获取小程序 AppID

1. 登录 [微信公众平台](https://mp.weixin.qq.com)
2. 进入小程序后台
3. 找到您的 AppID（如：`wxeb1d51afc9237cda`）

### 步骤 2：获取上传密钥

1. 打开 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 登录您的微信账号
3. 点击右上角「设置」
4. 进入「开发管理」→「开发设置」
5. 找到「小程序代码上传」区域
6. 点击「生成」按钮
7. 下载私钥文件（保存为 `private.key`）

**⚠️ 重要提示**：
- 私钥文件只能下载一次，请妥善保管
- 不要将私钥文件上传到公开仓库
- 建议将私钥存放在环境变量或密钥管理服务中

### 步骤 3：配置环境变量

创建 `.env` 文件：

```bash
# 复制示例文件
cp .env.example .env
```

编辑 `.env` 文件，填写实际值：

```env
# 小程序 AppID
MINIPROGRAM_APPID=wxeb1d51afc9237cda

# 私钥文件路径
MINIPROGRAM_PRIVATE_KEY_PATH=./private.key

# 机器人版本号（可选）
MINIPROGRAM_ROBOT_VERSION=1

# 小程序版本号（可选，不填则自动生成）
MINIPROGRAM_VERSION=1.0.0

# 版本描述（可选）
MINIPROGRAM_DESC=自动部署版本

# 是否自动提交审核（可选）
AUTO_SUBMIT_AUDIT=false
```

### 步骤 4：放置私钥文件

将下载的 `private.key` 文件放在项目根目录。

**⚠️ 安全提示**：
- 将 `private.key` 添加到 `.gitignore`
- 不要提交私钥文件到 Git 仓库

在 `.gitignore` 中添加：

```gitignore
# 私钥文件
private.key
.env
```

---

## 💻 本地部署

### 方法 1：使用 npm scripts

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
pnpm deploy:upload
# 或
pnpm deploy:production
```

### 方法 2：直接使用 Node.js

```bash
node deploy.js preview      # 预览版
node deploy.js review       # 体验版
node deploy.js production   # 正式版
```

### 部署流程

1. **编译项目**：自动执行 `pnpm build:weapp`
2. **上传代码**：使用 miniprogram-ci 上传到微信平台
3. **生成二维码**（体验版）：生成预览二维码
4. **提交审核**（可选）：正式版可自动提交审核

### 部署输出示例

```
==================================================
🎯 微信小程序自动部署
==================================================
部署类型：preview
版本号：1.0.0
AppID：wxeb1d51afc9237cda
==================================================
🚀 开始上传预览版...
正在上传...
✅ 预览版上传成功！
预览信息： { dev: '123456', expireTime: 1234567890 }
==================================================
🎉 部署完成！
==================================================
```

---

## 🤖 GitHub Actions 自动部署

### 方案 1：基于 Git 推送自动部署

配置文件：`.github/workflows/deploy.yml`

**触发条件**：
- 推送到 `main` 分支
- 创建 Pull Request
- 手动触发（workflow_dispatch）

### 方案 2：配置 GitHub Secrets

在 GitHub 仓库中配置密钥：

1. 进入仓库的「Settings」→「Secrets and variables」→「Actions」
2. 点击「New repository secret」
3. 添加以下密钥：

| 密钥名称 | 说明 | 示例 |
|---------|------|------|
| `MINIPROGRAM_APPID` | 小程序 AppID | `wxeb1d51afc9237cda` |
| `MINIPROGRAM_PRIVATE_KEY` | 私钥文件内容 | 直接粘贴私钥文本 |
| `MINIPROGRAM_ROBOT_VERSION` | 机器人版本号 | `1` |
| `AUTO_SUBMIT_AUDIT` | 是否自动提交审核 | `true` 或 `false` |

**配置步骤**：

1. **添加 AppID**

   - Secret name: `MINIPROGRAM_APPID`
   - Secret value: `wxeb1d51afc9237cda`

2. **添加私钥**

   - Secret name: `MINIPROGRAM_PRIVATE_KEY`
   - Secret value: 打开 `private.key` 文件，复制全部内容粘贴

3. **添加机器人版本号**（可选）

   - Secret name: `MINIPROGRAM_ROBOT_VERSION`
   - Secret value: `1`

4. **添加自动审核设置**（可选）

   - Secret name: `AUTO_SUBMIT_AUDIT`
   - Secret value: `false`

### 方案 3：手动触发部署

在 GitHub 仓库页面：

1. 进入「Actions」标签页
2. 选择「Deploy WeChat Mini Program」工作流
3. 点击「Run workflow」
4. 选择部署类型：
   - `preview`（预览版）
   - `review`（体验版）
   - `production`（正式版）
5. 点击「Run workflow」按钮

### 查看部署状态

1. 进入「Actions」标签页
2. 点击对应的工作流运行记录
3. 查看实时日志
4. 部署完成后可下载构建产物

---

## ❓ 常见问题

### Q1：部署失败，提示"私钥无效"

**原因**：私钥文件格式错误或路径不正确

**解决方案**：
1. 检查私钥文件路径是否正确
2. 确认私钥文件完整，没有多余的空格或换行
3. 重新下载私钥文件

### Q2：部署失败，提示"权限不足"

**原因**：机器人版本号配置错误或权限不足

**解决方案**：
1. 检查 `MINIPROGRAM_ROBOT_VERSION` 是否正确
2. 在微信开发者工具中确认机器人已启用
3. 尝试使用其他机器人版本号（1-30）

### Q3：上传成功，但无法预览

**原因**：版本号冲突或上传超时

**解决方案**：
1. 检查版本号是否已存在
2. 使用新的版本号重新上传
3. 检查网络连接是否正常

### Q4：GitHub Actions 部署失败

**原因**：GitHub Secrets 配置错误

**解决方案**：
1. 检查所有密钥是否正确配置
2. 确认 `MINIPROGRAM_PRIVATE_KEY` 包含完整的私钥内容
3. 查看工作流日志，定位具体错误

### Q5：如何回滚到上一个版本？

**解决方案**：
1. 在微信开发者工具中，进入「版本管理」
2. 在「开发版本」或「体验版本」中找到旧版本
3. 点击「设为体验版」或「提交审核」

### Q6：如何设置多机器人并发上传？

**解决方案**：

```env
# 机器人 1
MINIPROGRAM_ROBOT_VERSION=1

# 机器人 2
MINIPROGRAM_ROBOT_VERSION=2

# ... 最多 30 个机器人
```

---

## 📚 参考资源

- [miniprogram-ci 官方文档](https://developers.weixin.qq.com/miniprogram/dev/devtools/ci.html)
- [Taro 框架文档](https://taro-docs.jd.com/)
- [GitHub Actions 文档](https://docs.github.com/en/actions)

---

## 🆘 需要帮助？

如果遇到问题，请：

1. 检查部署日志
2. 查看常见问题部分
3. 提交 Issue 反馈问题

---

**祝部署顺利！🎉**
