#!/bin/bash

# 清理所有进程
echo "🧹 清理现有进程..."
pkill -9 -f "nest start" 2>/dev/null
pkill -9 -f "concurrently" 2>/dev/null
pkill -9 -f "taro build" 2>/dev/null
pkill -9 -f "pnpm dev" 2>/dev/null

sleep 2

echo "✅ 进程清理完成"
echo ""
echo "🚀 启动小程序开发环境（使用云函数，无需后端服务器）..."
echo ""

# 只启动小程序开发
cd /workspace/projects
pnpm dev:weapp
