import { View, Text } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Cloud } from '@/cloud'
import { Download, Copy, Check, Package, RefreshCw } from 'lucide-react-taro'

const DownloadAppPage = () => {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('')
  const [tempURL, setTempURL] = useState('')
  const [fileInfo, setFileInfo] = useState<{
    fileName: string
    fileSize: string
    fileID: string
  } | null>(null)

  // 上传小程序包并获取下载链接
  const handleUploadAndGetURL = async () => {
    setLoading(true)
    setStep('正在上传小程序包...')
    setTempURL('')

    try {
      console.log('[下载小程序] 开始上传')

      // 调用云函数上传
      const res = await Cloud.callFunction('uploadAppPackage', {})

      if (res.result?.code !== 200) {
        throw new Error(res.result?.msg || '上传失败')
      }

      const data = res.result.data
      console.log('[下载小程序] 上传成功:', data)

      setStep('✅ 完成！')
      setTempURL(data.tempFileURL)
      setFileInfo({
        fileName: data.fileName,
        fileSize: data.fileSize,
        fileID: data.fileID
      })

      // 自动复制到剪贴板
      await Taro.setClipboardData({ data: data.tempFileURL })

      Taro.showModal({
        title: '链接已生成',
        content: `小程序包已上传并生成下载链接！\n\n文件名: ${data.fileName}\n文件大小: ${data.fileSize}\n有效期: 2 小时\n\n链接已复制到剪贴板`,
        showCancel: false
      })
    } catch (error: any) {
      console.error('[下载小程序] 失败:', error)
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
          content: '链接已复制到剪贴板\n\n请在浏览器中粘贴并打开\n\n提示：这是一个 .tar.gz 压缩包，解压后可获得小程序完整代码',
          showCancel: false
        })
      }
    })
  }

  return (
    <View className="min-h-screen bg-gray-50 p-4">
      <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
        <View className="flex items-center gap-3 mb-2">
          <View className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Package size={20} color="#2563eb" />
          </View>
          <View>
            <Text className="text-xl font-bold text-gray-800 block">
              小程序代码包下载
            </Text>
            <Text className="text-sm text-gray-500 block mt-1">
              获取当前版本小程序的完整代码
            </Text>
          </View>
        </View>
      </View>

      {/* 操作按钮 */}
      <Card className="overflow-hidden mb-4">
        <CardContent className="p-4">
          <Button
            className="w-full bg-blue-600 text-white"
            onClick={handleUploadAndGetURL}
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
                <Text className="text-white">生成下载链接</Text>
              </View>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* 结果展示 */}
      {tempURL && fileInfo && (
        <Card className="overflow-hidden mb-4">
          <CardContent className="p-4">
            <View className="flex items-center gap-2 mb-3">
              <Check size={20} color="#22c55e" />
              <Text className="text-base font-medium text-gray-800">生成成功</Text>
            </View>

            <View className="space-y-2 mb-3">
              <View className="flex justify-between items-center">
                <Text className="text-xs text-gray-500">文件名</Text>
                <Text className="text-sm text-gray-800">{fileInfo.fileName}</Text>
              </View>
              <View className="flex justify-between items-center">
                <Text className="text-xs text-gray-500">文件大小</Text>
                <Text className="text-sm text-gray-800">{fileInfo.fileSize}</Text>
              </View>
            </View>

            <View className="mb-3">
              <Text className="text-xs text-gray-500 block mb-2">下载链接（点击复制）</Text>
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

            <View className="mt-4 space-y-2">
              <View className="bg-blue-50 p-3 rounded-lg">
                <Text className="text-xs text-blue-700 block">
                  💡 下载后解压即可获得完整的小程序代码
                </Text>
              </View>
              <View className="bg-yellow-50 p-3 rounded-lg">
                <Text className="text-xs text-yellow-700 block">
                  ⚠️ 链接有效期为 2 小时，请及时使用
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>
      )}

      {/* 使用说明 */}
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <Text className="text-sm font-medium text-gray-800 block mb-2">使用说明</Text>
          <View className="space-y-1">
            <Text className="text-xs text-gray-500 block">1. 点击"生成下载链接"按钮</Text>
            <Text className="text-xs text-gray-500 block">2. 等待系统上传小程序包</Text>
            <Text className="text-xs text-gray-500 block">3. 复制链接到浏览器下载</Text>
            <Text className="text-xs text-gray-500 block">4. 解压 .tar.gz 文件获得代码</Text>
            <Text className="text-xs text-gray-500 block">5. 用微信开发者工具打开 dist-weapp 目录</Text>
          </View>
        </CardContent>
      </Card>
    </View>
  )
}

export default DownloadAppPage
