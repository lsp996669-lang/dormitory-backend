# 宿舍管理后端服务 - 微信云托管独立构建版
FROM node:20-alpine

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制 package.json 文件
COPY package.json ./
COPY pnpm-lock.yaml* ./

# 复制 nest-cli.json 配置
COPY nest-cli.json ./
COPY tsconfig.json ./

# 复制源代码
COPY src ./src

# 安装依赖
RUN pnpm install --frozen-lockfile || pnpm install

# 构建应用
RUN pnpm build

# 清理 devDependencies，只保留生产依赖
RUN pnpm prune --prod

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 启动命令
CMD ["node", "dist/main.js"]
