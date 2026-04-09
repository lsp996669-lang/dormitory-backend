#!/bin/bash

# 快速修复脚本 - 解决 "preview reload failed: 进程退出码: -9" 错误

echo "=========================================="
echo "小程序开发环境修复工具"
echo "=========================================="
echo ""

# 检查进程状态
echo "🔍 检查当前进程状态..."
PROCESS_COUNT=$(ps aux | grep -E "nest start|concurrently" | grep -v grep | wc -l)
if [ $PROCESS_COUNT -gt 0 ]; then
    echo "⚠️  发现 $PROCESS_COUNT 个冲突进程"
else
    echo "✅ 没有冲突进程"
fi
echo ""

# 清理所有进程
echo "🧹 清理所有进程..."
pkill -9 -f "nest start" 2>/dev/null
pkill -9 -f "concurrently" 2>/dev/null
pkill -9 -f "taro build" 2>/dev/null
pkill -9 -f "pnpm dev" 2>/dev/null
sleep 2
echo "✅ 进程清理完成"
echo ""

# 检查端口
echo "🔍 检查端口占用..."
PORT_3000=$(ss -lptn 'sport = :3000' 2>/dev/null | grep LISTEN | wc -l)
if [ $PORT_3000 -gt 0 ]; then
    echo "⚠️  端口 3000 仍被占用，强制释放..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null
    sleep 1
    echo "✅ 端口 3000 已释放"
else
    echo "✅ 端口 3000 正常"
fi
echo ""

# 检查编译输出
echo "🔍 检查编译输出..."
if [ -d "/workspace/projects/dist-weapp" ]; then
    echo "✅ 编译输出目录存在"
    PAGE_COUNT=$(ls /workspace/projects/dist-weapp/pages/ | wc -l)
    echo "   - 页面数量: $PAGE_COUNT"
else
    echo "⚠️  编译输出目录不存在，需要重新编译"
fi
echo ""

# 询问是否启动
echo "=========================================="
echo "准备就绪！"
echo "=========================================="
echo ""
echo "选择操作："
echo "  1. 启动小程序开发环境（推荐）"
echo "  2. 仅清理进程，不启动"
echo "  3. 退出"
echo ""
read -p "请输入选项 [1-3]: " choice

case $choice in
    1)
        echo ""
        echo "🚀 启动小程序开发环境..."
        echo ""
        cd /workspace/projects
        pnpm dev:weapp
        ;;
    2)
        echo ""
        echo "✅ 仅清理完成"
        echo ""
        echo "使用以下命令手动启动："
        echo "  cd /workspace/projects && pnpm dev:weapp"
        ;;
    3)
        echo ""
        echo "👋 退出"
        ;;
    *)
        echo ""
        echo "❌ 无效选项"
        exit 1
        ;;
esac
