import { PropsWithChildren, useEffect } from 'react';
import Taro from '@tarojs/taro';
import '@/app.css';
import { Preset } from './presets';

// ========== CloudBase 初始化 ==========
const initCloud = () => {
  try {
    // 检查是否在小程序环境中
    if (Taro.getEnv() === Taro.ENV_TYPE.WEAPP) {
      console.log('[Cloud] 初始化云开发环境...')

      // 初始化云开发
      Taro.cloud.init({
        env: 'cloud1-9gxn7yw03252175a', // CloudBase 环境 ID
        traceUser: true,
      });

      console.log('[Cloud] ✅ 云开发初始化成功');
    } else {
      console.log('[Cloud] ⚠️ 非小程序环境，跳过云开发初始化');
    }
  } catch (error) {
    console.error('[Cloud] ❌ 云开发初始化失败:', error);
    Taro.showToast({
      title: '云开发初始化失败',
      icon: 'none',
      duration: 3000
    });
  }
};

const App = ({ children }: PropsWithChildren) => {
  useEffect(() => {
    // ========== 初始化云开发 ==========
    initCloud();

    console.log('[App] 应用启动完成');

    return () => {
      console.log('[App] 应用清理');
    };
  }, []);

  return <Preset>{children}</Preset>;
};

export default App;
