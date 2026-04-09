/**
 * 临时下载链接使用示例
 *
 * 展示如何在宿舍管理小程序中使用临时下载链接功能
 */

import { Cloud } from '@/cloud'
import Taro from '@tarojs/taro'

/**
 * 示例 1: 导出数据并获取临时链接
 */
export async function exportDataAndGetTempURL() {
  try {
    // 1. 导出数据
    const exportRes = await Cloud.callFunction('exportData', {})

    if (exportRes.result?.code === 200) {
      const fileID = exportRes.result.data.fileID
      console.log('导出成功，文件 ID:', fileID)

      // 2. 获取临时链接
      const tempRes = await Cloud.callFunction('getTempFileURL', {
        fileIDs: [fileID]
      })

      if (tempRes.result?.code === 200) {
        const tempFileURL = tempRes.result.data[0].tempFileURL
        console.log('临时链接:', tempFileURL)

        // 3. 复制到剪贴板
        Taro.setClipboardData({
          data: tempFileURL,
          success: () => {
            Taro.showToast({
              title: '链接已复制',
              icon: 'success'
            })
          }
        })

        return tempFileURL
      }
    }
  } catch (error) {
    console.error('操作失败:', error)
    Taro.showToast({
      title: '操作失败',
      icon: 'none'
    })
  }
}

/**
 * 示例 2: 获取多个文件的临时链接
 */
export async function getMultipleTempURLs(fileIDs: string[]) {
  try {
    const res = await Cloud.callFunction('getTempFileURL', {
      fileIDs: fileIDs
    })

    if (res.result?.code === 200) {
      const tempURLs = res.result.data
        .filter(item => item.status === 0)
        .map(item => ({
          fileID: item.fileID,
          tempFileURL: item.tempFileURL,
          maxAge: item.maxAge
        }))

      console.log('获取到的临时链接:', tempURLs)
      return tempURLs
    }
  } catch (error) {
    console.error('获取临时链接失败:', error)
  }

  return []
}

/**
 * 示例 3: 下载临时链接的文件
 */
export async function downloadTempFile(tempFileURL: string) {
  try {
    Taro.showLoading({ title: '下载中...', mask: true })

    // 1. 下载文件
    const downloadRes = await Taro.downloadFile({
      url: tempFileURL
    })

    if (!downloadRes.tempFilePath) {
      throw new Error('下载失败')
    }

    // 2. 保存文件
    const savedRes = await Taro.saveFile({
      tempFilePath: downloadRes.tempFilePath
    })

    Taro.hideLoading()

    // 3. 打开文件
    await Taro.openDocument({
      filePath: (savedRes as any).savedFilePath,
      showMenu: true,
      success: () => {
        console.log('文件打开成功')
      },
      fail: (err) => {
        console.error('文件打开失败:', err)
      }
    })

    Taro.showToast({
      title: '下载成功',
      icon: 'success'
    })
  } catch (error: any) {
    Taro.hideLoading()
    console.error('下载失败:', error)
    Taro.showToast({
      title: error.message || '下载失败',
      icon: 'none'
    })
  }
}

/**
 * 示例 4: 分享临时链接
 */
export async function shareTempURL(tempFileURL: string, fileName: string) {
  try {
    // 复制链接到剪贴板
    await Taro.setClipboardData({
      data: tempFileURL
    })

    // 显示提示
    await Taro.showModal({
      title: '链接已复制',
      content: `${fileName} 的临时链接已复制到剪贴板\n\n有效期: 2 小时\n\n您可以在浏览器中打开或分享给他人`,
      showCancel: false
    })
  } catch (error) {
    console.error('分享失败:', error)
  }
}

/**
 * 示例 5: 检查链接是否过期
 */
export function checkTempURLOrExpiry(maxAge: number, createdAt: Date): boolean {
  const now = new Date()
  const elapsedSeconds = Math.floor((now.getTime() - createdAt.getTime()) / 1000)

  return elapsedSeconds >= maxAge
}

/**
 * 示例 6: 在页面中使用
 */
export class TempURLManager {
  private fileID: string = ''
  private tempFileURL: string = ''
  private maxAge: number = 0
  private createdAt: Date | null = null

  /**
   * 设置文件 ID
   */
  setFileID(fileID: string) {
    this.fileID = fileID
  }

  /**
   * 获取临时链接
   */
  async getTempURL(): Promise<string | null> {
    if (!this.fileID) {
      throw new Error('请先设置 fileID')
    }

    // 检查是否已有临时链接且未过期
    if (this.tempFileURL && this.createdAt) {
      const isExpired = checkTempURLOrExpiry(this.maxAge, this.createdAt)
      if (!isExpired) {
        console.log('使用缓存的临时链接')
        return this.tempFileURL
      }
    }

    // 获取新的临时链接
    const res = await Cloud.callFunction('getTempFileURL', {
      fileIDs: [this.fileID]
    })

    if (res.result?.code === 200) {
      const fileData = res.result.data[0]

      if (fileData.status === 0) {
        this.tempFileURL = fileData.tempFileURL
        this.maxAge = fileData.maxAge
        this.createdAt = new Date()

        return this.tempFileURL
      } else {
        throw new Error(fileData.errMsg || '获取失败')
      }
    }

    return null
  }

  /**
   * 下载文件
   */
  async download() {
    const tempURL = await this.getTempURL()
    if (tempURL) {
      await downloadTempFile(tempURL)
    }
  }

  /**
   * 分享链接
   */
  async share(fileName: string) {
    const tempURL = await this.getTempURL()
    if (tempURL) {
      await shareTempURL(tempURL, fileName)
    }
  }

  /**
   * 清除缓存
   */
  clear() {
    this.fileID = ''
    this.tempFileURL = ''
    this.maxAge = 0
    this.createdAt = null
  }
}

// 使用示例
/*
// 创建管理器
const manager = new TempURLManager()

// 设置文件 ID
manager.setFileID('cloud://xxx.xxx.xxx/exports/xxx.xlsx')

// 获取临时链接
const tempURL = await manager.getTempURL()

// 下载文件
await manager.download()

// 分享链接
await manager.share('宿舍登记数据.xlsx')
*/
