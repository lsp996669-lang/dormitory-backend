import { PropsWithChildren, useEffect, useRef } from 'react';
import Taro from '@tarojs/taro';
import { Network } from '@/network';
import '@/app.css';
import { Preset } from './presets';

// 保活心跳间隔（3分钟）
const KEEP_ALIVE_INTERVAL = 3 * 60 * 1000;

// 重试配置
const MAX_RETRY_COUNT = 3;
const RETRY_DELAY = 5000;

const App = ({ children }: PropsWithChildren) => {
  const retryCountRef = useRef(0);
  const isOnlineRef = useRef(true);

  useEffect(() => {
    // ========== 心跳保活机制 ==========
    const keepAlive = async () => {
      try {
        const res = await Network.request({
          url: '/api/export/stats',
          method: 'GET',
          timeout: 10000,
        });
        
        if (res.statusCode === 200) {
          console.log('[KeepAlive] ✅ 心跳成功:', new Date().toLocaleTimeString());
          retryCountRef.current = 0;
          isOnlineRef.current = true;
        } else {
          throw new Error(`状态码异常: ${res.statusCode}`);
        }
      } catch (error) {
        console.warn('[KeepAlive] ❌ 心跳失败:', error);
        isOnlineRef.current = false;
        
        // 重试机制
        if (retryCountRef.current < MAX_RETRY_COUNT) {
          retryCountRef.current++;
          console.log(`[KeepAlive] 第 ${retryCountRef.current} 次重试...`);
          setTimeout(keepAlive, RETRY_DELAY);
        }
      }
    };

    // ========== 网络状态监听 ==========
    const handleNetworkChange = (res: Taro.onNetworkStatusChange.CallbackResult) => {
      console.log('[Network] 网络状态变化:', res.isConnected ? '已连接' : '已断开', res.networkType);
      
      if (res.isConnected && !isOnlineRef.current) {
        // 网络恢复，立即发送心跳
        console.log('[Network] 🔄 网络恢复，重新连接服务...');
        retryCountRef.current = 0;
        keepAlive();
        
        // 通知用户
        Taro.showToast({
          title: '网络已恢复',
          icon: 'success',
          duration: 2000
        });
      } else if (!res.isConnected) {
        isOnlineRef.current = false;
        Taro.showToast({
          title: '网络已断开',
          icon: 'none',
          duration: 2000
        });
      }
    };

    // ========== 应用生命周期监听 ==========
    const handleAppShow = () => {
      console.log('[App] 应用显示，检查服务状态...');
      keepAlive();
    };

    const handleAppHide = () => {
      console.log('[App] 应用隐藏');
    };

    // ========== 初始化 ==========
    console.log('[App] 初始化保活机制...');
    
    // 启动时立即检测
    keepAlive();

    // 定时心跳
    const heartbeatTimer = setInterval(keepAlive, KEEP_ALIVE_INTERVAL);

    // 监听网络状态变化
    Taro.onNetworkStatusChange(handleNetworkChange);

    // 监听应用显示/隐藏
    Taro.onAppShow(handleAppShow);
    Taro.onAppHide(handleAppHide);

    // H5端：监听页面可见性
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[App] 页面可见，检查服务状态...');
        keepAlive();
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    // ========== 清理 ==========
    return () => {
      clearInterval(heartbeatTimer);
      Taro.offNetworkStatusChange(handleNetworkChange);
      Taro.offAppShow(handleAppShow);
      Taro.offAppHide(handleAppHide);
      
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, []);

  return <Preset>{children}</Preset>;
};

export default App;
