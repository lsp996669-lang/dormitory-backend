# 🚀 小程序开发启动指南

## 问题原因

之前的错误 `preview reload failed: 进程退出码: -9` 是由于：
1. **多个 NestJS 进程同时运行**，导致资源冲突
2. **内存不足**，系统强制终止进程（SIGKILL）
3. **同时启动 web 和 server**，但我们已经迁移到云函数，不再需要后端服务器

## ✅ 解决方案

### 1. 停止所有进程

```bash
cd /workspace/projects
pnpm kill:all
```

### 2. 只启动小程序开发环境

```bash
cd /workspace/projects
pnpm dev:weapp
```

### 3. 或使用快速启动脚本

```bash
cd /workspace/projects
./start-miniprogram.sh
```

## 📝 当前状态

### ✅ 编译成功
- 编译时间：14401ms（约14秒）
- 输出目录：`dist-weapp/`
- 所有页面：10 个页面全部编译成功

### ✅ 进程状态
- 小程序开发服务器：运行中
- NestJS 服务器：已停止（不需要）
- 资源占用：正常

### ✅ 云函数配置
- 环境ID：`cloud1-9gxn7yw03252175a`
- 云函数：25 个
- 数据同步：实时同步

## 🔍 验证方法

### 检查编译状态
```bash
ls -la /workspace/projects/dist-weapp/
```

### 检查进程状态
```bash
ps aux | grep "taro build.*weapp" | grep -v grep
```

### 查看编译日志
```bash
tail -f /tmp/miniprogram-dev.log
```

## 🎯 下一步操作

1. **在微信开发者工具中打开项目**
   - 项目路径：`/workspace/projects`
   - AppID：`wxeb1d51afc9237cda`
   - 选择「导入项目」

2. **上传并部署云函数**
   - 右键点击 `cloudfunctions` 目录
   - 选择「上传并部署：云端安装依赖」

3. **测试小程序功能**
   - 楼层统计
   - 入住登记
   - 床位详情
   - 导出数据

## ⚠️ 注意事项

1. **不要同时启动多个开发服务器**
   - ❌ `pnpm dev`（会启动 web + server）
   - ✅ `pnpm dev:weapp`（只启动小程序）

2. **不要运行 NestJS 服务器**
   - 已迁移到云函数，不再需要后端服务器
   - 如果不小心启动了，用 `pnpm kill:all` 清理

3. **内存管理**
   - 如果遇到内存不足，先清理进程再重新启动
   - 使用 `pnpm kill:all` 清理所有进程

## 🔧 故障排除

### 问题：编译失败
```bash
# 清理缓存
rm -rf dist-weapp
rm -rf node_modules/.cache
rm -rf node_modules/.vite

# 重新编译
pnpm dev:weapp
```

### 问题：进程被杀死
```bash
# 清理所有进程
pnpm kill:all

# 等待几秒
sleep 3

# 重新启动
pnpm dev:weapp
```

### 问题：端口被占用
```bash
# 查看端口占用
ss -lptn 'sport = :3000'

# 清理进程
pkill -9 -f "nest start"
```

## 📚 相关文档

- **迁移指南**: `MIGRATION_COMPLETE_REPORT.md`
- **环境验证**: `verify-cloud-env.sh`
- **启动脚本**: `start-miniprogram.sh`
