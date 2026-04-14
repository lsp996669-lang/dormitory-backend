#!/bin/bash

# 修复验证脚本
# 用于测试人员名单查询是否还会导致沙盒断开连接

echo "=========================================="
echo "人员名单查询修复验证脚本"
echo "=========================================="
echo ""

# 1. 测试后端服务是否正常
echo "1. 测试后端服务状态..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health | grep -q "200\|404"; then
  echo "✅ 后端服务正常"
else
  echo "❌ 后端服务异常"
  exit 1
fi
echo ""

# 2. 测试查询南四巷楼层床位
echo "2. 测试查询南四巷2楼床位..."
START_TIME=$(date +%s)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  "http://localhost:3000/api/beds/floor/2")
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ 查询成功 (耗时: ${DURATION}秒)"
else
  echo "❌ 查询失败 (HTTP: $HTTP_CODE)"
fi
echo ""

# 3. 测试查询南二巷楼层床位
echo "3. 测试查询南二巷2楼床位..."
START_TIME=$(date +%s)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  "http://localhost:3000/api/beds/nantwo/floor/2/beds")
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ 查询成功 (耗时: ${DURATION}秒)"
else
  echo "❌ 查询失败 (HTTP: $HTTP_CODE)"
fi
echo ""

# 4. 测试查询南二巷房间床位
echo "4. 测试查询南二巷2楼201房间床位..."
START_TIME=$(date +%s)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  "http://localhost:3000/api/beds/nantwo/floor/2/room/201")
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ 查询成功 (耗时: ${DURATION}秒)"
else
  echo "❌ 查询失败 (HTTP: $HTTP_CODE)"
fi
echo ""

# 5. 检查服务是否仍然运行
echo "5. 检查服务状态..."
if pgrep -f "coze dev" > /dev/null 2>&1; then
  echo "✅ 开发服务器仍在运行"
else
  echo "⚠️ 开发服务器未运行"
fi
echo ""

# 6. 查看最新日志
echo "6. 查看最新日志（最后5行）："
tail -n 5 /tmp/coze-logs/dev.log 2>/dev/null | grep -E "Error|error|Exception" || echo "无错误日志"
echo ""

echo "=========================================="
echo "验证完成！"
echo "=========================================="
echo ""
echo "如果所有测试都通过，说明修复成功！"
echo "如果某个测试失败，请检查日志文件："
echo "  /tmp/coze-logs/dev.log"
