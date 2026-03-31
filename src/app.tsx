import { PropsWithChildren, useEffect } from 'react';
import { Network } from '@/network';
import '@/app.css';
import { Preset } from './presets';

// 保活心跳间隔（5分钟）
const KEEP_ALIVE_INTERVAL = 5 * 60 * 1000;

const App = ({ children }: PropsWithChildren) => {
  useEffect(() => {
    // 保活机制：定时发送心跳请求，保持后端服务活跃
    const keepAlive = async () => {
      try {
        await Network.request({
          url: '/api/export/stats',
          method: 'GET',
        });
        console.log('[KeepAlive] 心跳检测成功:', new Date().toLocaleTimeString());
      } catch (error) {
        console.warn('[KeepAlive] 心跳检测失败:', error);
      }
    };

    // 启动时立即检测一次
    keepAlive();

    // 定时发送心跳
    const timer = setInterval(keepAlive, KEEP_ALIVE_INTERVAL);

    // 页面可见性变化时也检测一次
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        keepAlive();
      }
    };

    // H5端监听页面可见性
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      clearInterval(timer);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, []);

  return <Preset>{children}</Preset>;
};

export default App;
