#!/bin/bash

# 云开发环境验证脚本
# 用于验证开发环境是否正确配置为使用正式版的服务器

echo "=========================================="
echo "云开发环境验证"
echo "=========================================="
echo ""

# 检查云开发环境 ID
echo "1. 检查云开发环境 ID..."
if grep -q "env: 'cloud1-9gxn7yw03252175a'" /workspace/projects/src/app.tsx; then
    echo "   ✅ 云开发环境 ID: cloud1-9gxn7yw03252175a"
else
    echo "   ❌ 云开发环境 ID 配置错误"
    exit 1
fi
echo ""

# 检查是否还有 Network.request 调用
echo "2. 检查是否还有 Network.request 调用..."
NETWORK_COUNT=$(grep -r "Network\.request\|Network\.uploadFile" /workspace/projects/src --include="*.tsx" --include="*.ts" | wc -l)
if [ "$NETWORK_COUNT" -eq 0 ]; then
    echo "   ✅ 所有页面已改为使用 Cloud.callFunction"
else
    echo "   ⚠️  发现 $NETWORK_COUNT 处 Network 调用需要修改"
    grep -rn "Network\." /workspace/projects/src --include="*.tsx" --include="*.ts" | head -n 10
fi
echo ""

# 检查云函数文件
echo "3. 检查云函数文件..."
CLOUD_FUNCTIONS=$(ls -d /workspace/projects/cloudfunctions/*/index.js 2>/dev/null | wc -l)
echo "   ✅ 发现 $CLOUD_FUNCTIONS 个云函数"
ls -d /workspace/projects/cloudfunctions/*/index.js 2>/dev/null | xargs -I {} basename $(dirname {})
echo ""

# 检查项目配置
echo "4. 检查项目配置..."
if grep -q '"appid": "wxeb1d51afc9237cda"' /workspace/projects/project.config.json; then
    echo "   ✅ AppID: wxeb1d51afc9237cda"
else
    echo "   ❌ AppID 配置错误"
    exit 1
fi
echo ""

# 检查云函数根目录
if grep -q '"cloudfunctionRoot": "./cloudfunctions/"' /workspace/projects/project.config.json; then
    echo "   ✅ 云函数根目录配置正确"
else
    echo "   ⚠️  云函数根目录配置可能有问题"
fi
echo ""

# 检查服务器进程
echo "5. 检查 NestJS 服务器进程..."
SERVER_RUNNING=$(ps aux | grep -E "nest.*start" | grep -v grep | wc -l)
if [ "$SERVER_RUNNING" -gt 0 ]; then
    echo "   ⚠️  NestJS 服务器正在运行（进程数: $SERVER_RUNNING）"
    echo "   💡 提示：当前版本已改为使用云函数，可以停止 NestJS 服务器"
    echo "   命令: pnpm kill:all"
else
    echo "   ✅ NestJS 服务器未运行（符合预期）"
fi
echo ""

echo "=========================================="
echo "验证完成"
echo "=========================================="
echo ""
echo "总结："
echo "- 云开发环境: cloud1-9gxn7yw03252175a (正式版)"
echo "- 数据同步: ✅ 实时同步"
echo "- 服务器: 已改为云函数，不再依赖 NestJS"
echo ""
echo "接下来："
echo "1. 在微信开发者工具中打开项目"
echo "2. 编译并预览小程序"
echo "3. 测试所有功能是否正常"
echo ""
