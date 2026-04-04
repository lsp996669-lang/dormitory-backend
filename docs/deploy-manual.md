# 云托管手动部署指南

由于 wxcloud CLI 存在 InternalError 问题，需要通过 Web 控制台手动部署。

## 当前状态

### 已完成的工作
- ✅ 修复了维修床位统计逻辑（维修中的床位不再计入空床位）
- ✅ 优化了前端空床位操作菜单（点击显示入住/维修选项）
- ✅ 代码已推送到 Git 远程仓库：`https://github.com/lsp996669-lang/dormitory-backend`
- ✅ 最新提交：`02e652b feat: 优化操作体验并准备后端部署`

### 问题说明

当前线上服务缺少以下接口：
- `/api/checkin/list` - 入住列表查询
- `/api/beds/maintenance/:bedId` - 床位维修操作
- `/api/beds/maintenance/:bedId/cancel` - 取消维修

### 环境变量要求

部署时需要配置以下环境变量：
- `COZE_SUPABASE_URL` - Supabase 项目 URL
- `COZE_SUPABASE_ANON_KEY` - Supabase 匿名密钥

## 手动部署步骤

### 方法一：通过 Web 控制台重新部署

1. **登录微信云托管控制台**
   - 访问：https://cloud.weixin.qq.com/
   - 选择小程序：宿舍管理系统

2. **进入服务管理**
   - 环境ID：`prod-6gqi0mrc97ffd340`
   - 服务名称：`dormitory-api`

3. **重新部署**
   - 点击「发布管理」
   - 选择「新建版本」
   - 部署方式：代码库
   - 代码仓库：`https://github.com/lsp996669-lang/dormitory-backend`
   - 分支：`main`
   - 点击「发布」

4. **配置环境变量**（重要！）
   - 在发布前，确保设置以下环境变量：
   - `SUPABASE_URL`: 你的 Supabase 项目 URL
   - `SUPABASE_ANON_KEY`: 你的 Supabase 匿名密钥
   - `SUPABASE_SERVICE_ROLE_KEY`: 你的 Supabase 服务密钥

### 方法二：使用已有的镜像版本

如果之前有正常运行的版本（如 dormitory-api-018），可以：

1. 在「发布管理」页面
2. 找到正常运行的版本
3. 点击「回滚到此版本」

## 验证部署结果

部署成功后，验证接口是否正常：

```bash
# 1. 健康检查
curl https://dormitory-api-240668-4-1417759870.sh.run.tcloudbase.com/api/health

# 2. 检查入住列表接口
curl -X POST https://dormitory-api-240668-4-1417759870.sh.run.tcloudbase.com/api/checkin/list \
  -H "Content-Type: application/json" \
  -d '{"dormitory":"nanFour","floor":1}'

# 3. 检查维修接口
curl -X POST https://dormitory-api-240668-4-1417759870.sh.run.tcloudbase.com/api/beds/maintenance/test-bed-id \
  -H "Content-Type: application/json"
```

## 代码仓库信息

- 仓库地址：https://github.com/lsp996669-lang/dormitory-backend
- 最新提交：`02e652b feat: 优化操作体验并准备后端部署`
- 包含的功能：
  - ✅ 入住登记
  - ✅ 搬离登记
  - ✅ 床位维修
  - ✅ 数据统计
  - ✅ 入住列表查询

## 常见问题

### Q: 部署后服务无法启动？

检查环境变量是否正确配置。服务启动需要 Supabase 相关的环境变量。

### Q: 部署后接口返回 404？

可能是代码没有正确部署，或者路由配置有问题。请确保使用的是最新的 main 分支代码。

### Q: 数据库连接失败？

检查 Supabase 的连接配置是否正确：
- `SUPABASE_URL` 格式应为：`https://xxx.supabase.co`
- 密钥应该是有效的

## 联系支持

如果问题持续存在，可以：
1. 在微信开放社区提问
2. 联系微信云托管技术支持
