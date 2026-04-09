import Taro from '@tarojs/taro'

/**
 * 云开发网络请求模块
 * 封装 wx.cloud.callFunction，用于调用云函数
 * 注意：CloudBase 功能只在微信小程序环境中可用，H5 环境需要降级处理
 */

export interface CloudResponse<T = any> {
  result: {
    code: number
    msg: string
    data?: T
  }
  errMsg: string
}

// 检查是否在小程序环境中
const isWeapp = Taro.getEnv() === Taro.ENV_TYPE.WEAPP

export namespace Cloud {
  /**
   * 调用云函数
   * @param name 云函数名称
   * @param data 传递给云函数的数据
   */
  export const callFunction = async <T = any>(
    name: string,
    data: Record<string, any> = {}
  ): Promise<CloudResponse<T>> => {
    try {
      console.log(`[Cloud] 调用云函数: ${name}`, data)

      // H5 环境降级处理
      if (!isWeapp) {
        console.warn(`[Cloud] ⚠️ 云函数功能仅在微信小程序中可用，当前环境: ${Taro.getEnv()}`)
        return {
          result: {
            code: 500,
            msg: '云函数功能仅在微信小程序中可用，请在微信开发者工具中测试'
          },
          errMsg: 'cloud.callFunction:not_support'
        }
      }

      // 检查 Taro.cloud 是否可用
      if (!Taro.cloud) {
        console.error('[Cloud] ❌ Taro.cloud 未定义，请确保 CloudBase 已正确初始化')
        return {
          result: {
            code: 500,
            msg: 'CloudBase 未正确初始化'
          },
          errMsg: 'cloud.callFunction:not_initialized'
        }
      }

      const res = await Taro.cloud.callFunction({
        name,
        data
      })

      console.log(`[Cloud] 云函数响应: ${name}`, res.result)

      return {
        result: res.result as any,
        errMsg: res.errMsg
      }
    } catch (error) {
      console.error(`[Cloud] 云函数调用失败: ${name}`, error)

      return {
        result: {
          code: 500,
          msg: error.errMsg || '云函数调用失败'
        },
        errMsg: error.errMsg || 'cloud.callFunction:fail'
      }
    }
  }

  /**
   * 上传文件到云存储
   * @param cloudPath 云文件路径
   * @param filePath 本地文件路径
   */
  export const uploadFile = async (
    cloudPath: string,
    filePath: string
  ): Promise<Taro.cloud.UploadFileResult> => {
    if (!isWeapp) {
      throw new Error('云存储功能仅在微信小程序中可用')
    }

    return await Taro.cloud.uploadFile({
      cloudPath,
      filePath
    })
  }

  /**
   * 下载文件从云存储
   * @param fileID 云文件ID
   */
  export const downloadFile = async (
    fileID: string
  ): Promise<Taro.cloud.DownloadFileResult> => {
    if (!isWeapp) {
      throw new Error('云存储功能仅在微信小程序中可用')
    }

    return await Taro.cloud.downloadFile({
      fileID
    })
  }

  /**
   * 获取临时文件链接
   * @param fileList 云文件ID列表
   */
  export const getTempFileURL = async (
    fileList: string[]
  ): Promise<Taro.cloud.GetTempFileURLResult> => {
    if (!isWeapp) {
      throw new Error('云存储功能仅在微信小程序中可用')
    }

    return await Taro.cloud.getTempFileURL({
      fileList
    })
  }
}
