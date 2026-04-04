FROM node:20-alpine

WORKDIR /app

# 安装依赖
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建
RUN pnpm build

# 暴露端口
EXPOSE 3000

# 启动
CMD ["node", "dist/main.js"]
