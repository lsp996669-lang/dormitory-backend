# 宿舍管理后端服务部署包

## 文件说明
- `Dockerfile`: Docker 构建文件
- `.dockerignore`: Docker 忽略文件
- `package.json`: 项目依赖配置
- `nest-cli.json`: NestJS 配置
- `tsconfig.json`: TypeScript 配置
- `src/`: 源代码目录

## 环境变量
部署时需要配置以下环境变量：

```bash
# Supabase 数据库配置（必须）
SUPABASE_URL=你的Supabase项目URL
SUPABASE_ANON_KEY=你的Supabase匿名密钥

# 运行环境
NODE_ENV=production
PORT=3000
```

## 部署步骤
1. 将此目录上传到微信云托管
2. 配置环境变量
3. 部署服务
4. 验证接口

## 接口列表
- `GET /api/export/stats` - 统计数据
- `GET /api/floors/stats` - 楼层统计
- `GET /api/checkin/search?keyword=xxx` - 搜索人员
- `POST /api/checkin` - 入住登记
- `POST /api/checkout` - 搬离登记
