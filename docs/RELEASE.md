# 正式版发布指南

## 一、准备工作

### 1.1 获取微信小程序 AppID
1. 登录 [微信公众平台](https://mp.weixin.qq.com)
2. 进入「开发管理」→「开发设置」
3. 复制 **AppID**

### 1.2 更新 AppID
编辑 `project.config.json`，将 `appid` 改为你的真实 AppID：
```json
{
  "appid": "你的AppID"
}
```

---

## 二、部署后端服务

### 方式一：Vercel（推荐，免费）

1. **推送代码到 GitHub**
   ```bash
   git init
   git add .
   git commit -m "准备发布正式版"
   git remote add origin 你的GitHub仓库地址
   git push -u origin main
   ```

2. **在 Vercel 部署**
   - 访问 https://vercel.com
   - 用 GitHub 登录
   - 点击「New Project」
   - 选择你的仓库
   - Root Directory 设置为 `server`
   - Framework Preset 选择 `NestJS`
   - 添加环境变量：
     - `COZE_SUPABASE_URL` = 你的Supabase地址
     - `COZE_SUPABASE_ANON_KEY` = 你的Supabase密钥
     - `INVITE_CODES` = 960710
   - 点击「Deploy」

3. **获取域名**
   - 部署完成后，Vercel 会分配一个域名
   - 如：`https://dormitory-api.vercel.app`

### 方式二：微信云托管

1. 登录 [微信公众平台](https://mp.weixin.qq.com)
2. 进入「云托管」→「新建服务」
3. 选择「镜像部署」或连接 GitHub
4. 配置环境变量
5. 获取服务域名

---

## 三、配置服务器域名

1. 登录 [微信公众平台](https://mp.weixin.qq.com)
2. 进入「开发管理」→「开发设置」→「服务器域名」
3. 添加域名：
   - **request 合法域名**：`https://你的后端域名`
   - 如果用 Vercel，添加：`https://*.vercel.app`

---

## 四、配置生产环境

编辑 `.env.production` 文件：
```bash
PROJECT_DOMAIN=https://你的后端域名
```

---

## 五、构建生产版本

```bash
# 设置环境变量并构建
PROJECT_DOMAIN=https://你的后端域名 pnpm build:weapp

# 或者使用 .env.production 文件
pnpm build:weapp --mode production
```

---

## 六、上传代码

### 方式一：微信开发者工具（推荐）

1. 下载 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 打开项目，选择 `dist-weapp` 目录
3. 填写 AppID
4. 点击「上传」按钮
5. 填写版本号（如 1.0.0）和版本说明

### 方式二：命令行上传（需要配置）

```bash
# 安装 miniprogram-ci
pnpm add -D miniprogram-ci

# 上传
npx miniprogram-ci upload \
  --pp ./dist-weapp \
  --pkp ./private.key \
  --appid 你的AppID \
  -r 1 \
  --uv 1.0.0 \
  --enable-es6 true
```

---

## 七、提交审核

1. 登录 [微信公众平台](https://mp.weixin.qq.com)
2. 进入「管理」→「版本管理」
3. 找到刚上传的开发版本
4. 点击「提交审核」
5. 填写审核信息：
   - 功能页面：首页、入住登记、搬离登记、导出数据
   - 测试账号：（如需要）
   - 隐私协议：已配置

---

## 八、发布上线

审核通过后：
1. 进入「版本管理」
2. 点击「发布」
3. 选择发布方式：
   - **全量发布**：所有用户可见
   - **灰度发布**：逐步放开用户比例

---

## 检查清单

| 步骤 | 状态 |
|------|------|
| 1. 注册小程序，获取 AppID | ☐ |
| 2. 部署后端服务 | ☐ |
| 3. 配置服务器域名 | ☐ |
| 4. 更新 .env.production | ☐ |
| 5. 更新 project.config.json 的 appid | ☐ |
| 6. 构建生产版本 | ☐ |
| 7. 上传代码 | ☐ |
| 8. 提交审核 | ☐ |
| 9. 发布上线 | ☐ |

---

## 常见问题

### Q: 后端域名必须备案吗？
A: 是的，小程序要求服务器域名必须经过 ICP 备案。
- 使用 Vercel/微信云托管可免备案
- 使用国内云服务器需要先备案

### Q: 审核需要多久？
A: 通常 1-3 个工作日

### Q: 审核被拒怎么办？
A: 根据拒绝原因修改代码，重新上传提交审核
