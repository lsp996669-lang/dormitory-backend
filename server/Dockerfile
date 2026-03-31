# 宿舍管理后端服务 - 微信云托管自动构建版本
FROM node:20-alpine

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制 package.json 和 lock 文件
COPY package.json ./
COPY pnpm-lock.yaml* ./

# 安装所有依赖（包括 devDependencies 用于构建）
RUN pnpm install --frozen-lockfile || pnpm install

# 复制源代码
COPY . .

# 构建应用
RUN pnpm build

# 重新安装，只保留生产依赖
RUN pnpm install --prod

# 暴露端口（微信云托管会自动映射）
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 启动命令
CMD ["node", "dist/main.js"]
