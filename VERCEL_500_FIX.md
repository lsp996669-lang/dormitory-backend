# 🔧 Vercel 500 错误修复

## ❌ 问题原因

您的 `vercel.json` 配置不正确：
- `buildCommand: null` - 没有构建命令
- `outputDirectory: "out"` - 输出目录错误
- `rewrites` 配置错误

---

## ✅ 修复方案

### 步骤 1：更新 vercel.json

**新的配置**：
```json
{
  "version": 2,
  "buildCommand": "npm run build:local",
  "outputDirectory": "dist",
  "functions": {
    "api/**/*.js": {
      "runtime": "nodejs20.x"
    }
  }
}
```

### 步骤 2：重新构建

```bash
cd server
npm run build:local
```

### 步骤 3：重新部署

```bash
# 方式 1：使用 Vercel CLI
vercel --prod

# 方式 2：推送到 GitHub 自动部署
git add .
git commit -m "fix: 修复 Vercel 配置"
git push
```

---

## 🔍 其他可能的问题

### 问题 1：NestJS 主入口文件

确保 `src/main.ts` 正确配置：

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 配置全局前缀
  app.setGlobalPrefix('api');
  
  // 启动应用
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
```

### 问题 2：环境变量

在 Vercel 项目中配置环境变量：

1. 项目 → Settings → Environment Variables
2. 添加必要的环境变量（如果有）

### 问题 3：依赖问题

确保所有依赖都已安装：

```bash
cd server
npm install
```

---

## 🚀 快速修复步骤

### 1. 更新配置

文件：`server/vercel.json`

```json
{
  "version": 2,
  "buildCommand": "npm run build:local",
  "outputDirectory": "dist",
  "functions": {
    "api/**/*.js": {
      "runtime": "nodejs20.x"
    }
  }
}
```

### 2. 本地测试

```bash
cd server
npm run build:local
node dist/main
```

### 3. 重新部署

```bash
cd server
vercel --prod
```

---

## 📋 验证清单

- [ ] `vercel.json` 已更新
- [ ] 本地构建成功
- [ ] 本地运行正常
- [ ] 重新部署成功
- [ ] Vercel 日志无错误

---

## 🆘 如果还是失败

### 查看详细日志

```bash
vercel logs --follow
```

### 常见错误

#### 错误 1：Module not found
```
Error: Cannot find module 'xxx'
```

**解决**：检查依赖是否安装

#### 错误 2：SyntaxError
```
SyntaxError: Unexpected token
```

**解决**：检查 TypeScript 编译

#### 错误 3：Connection timeout
```
Error: Connection timeout
```

**解决**：检查数据库连接

---

## 💡 提示

**修复后，您应该看到**：

```
✅ 构建成功
✅ 部署成功
✅ 域名可访问
✅ API 正常响应
```

---

**现在请按照上述步骤操作，修复 Vercel 配置！**

如果还有问题，请告诉我具体的错误日志！
