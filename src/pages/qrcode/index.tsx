import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { QrCode, Share2, ScanLine, ShieldCheck, ShieldAlert, CircleCheck } from 'lucide-react-taro'
import { Network } from '@/network'
import './index.css'

interface UserInfo {
  id: string
  openid: string
  nickname: string
  avatar: string
  isHost: boolean
  isApproved: boolean
}

const QrCodePage = () => {
  const [inviteCode, setInviteCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)

  useEffect(() => {
    checkUserStatus()
  }, [])

  const checkUserStatus = async () => {
    try {
      const storedUser = Taro.getStorageSync('userInfo')
      if (storedUser) {
        setUserInfo(storedUser)
        setIsVerified(storedUser.isApproved === true)
      }
    } catch (error) {
      console.error('获取用户状态失败:', error)
    }
  }

  const handleScanQrCode = () => {
    Taro.scanCode({
      success: (res) => {
        console.log('扫码结果:', res)
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
    Taro.showToast({ title: '请长按图片保存', icon: 'none' })
  }

  const handleVerifyInviteCode = async () => {
    if (!inviteCode.trim()) {
      Taro.showToast({ title: '请输入邀请码', icon: 'none' })
      return
    }

    if (!userInfo) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      Taro.navigateTo({ url: '/pages/login/index' })
      return
    }

    setVerifying(true)
    try {
      console.log('验证邀请码:', inviteCode, '用户ID:', userInfo.id)
      
      const res = await Network.request({
        url: '/api/auth/verify-invite',
        method: 'POST',
        data: {
          userId: userInfo.id,
          inviteCode: inviteCode.trim()
        }
      })

      console.log('验证响应:', res.data)

      if (res.data?.code === 200 && res.data?.data) {
        const updatedUser = res.data.data as UserInfo
        Taro.setStorageSync('userInfo', updatedUser)
        setUserInfo(updatedUser)
        setIsVerified(true)
        setInviteCode('')
        
        Taro.showToast({
          title: '验证成功',
          icon: 'success'
        })
      } else {
        Taro.showToast({
          title: res.data?.msg || '邀请码无效',
          icon: 'none'
        })
      }
    } catch (error: any) {
      console.error('验证失败:', error)
      Taro.showToast({
        title: error.message || '验证失败，请重试',
        icon: 'none'
      })
    } finally {
      setVerifying(false)
    }
  }

  return (
    <View className="min-h-screen bg-gray-50 p-4">
      <View className="text-center mb-6">
        <Text className="text-xl font-bold text-gray-800 block">宿舍管理助手小程序</Text>
        <Text className="text-sm text-gray-500 block mt-1">扫码快速进入小程序</Text>
      </View>

      {/* 邀请码验证卡片 */}
      <Card className="overflow-hidden mb-4">
        <CardContent className="p-4">
          <View className="flex items-center gap-3 mb-4">
            <View className={`w-10 h-10 rounded-full flex items-center justify-center ${isVerified ? 'bg-green-100' : 'bg-amber-100'}`}>
              {isVerified ? (
                <ShieldCheck size={20} color="#22c55e" />
              ) : (
                <ShieldAlert size={20} color="#f59e0b" />
              )}
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-800">
                {isVerified ? '已验证' : '邀请码验证'}
              </Text>
              <Text className="text-xs text-gray-500">
                {isVerified 
                  ? '您已获得使用权限' 
                  : '输入邀请码解锁使用权限'}
              </Text>
            </View>
            {isVerified && (
              <CircleCheck size={20} color="#22c55e" />
            )}
          </View>

          {!isVerified && (
            <View className="space-y-3">
              <View className="bg-gray-50 rounded-lg px-4 py-3">
                <Input
                  className="w-full bg-transparent text-sm"
                  placeholder="请输入邀请码"
                  value={inviteCode}
                  onInput={(e) => setInviteCode(e.detail.value)}
                  maxlength={20}
                />
              </View>
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleVerifyInviteCode}
                disabled={verifying}
              >
                <Text className="text-white font-medium">
                  {verifying ? '验证中...' : '验证邀请码'}
                </Text>
              </Button>
            </View>
          )}

          {isVerified && (
            <View className="bg-green-50 rounded-lg p-3 border border-green-200">
              <Text className="text-xs text-green-700 block">
                ✅ 您已成功验证，可以使用全部功能
              </Text>
            </View>
          )}
        </CardContent>
      </Card>

      {/* 小程序码展示 */}
      <Card className="overflow-hidden mb-4">
        <CardContent className="p-6">
          <View className="flex flex-col items-center">
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
            <Text className="text-xs text-gray-500 block">1. 首次使用需输入邀请码验证身份</Text>
            <Text className="text-xs text-gray-500 block">2. 验证通过后可使用全部功能</Text>
            <Text className="text-xs text-gray-500 block">3. 扫描小程序码或分享给同事</Text>
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
