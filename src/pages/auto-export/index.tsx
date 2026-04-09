import { View, Text } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Cloud } from '@/cloud'
import { Download, Copy, Check, RefreshCw } from 'lucide-react-taro'

const AutoExportPage = () => {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('')
  const [tempURL, setTempURL] = useState('')

  // 自动导出并获取临时链接
  const handleAutoExport = async () => {
    setLoading(true)
    setStep('正在导出数据...')
    setTempURL('')

    try {
      console.log('[自动导出] 开始导出数据')

      // 步骤 1: 导出数据
      const exportRes = await Cloud.callFunction('exportData', {})

      if (exportRes.result?.code !== 200 || !exportRes.result?.data?.fileID) {
        throw new Error(exportRes.result?.msg || '导出失败')
      }

      const fileID = exportRes.result.data.fileID
      console.log('[自动导出] 导出成功，文件 ID:', fileID)

      setStep('正在获取临时链接...')

      // 步骤 2: 获取临时链接
      const tempRes = await Cloud.callFunction('getTempFileURL', {
        fileIDs: [fileID]
      })

      if (tempRes.result?.code !== 200 || !tempRes.result?.data?.length) {
        throw new Error(tempRes.result?.msg || '获取临时链接失败')
      }

      const fileData = tempRes.result.data[0]

      if (fileData.status !== 0) {
        throw new Error(fileData.errMsg || '获取临时链接失败')
      }

      const url = fileData.tempFileURL
      console.log('[自动导出] 临时链接:', url)

      setTempURL(url)
      setStep('✅ 完成！')

      // 自动复制到剪贴板
      await Taro.setClipboardData({ data: url })

      Taro.showModal({
        title: '生成成功',
        content: '临时链接已生成并复制到剪贴板！\n\n链接有效期: 2 小时',
        showCancel: false
      })
    } catch (error: any) {
      console.error('[自动导出] 失败:', error)
      setStep('❌ 失败')
      Taro.showToast({
        title: error.message || '操作失败',
        icon: 'none',
        duration: 3000
      })
    } finally {
      setLoading(false)
    }
  }

  // 复制链接
  const handleCopy = () => {
    if (!tempURL) return

    Taro.setClipboardData({
      data: tempURL,
      success: () => {
        Taro.showToast({ title: '已复制', icon: 'success' })
      }
    })
  }

  // 在浏览器中打开
  const handleOpenInBrowser = () => {
    if (!tempURL) return

    Taro.setClipboardData({
      data: tempURL,
      success: () => {
        Taro.showModal({
          title: '已复制链接',
          content: '链接已复制到剪贴板\n\n请在浏览器中粘贴并打开',
          showCancel: false
        })
      }
    })
  }

  // 下载文件
  const handleDownload = async () => {
    if (!tempURL) return

    try {
      Taro.showLoading({ title: '下载中...', mask: true })

      const downloadRes = await Taro.downloadFile({
        url: tempURL
      })

      Taro.hideLoading()

      if (!downloadRes.tempFilePath) {
        throw new Error('下载失败')
      }

      const savedRes = await Taro.saveFile({
        tempFilePath: downloadRes.tempFilePath
      })

      await Taro.openDocument({
        filePath: (savedRes as any).savedFilePath,
        showMenu: true
      })

      Taro.showToast({ title: '下载成功', icon: 'success' })
    } catch (error: any) {
      Taro.hideLoading()
      console.error('[自动导出] 下载失败:', error)
      Taro.showToast({
        title: error.message || '下载失败',
        icon: 'none'
      })
    }
  }

  return (
    <View className="min-h-screen bg-gray-50 p-4">
      <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
        <Text className="text-xl font-bold text-gray-800 block text-center">
          一键生成临时下载链接
        </Text>
        <Text className="text-sm text-gray-500 block text-center mt-2">
          自动导出数据并生成临时下载链接
        </Text>
      </View>

      {/* 操作按钮 */}
      <Card className="overflow-hidden mb-4">
        <CardContent className="p-4">
          <Button
            className="w-full bg-blue-600 text-white"
            onClick={handleAutoExport}
            disabled={loading}
          >
            {loading ? (
              <View className="flex items-center justify-center gap-2">
                <RefreshCw size={20} color="#fff" className="animate-spin" />
                <Text className="text-white">{step || '处理中...'}</Text>
              </View>
            ) : (
              <View className="flex items-center justify-center gap-2">
                <Download size={20} color="#fff" />
                <Text className="text-white">生成临时下载链接</Text>
              </View>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* 结果展示 */}
      {tempURL && (
        <Card className="overflow-hidden mb-4">
          <CardContent className="p-4">
            <View className="flex items-center gap-2 mb-3">
              <Check size={20} color="#22c55e" />
              <Text className="text-base font-medium text-gray-800">生成成功</Text>
            </View>

            <View className="mb-3">
              <Text className="text-xs text-gray-500 block mb-2">临时下载链接（点击复制）</Text>
              <View
                className="bg-blue-50 p-3 rounded-lg border border-blue-200"
                onClick={handleCopy}
              >
                <Text className="text-sm text-blue-600 block break-all">
                  {tempURL}
                </Text>
              </View>
            </View>

            <View className="flex flex-col gap-3">
              <Button
                className="w-full bg-green-600 text-white"
                size="sm"
                onClick={handleDownload}
              >
                <View className="flex items-center justify-center gap-2">
                  <Download size={16} color="#fff" />
                  <Text className="text-white">下载文件</Text>
                </View>
              </Button>

              <Button
                className="w-full bg-blue-600 text-white"
                size="sm"
                onClick={handleOpenInBrowser}
              >
                <View className="flex items-center justify-center gap-2">
                  <Copy size={16} color="#fff" />
                  <Text className="text-white">复制链接到浏览器</Text>
                </View>
              </Button>

              <Button
                className="w-full bg-gray-600 text-white"
                size="sm"
                onClick={handleCopy}
              >
                <View className="flex items-center justify-center gap-2">
                  <Copy size={16} color="#fff" />
                  <Text className="text-white">再次复制链接</Text>
                </View>
              </Button>
            </View>

            <View className="mt-4 bg-yellow-50 p-3 rounded-lg">
              <Text className="text-xs text-yellow-700 block">
                ⚠️ 链接有效期为 2 小时，请及时使用
              </Text>
            </View>
          </CardContent>
        </Card>
      )}

      {/* 使用说明 */}
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <Text className="text-sm font-medium text-gray-800 block mb-2">使用说明</Text>
          <View className="space-y-1">
            <Text className="text-xs text-gray-500 block">1. 点击"生成临时下载链接"按钮</Text>
            <Text className="text-xs text-gray-500 block">2. 等待系统自动导出并生成链接</Text>
            <Text className="text-xs text-gray-500 block">3. 点击链接或下载文件</Text>
            <Text className="text-xs text-gray-500 block">4. 链接会在 2 小时后失效</Text>
          </View>
        </CardContent>
      </Card>
    </View>
  )
}

export default AutoExportPage
