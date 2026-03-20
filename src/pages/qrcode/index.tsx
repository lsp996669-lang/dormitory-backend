import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { QrCode, Share2, ScanLine } from 'lucide-react-taro'
import './index.css'

const QrCodePage = () => {
  const handleScanQrCode = () => {
    Taro.scanCode({
      success: (res) => {
        console.log('扫码结果:', res)
        // 如果是小程序码，可以跳转到对应页面
        if (res.path) {
          Taro.navigateTo({ url: res.path })
        }
      },
      fail: (err) => {
        console.error('扫码失败:', err)
        Taro.showToast({ title: '扫码失败', icon: 'none' })
      }
    })
  }

  const handleSaveImage = () => {
    // 提示用户长按保存
    Taro.showToast({ title: '请长按图片保存', icon: 'none' })
  }

  return (
    <View className="min-h-screen bg-gray-50 p-4">
      <View className="text-center mb-6">
        <Text className="text-xl font-bold text-gray-800 block">宿舍管理助手小程序</Text>
        <Text className="text-sm text-gray-500 block mt-1">扫码快速进入小程序</Text>
      </View>

      <Card className="overflow-hidden mb-4">
        <CardContent className="p-6">
          <View className="flex flex-col items-center">
            {/* 小程序码展示区域 */}
            <View className="w-64 h-64 bg-white rounded-lg border-2 border-gray-200 flex items-center justify-center mb-4 shadow-sm">
              <View className="text-center">
                <QrCode size={120} color="#2563eb" />
                <Text className="block text-xs text-gray-400 mt-2">
                  小程序码
                </Text>
                <Text className="block text-xs text-gray-400">
                  (需配置真实小程序码)
                </Text>
              </View>
            </View>

            <Text className="text-sm text-gray-600 text-center">
              长按识别小程序码
            </Text>
            <Text className="text-xs text-gray-400 text-center mt-1">
              或使用微信扫一扫功能
            </Text>
          </View>
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <View className="space-y-3">
        <Card className="overflow-hidden cursor-pointer" onClick={handleScanQrCode}>
          <CardContent className="p-4">
            <View className="flex items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <ScanLine size={20} color="#2563eb" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-800">扫一扫</Text>
                <Text className="text-xs text-gray-500">扫描小程序码快速进入</Text>
              </View>
            </View>
          </CardContent>
        </Card>

        <Card className="overflow-hidden cursor-pointer" onClick={handleSaveImage}>
          <CardContent className="p-4">
            <View className="flex items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Share2 size={20} color="#22c55e" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-800">分享小程序</Text>
                <Text className="text-xs text-gray-500">分享给同事使用</Text>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 使用说明 */}
      <Card className="overflow-hidden mt-4">
        <CardContent className="p-4">
          <Text className="text-sm font-medium text-gray-800 block mb-2">使用说明</Text>
          <View className="space-y-2">
            <Text className="text-xs text-gray-500 block">1. 打开微信扫一扫，扫描小程序码</Text>
            <Text className="text-xs text-gray-500 block">2. 或长按小程序码识别进入</Text>
            <Text className="text-xs text-gray-500 block">3. 首次使用需授权登录</Text>
            <Text className="text-xs text-gray-500 block">4. 登录后即可使用宿舍管理功能</Text>
          </View>
        </CardContent>
      </Card>

      {/* 配置提示 */}
      <View className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
        <Text className="text-xs text-amber-700 block">
          ⚠️ 提示：真实小程序码需要在微信公众平台后台生成
        </Text>
        <Text className="text-xs text-amber-600 block mt-1">
          路径：设置 → 基本设置 → 小程序码及线下物料下载
        </Text>
      </View>
    </View>
  )
}

export default QrCodePage
