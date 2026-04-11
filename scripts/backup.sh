#!/bin/bash

# 沙盒项目自动备份脚本
# 功能：备份源代码和配置文件

set -e

# 配置
BACKUP_DIR="/workspace/projects/backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="backup-${TIMESTAMP}.tar.gz"
MAX_BACKUP_DAYS=7

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 开始备份
echo "[$(date)] 开始备份..."

# 创建备份文件
tar -czf "${BACKUP_DIR}/${BACKUP_FILE}" \
  src/ \
  package.json \
  pnpm-lock.yaml \
  tsconfig.json \
  taro.config.ts \
  vite.config.ts \
  .env.local \
  project.config.json \
  app.config.ts \
  tailwind.config.js \
  postcss.config.js \
  eslint.config.mjs \
  2>/dev/null

# 检查备份是否成功
if [ -f "${BACKUP_DIR}/${BACKUP_FILE}" ]; then
  echo "[$(date)] ✅ 备份成功: ${BACKUP_FILE}"
  echo "[$(date)] 文件大小: $(ls -lh "${BACKUP_DIR}/${BACKUP_FILE}" | awk '{print $5}')"
else
  echo "[$(date)] ❌ 备份失败"
  exit 1
fi

# 清理旧备份（保留最近 7 天）
echo "[$(date)] 清理旧备份..."
find "$BACKUP_DIR" -name "backup-*.tar.gz" -mtime +${MAX_BACKUP_DAYS} -delete

# 列出当前备份文件
echo "[$(date)] 当前备份文件:"
ls -lh "$BACKUP_DIR"/backup-*.tar.gz 2>/dev/null || echo "[$(date)] 无备份文件"

echo "[$(date)] 备份完成！"
