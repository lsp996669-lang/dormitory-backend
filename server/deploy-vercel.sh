#!/bin/bash

# Vercel 自动部署脚本
# 此脚本会自动完成 Vercel 部署的所有步骤

set -e

echo "=========================================="
echo "   Vercel 自动部署脚本"
echo "=========================================="
echo ""

cd /workspace/projects/server

# 检查是否已登录 Vercel
echo "步骤 1: 检查 Vercel 登录状态..."
if ! vercel whoami &>/dev/null; then
    echo "⚠️  你需要先登录 Vercel"
    echo ""
    echo "请运行以下命令登录："
    echo "  vercel login"
    echo ""
    echo "登录后会显示链接，在浏览器中打开并授权。"
    echo "授权成功后，再次运行此脚本即可。"
    exit 1
fi

echo "✅ 已登录 Vercel"
echo ""

# 检查环境变量配置
echo "步骤 2: 检查环境变量配置..."
if [ ! -f .env ]; then
    echo "⚠️  缺少 .env 文件"
    echo ""
    echo "请提供以下 Supabase 配置信息："
    echo ""
    read -p "请输入 DATABASE_URL: " DATABASE_URL
    read -p "请输入 SUPABASE_URL: " SUPABASE_URL
    read -p "请输入 SUPABASE_ANON_KEY: " SUPABASE_ANON_KEY
    echo ""

    cat > .env <<EOF
DATABASE_URL=$DATABASE_URL
SUPABASE_URL=$SUPABASE_URL
SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
EOF

    echo "✅ 环境变量已保存到 .env 文件"
else
    echo "✅ 环境变量文件已存在"
fi
echo ""

# 部署到 Vercel
echo "步骤 3: 部署到 Vercel..."
echo "这可能需要 2-3 分钟，请耐心等待..."
echo ""

DEPLOYMENT_URL=$(vercel --prod --yes 2>&1 | grep -E 'https://.*\.vercel\.app' | tail -1)

if [ -z "$DEPLOYMENT_URL" ]; then
    echo "❌ 部署失败"
    echo ""
    echo "请检查上面的错误信息"
    exit 1
fi

echo ""
echo "=========================================="
echo "   🎉 部署成功！"
echo "=========================================="
echo ""
echo "后端域名：$DEPLOYMENT_URL"
echo ""
echo "请将此域名复制并告诉我，我会帮你重新构建小程序。"
echo ""
