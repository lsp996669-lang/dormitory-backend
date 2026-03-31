# 微信云托管部署指南

## 一、删除旧服务

1. 在服务列表中，点击 `express-4hna`
2. 进入「服务设置」→「删除服务」
3. 确认删除

---

## 二、新建服务（代码部署方式）

### 步骤 1：准备代码

将 server 目录代码上传到 GitHub 或 Gitee：

```bash
cd server
git init
git add .
git commit -m "宿舍管理后端"
git remote add origin https://github.com/你的用户名/dormitory-server.git
git push -u origin main
```

### 步骤 2：创建服务

1. 点击「新建服务」
2. 选择「代码部署」
3. 选择代码来源（GitHub/Gitee）
4. 授权并选择仓库

### 步骤 3：配置服务

| 配置项 | 值 |
|--------|-----|
| 服务名称 | dormitory-api |
| 监听端口 | 3000 |

### 步骤 4：添加环境变量

在「高级配置」→「环境变量」中添加：

```
COZE_SUPABASE_URL=你的Supabase地址
COZE_SUPABASE_ANON_KEY=你的Supabase密钥
INVITE_CODES=960710
```

### 步骤 5：发布

点击「发布」，等待部署完成

---

## 三、获取服务地址

部署成功后：
1. 在服务详情页找到「公网域名访问」
2. 复制域名，格式类似：`https://dormitory-api-xxx.run.tcloudbase.com`
3. 这个地址就是小程序的后端地址

---

## 四、更新小程序配置

提供给我这个地址，我帮你更新配置并重新构建。

---

## ⚡ 简化方式：使用镜像部署

如果有 Docker 镜像：

1. 点击「新建服务」→「镜像部署」
2. 选择「Docker Hub」或「私有镜像仓库」
3. 输入镜像地址
4. 配置环境变量
5. 发布
