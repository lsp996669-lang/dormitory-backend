import { View, Text } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Network } from '@/network'
import { Building, Check, User } from 'lucide-react-taro'
import './index.css'

interface UserInfo {
  id: string
  openid: string
  nickname: string
  avatar: string
  isHost: boolean
  isApproved: boolean
}

const LoginPage = () => {
  const [loading, setLoading] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    checkLoginStatus()
  }, [])

  const checkLoginStatus = async () => {
    try {
      const storedUser = Taro.getStorageSync('userInfo')
      if (storedUser) {
        setIsLoggedIn(true)
      }
    } catch (error) {
      console.error('检查登录状态失败:', error)
    }
  }

  // 获取微信登录 code
  const getWxLoginCode = async (): Promise<string> => {
    const env = Taro.getEnv()
    
    if (env === Taro.ENV_TYPE.WEAPP) {
      // 微信小程序环境，调用真实登录
      try {
        const loginRes = await Taro.login()
        console.log('微信登录成功，code:', loginRes.code)
        return loginRes.code
      } catch (error) {
        console.error('微信登录失败:', error)
        throw new Error('微信登录失败')
      }
    } else {
      // H5 开发环境，使用模拟登录
      console.log('H5 环境，使用模拟登录')
      return `mock_code_${Date.now()}`
    }
  }

  const handleLogin = async () => {
    setLoading(true)
    try {
      // 获取登录 code
      const code = await getWxLoginCode()
      
      // 发送到后端进行登录
      const res = await Network.request({
        url: '/api/auth/login',
        method: 'POST',
        data: {
          code,
          nickname: '用户',
          avatar: ''
        }
      })

      console.log('登录响应:', res.data)

      if (res.data?.code === 200 && res.data?.data) {
        const user = res.data.data as UserInfo
        Taro.setStorageSync('userInfo', user)
        setIsLoggedIn(true)
        
        Taro.showToast({
          title: '登录成功',
          icon: 'success'
        })
      } else {
        throw new Error(res.data?.msg || '登录失败')
      }
    } catch (error: any) {
      console.error('登录失败:', error)
      Taro.showToast({
        title: error.message || '登录失败，请重试',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEnterSystem = () => {
    Taro.switchTab({ url: '/pages/floor/index' })
  }

  const handleLogout = () => {
    Taro.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          Taro.removeStorageSync('userInfo')
          setIsLoggedIn(false)
          Taro.showToast({ title: '已退出登录', icon: 'success' })
        }
      }
    })
  }

  return (
    <View className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <View className="mb-8">
        <Building size={64} color="#2563eb" />
      </View>

      <Text className="text-2xl font-bold text-gray-800 mb-2">宿舍管理系统</Text>
      <Text className="text-sm text-gray-500 mb-8">企业内部宿舍入住与搬离管理</Text>

      <Card className="w-full max-w-sm mb-4">
        <CardContent className="p-6">
          {/* 功能说明 */}
          <View className="mb-6">
            <Text className="block text-base font-medium text-gray-800 mb-3">系统功能</Text>
            <View className="space-y-2">
              <View className="flex items-center gap-2">
                <View className="w-2 h-2 rounded-full bg-blue-500" />
                <Text className="text-sm text-gray-600">楼层床铺可视化管理</Text>
              </View>
              <View className="flex items-center gap-2">
                <View className="w-2 h-2 rounded-full bg-blue-500" />
                <Text className="text-sm text-gray-600">入住登记与搬离管理</Text>
              </View>
              <View className="flex items-center gap-2">
                <View className="w-2 h-2 rounded-full bg-blue-500" />
                <Text className="text-sm text-gray-600">数据导出与点名功能</Text>
              </View>
            </View>
          </View>

          {/* 进入系统按钮 */}
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white mb-3"
            onClick={handleEnterSystem}
          >
            <View className="flex items-center gap-2">
              <Building size={20} color="#fff" />
              <Text className="text-white font-medium">进入系统</Text>
            </View>
          </Button>

          {/* 登录/退出按钮 */}
          {isLoggedIn ? (
            <View className="flex items-center justify-between bg-green-50 rounded-lg p-3">
              <View className="flex items-center gap-2">
                <Check size={16} color="#16a34a" />
                <Text className="text-sm text-green-700">已登录</Text>
              </View>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleLogout}
              >
                <Text className="text-sm text-gray-500">退出登录</Text>
              </Button>
            </View>
          ) : (
            <Button 
              className="w-full bg-gray-100 hover:bg-gray-200"
              onClick={handleLogin}
              disabled={loading}
            >
              <View className="flex items-center gap-2">
                <User size={18} color="#6b7280" />
                <Text className="text-gray-700 font-medium">
                  {loading ? '登录中...' : '管理员登录'}
                </Text>
              </View>
            </Button>
          )}

          <Text className="block text-center text-xs text-gray-400 mt-3">
            您可以先浏览系统功能，需要操作时再登录
          </Text>
        </CardContent>
      </Card>
    </View>
  )
}

export default LoginPage
