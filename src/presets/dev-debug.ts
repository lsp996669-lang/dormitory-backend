import Taro from '@tarojs/taro';

/**
 * 小程序调试工具
 * 只在开发版自动开启调试模式
 * 体验版和正式版不开启
 */
export function devDebug() {
  const env = Taro.getEnv();
  if (env === Taro.ENV_TYPE.WEAPP || env === Taro.ENV_TYPE.TT) {
    try {
      const accountInfo = Taro.getAccountInfoSync();
      const envVersion = accountInfo.miniProgram.envVersion;
      console.log('[Debug] envVersion:', envVersion);

      // 只在开发版(develop)开启调试，体验版(trial)和正式版(release)不开启
      if (envVersion === 'develop') {
        Taro.setEnableDebug({ enableDebug: true });
      }
    } catch (error) {
      console.error('[Debug] 开启调试模式失败:', error);
    }
  }
}
