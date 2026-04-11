#!/bin/bash

# 沙盒服务监控脚本
# 功能：监控开发服务器状态，异常时自动重启

LOG_FILE="/tmp/coze-logs/dev.log"
MONITOR_LOG="/workspace/projects/backups/monitor.log"
MAX_LOG_SIZE=$((50 * 1024 * 1024)) # 50MB

# 检查日志文件大小，超过限制则轮转
if [ -f "$LOG_FILE" ] && [ $(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE") -gt $MAX_LOG_SIZE ]; then
  echo "[$(date)] Log file too large, rotating..." >> $MONITOR_LOG
  mv $LOG_FILE "${LOG_FILE}.old"
  touch $LOG_FILE
fi

# 检查 Coze 开发服务器是否运行
if ! pgrep -f "coze dev" > /dev/null 2>&1; then
  echo "[$(date)] ⚠️ Coze dev server not running, restarting..." >> $MONITOR_LOG
  cd /workspace/projects && nohup coze dev >> $LOG_FILE 2>&1 &
  sleep 10
  echo "[$(date)] ✅ Coze dev server restarted" >> $MONITOR_LOG
else
  echo "[$(date)] ✅ Coze dev server is running" >> $MONITOR_LOG
fi

# 检查服务是否响应
if ! curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health | grep -q "200\|404"; then
  echo "[$(date)] ⚠️ Service not responding, restarting..." >> $MONITOR_LOG
  pkill -f "coze dev"
  sleep 5
  cd /workspace/projects && nohup coze dev >> $LOG_FILE 2>&1 &
  sleep 10
  echo "[$(date)] ✅ Service restarted" >> $MONITOR_LOG
else
  echo "[$(date)] ✅ Service is responding" >> $MONITOR_LOG
fi

# 输出最后 10 行监控日志
echo "[$(date)] Last 10 monitor entries:"
tail -n 10 $MONITOR_LOG
