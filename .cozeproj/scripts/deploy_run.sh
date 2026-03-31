#!/bin/bash
set -Eeuo pipefail

echo "Starting HTTP service for deploy..."

# 打印当前目录结构以便调试
echo "Current directory: $(pwd)"
echo "COZE_WORKSPACE_PATH: ${COZE_WORKSPACE_PATH}"
ls -la "${COZE_WORKSPACE_PATH}/" 2>/dev/null || echo "Cannot list workspace"
ls -la "${COZE_WORKSPACE_PATH}/server/" 2>/dev/null || echo "Cannot list server directory"

cd "${COZE_WORKSPACE_PATH}/server"

# 检查 dist 目录是否存在
if [ ! -f "dist/main.js" ]; then
    echo "⚠️ dist/main.js not found, attempting to build..."
    
    # 检查是否有 nest 命令
    if command -v nest &> /dev/null; then
        echo "Running: nest build"
        nest build
    elif [ -f "node_modules/.bin/nest" ]; then
        echo "Running: npx nest build"
        npx nest build
    elif command -v pnpm &> /dev/null; then
        echo "Running: pnpm --filter server build"
        cd "${COZE_WORKSPACE_PATH}"
        pnpm --filter server build
        cd "${COZE_WORKSPACE_PATH}/server"
    else
        echo "❌ Cannot build server - no build tools available"
        echo "Directory contents of server:"
        ls -la
        exit 1
    fi
fi

# 再次检查
if [ ! -f "dist/main.js" ]; then
    echo "❌ dist/main.js still not found after build attempt"
    echo "Directory contents of server/dist:"
    ls -la dist 2>/dev/null || echo "dist directory does not exist"
    exit 1
fi

cd dist

port="${DEPLOY_RUN_PORT:-3000}"
echo "Starting server on port ${port}..."

node ./main.js -p "${port}"
