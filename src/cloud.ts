import Taro from '@tarojs/taro'

/**
 * 云开发网络请求模块
 * 封装 wx.cloud.callFunction，用于调用云函数
 */

export interface CloudResponse<T = any> {
  result: {
    code: number
    msg: string
    data?: T
  }
  errMsg: string
}

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
    return await Taro.cloud.getTempFileURL({
      fileList
    })
  }
}
