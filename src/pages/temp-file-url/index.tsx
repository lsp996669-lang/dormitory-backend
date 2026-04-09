import { View, Text } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Cloud } from '@/cloud'
import { Download, Link, Copy, Check } from 'lucide-react-taro'

const TempFileURLPage = () => {
  const [fileID, setFileID] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    fileID: string
    tempFileURL: string
    maxAge: number
  } | null>(null)

  // 获取临时下载链接
  const handleGetTempURL = async () => {
    if (!fileID) {
      Taro.showToast({ title: '请输入文件ID', icon: 'none' })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      console.log('[临时链接] 调用 getTempFileURL 云函数')
      const res = await Cloud.callFunction('getTempFileURL', {
        fileIDs: [fileID]
      })

      console.log('[临时链接] 云函数响应:', res)

      if (res.result?.code === 200 && res.result?.data?.length > 0) {
        const fileData = res.result.data[0]

        if (fileData.status === 0) {
          // 成功
          setResult({
            fileID: fileData.fileID,
            tempFileURL: fileData.tempFileURL,
            maxAge: fileData.maxAge
          })

          Taro.showToast({ title: '获取成功', icon: 'success' })
        } else {
          throw new Error(fileData.errMsg || '获取失败')
        }
      } else {
        throw new Error(res.result?.msg || '获取失败')
      }
    } catch (error: any) {
      console.error('[临时链接] 获取失败:', error)
      Taro.showToast({ title: error.message || '获取失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  // 复制链接
  const handleCopyURL = () => {
    if (!result?.tempFileURL) return

    Taro.setClipboardData({
      data: result.tempFileURL,
      success: () => {
        Taro.showToast({ title: '已复制', icon: 'success' })
      }
    })
  }

  // 下载文件
  const handleDownload = async () => {
    if (!result?.tempFileURL) return

    try {
      Taro.showLoading({ title: '下载中...', mask: true })

      const downloadRes = await Taro.downloadFile({
        url: result.tempFileURL
      })

      Taro.hideLoading()

      if (downloadRes.tempFilePath) {
        // 保存文件
        const savedRes = await Taro.saveFile({
          tempFilePath: downloadRes.tempFilePath
        })

        // 打开文件
        await Taro.openDocument({
          filePath: (savedRes as any).savedFilePath,
          showMenu: true
        })

        Taro.showToast({ title: '下载成功', icon: 'success' })
      } else {
        throw new Error('下载失败')
      }
    } catch (error: any) {
      Taro.hideLoading()
      console.error('[临时链接] 下载失败:', error)
      Taro.showToast({ title: error.message || '下载失败', icon: 'none' })
    }
  }

  // 快速测试：使用最近的导出文件
  const handleTestWithExport = async () => {
    try {
      // 先调用导出云函数
      console.log('[临时链接] 调用 exportData 云函数')
      const exportRes = await Cloud.callFunction('exportData', {})

      if (exportRes.result?.code === 200 && exportRes.result?.data?.fileID) {
        const fileID = exportRes.result.data.fileID
        setFileID(fileID)

        // 自动获取临时链接
        const tempRes = await Cloud.callFunction('getTempFileURL', {
          fileIDs: [fileID]
        })

        if (tempRes.result?.code === 200 && tempRes.result?.data?.length > 0) {
          const fileData = tempRes.result.data[0]

          if (fileData.status === 0) {
            setResult({
              fileID: fileData.fileID,
              tempFileURL: fileData.tempFileURL,
              maxAge: fileData.maxAge
            })

            Taro.showToast({ title: '测试成功', icon: 'success' })
          }
        }
      }
    } catch (error: any) {
      console.error('[临时链接] 测试失败:', error)
      Taro.showToast({ title: error.message || '测试失败', icon: 'none' })
    }
  }

  return (
    <View className="min-h-screen bg-gray-50 p-4">
      <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
        <View className="flex items-center gap-3 mb-2">
          <View className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Link size={20} color="#2563eb" />
          </View>
          <View>
            <Text className="text-lg font-bold text-gray-800 block">临时下载链接</Text>
            <Text className="text-sm text-gray-500">获取云存储文件的临时访问链接</Text>
          </View>
        </View>
      </View>

      {/* 输入文件ID */}
      <Card className="overflow-hidden mb-4">
        <CardContent className="p-4">
          <View className="mb-3">
            <Label className="text-sm text-gray-700 block mb-2">文件 ID</Label>
            <Input
              className="w-full"
              placeholder="请输入云存储文件 ID"
              value={fileID}
              onInput={(e) => setFileID(e.detail.value)}
            />
          </View>

          <Button
            className="w-full bg-blue-600 text-white"
            onClick={handleGetTempURL}
            disabled={loading}
          >
            {loading ? '获取中...' : '获取临时链接'}
          </Button>
        </CardContent>
      </Card>

      {/* 快速测试 */}
      <Card className="overflow-hidden mb-4">
        <CardContent className="p-4">
          <Text className="text-sm font-medium text-gray-800 block mb-2">快速测试</Text>
          <Button
            className="w-full bg-green-600 text-white"
            onClick={handleTestWithExport}
            disabled={loading}
          >
            <View className="flex items-center justify-center gap-2">
              <Download size={16} color="#fff" />
              <Text className="text-white">导出并获取链接</Text>
            </View>
          </Button>
        </CardContent>
      </Card>

      {/* 结果展示 */}
      {result && (
        <Card className="overflow-hidden mb-4">
          <CardContent className="p-4">
            <View className="flex items-center gap-2 mb-3">
              <Check size={20} color="#22c55e" />
              <Text className="text-base font-medium text-gray-800">获取成功</Text>
            </View>

            <View className="space-y-3">
              <View>
                <Text className="text-xs text-gray-500 block mb-1">文件 ID</Text>
                <Text className="text-sm text-gray-800 bg-gray-50 p-2 rounded block break-all">
                  {result.fileID}
                </Text>
              </View>

              <View>
                <Text className="text-xs text-gray-500 block mb-1">临时链接</Text>
                <Text className="text-sm text-blue-600 bg-gray-50 p-2 rounded block break-all">
                  {result.tempFileURL}
                </Text>
              </View>

              <View>
                <Text className="text-xs text-gray-500 block mb-1">有效期</Text>
                <Text className="text-sm text-gray-800">
                  {Math.floor(result.maxAge / 60)} 分钟
                </Text>
              </View>
            </View>

            <View className="flex gap-3 mt-4">
              <Button
                className="flex-1 bg-blue-600 text-white"
                size="sm"
                onClick={handleCopyURL}
              >
                <View className="flex items-center justify-center gap-2">
                  <Copy size={16} color="#fff" />
                  <Text className="text-white">复制链接</Text>
                </View>
              </Button>

              <Button
                className="flex-1 bg-green-600 text-white"
                size="sm"
                onClick={handleDownload}
              >
                <View className="flex items-center justify-center gap-2">
                  <Download size={16} color="#fff" />
                  <Text className="text-white">下载文件</Text>
                </View>
              </Button>
            </View>
          </CardContent>
        </Card>
      )}

      {/* 使用说明 */}
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <Text className="text-sm font-medium text-gray-800 block mb-2">使用说明</Text>
          <View className="space-y-1">
            <Text className="text-xs text-gray-500 block">• 输入云存储文件的 ID</Text>
            <Text className="text-xs text-gray-500 block">• 点击"获取临时链接"按钮</Text>
            <Text className="text-xs text-gray-500 block">• 链接有效期为 2 小时</Text>
            <Text className="text-xs text-gray-500 block">• 可以复制链接或直接下载</Text>
          </View>
        </CardContent>
      </Card>
    </View>
  )
}

export default TempFileURLPage
