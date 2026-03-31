# 宿舍管理后端服务

基于 NestJS 的宿舍管理后端 API 服务。

## 环境变量配置

在微信云托管中配置以下环境变量：

### 必需环境变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `COZE_SUPABASE_URL` | Supabase 项目 URL | `https://xxx.supabase.co` |
| `COZE_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | `eyJhbGciOiJIUzI1NiIs...` |

### 可选环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `INVITE_CODES` | 邀请码列表（逗号分隔） | `960710` |
| `WX_APP_ID` | 微信小程序 AppID | - |
| `WX_APP_SECRET` | 微信小程序 Secret | - |
| `PORT` | 服务端口 | `3000` |

## 本地开发

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建
pnpm build

# 生产模式
pnpm start:prod
```

## 部署说明

本项目已配置 Dockerfile，支持微信云托管自动构建部署。

### 部署步骤

1. 将代码推送到 GitHub 仓库
2. 在微信云托管创建新服务
3. 绑定 GitHub 仓库
4. 配置环境变量
5. 点击发布

### 端口配置

服务默认监听 3000 端口，在微信云托管中配置端口为 `3000`。

## API 接口

- `GET /api` - 健康检查
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/verify` - 验证邀请码
- `GET /api/beds` - 获取床位列表
- `POST /api/checkin` - 入住登记
- `POST /api/checkout` - 搬离登记
- `GET /api/rollcall` - 点名记录
- `POST /api/rollcall` - 提交点名
- `GET /api/export/checkin` - 导出入住数据
- `GET /api/export/checkout` - 导出搬离数据
- `POST /api/import` - 导入数据
