import { View, Text } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Network } from '@/network'
import { Building, LogIn, Clock, Check } from 'lucide-react-taro'
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
  const [status, setStatus] = useState<'idle' | 'pending' | 'approved' | 'host'>('idle')

  useEffect(() => {
    checkLoginStatus()
  }, [])

  const checkLoginStatus = async () => {
    try {
      const storedUser = Taro.getStorageSync('userInfo')
      if (storedUser) {
        if (storedUser.isHost) {
          setStatus('host')
        } else if (storedUser.isApproved) {
          setStatus('approved')
        } else {
          setStatus('pending')
        }
      }
    } catch (error) {
      console.error('检查登录状态失败:', error)
    }
  }

  const handleLogin = async () => {
    setLoading(true)
    try {
      // 模拟微信登录
      // 实际项目中应调用 Taro.login() 获取 code
      const mockOpenid = `openid_${Date.now()}`
      
      const res = await Network.request({
        url: '/api/auth/login',
        method: 'POST',
        data: {
          openid: mockOpenid,
          nickname: '用户',
          avatar: ''
        }
      })

      console.log('登录响应:', res.data)

      if (res.data?.code === 200 && res.data?.data) {
        const user = res.data.data as UserInfo
        Taro.setStorageSync('userInfo', user)

        if (user.isHost) {
          setStatus('host')
        } else if (user.isApproved) {
          setStatus('approved')
        } else {
          setStatus('pending')
        }
      }
    } catch (error) {
      console.error('登录失败:', error)
      Taro.showToast({
        title: '登录失败，请重试',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEnterSystem = () => {
    Taro.redirectTo({ url: '/pages/floor/index' })
  }

  return (
    <View className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <View className="mb-8">
        <Building size={64} color="#2563eb" />
      </View>

      <Text className="text-2xl font-bold text-gray-800 mb-2">宿舍管理系统</Text>
      <Text className="text-sm text-gray-500 mb-8">欢迎使用</Text>

      {status === 'idle' && (
        <Card className="w-full max-w-sm">
          <CardContent className="p-6">
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleLogin}
              disabled={loading}
            >
              <View className="flex items-center gap-2">
                <LogIn size={20} color="#fff" />
                <Text className="text-white font-medium">
                  {loading ? '登录中...' : '微信登录'}
                </Text>
              </View>
            </Button>
          </CardContent>
        </Card>
      )}

      {status === 'pending' && (
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <View className="flex justify-center mb-4">
              <Clock size={48} color="#f59e0b" />
            </View>
            <CardTitle className="text-lg">等待审批</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <Text className="text-sm text-gray-500 block mb-4">
              您的账号正在等待主机审批，请稍后再试
            </Text>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={checkLoginStatus}
            >
              刷新状态
            </Button>
          </CardContent>
        </Card>
      )}

      {(status === 'approved' || status === 'host') && (
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <View className="flex justify-center mb-4">
              <Check size={48} color="#22c55e" />
            </View>
            <CardTitle className="text-lg">
              {status === 'host' ? '欢迎，主机' : '登录成功'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <Text className="text-sm text-gray-500 block mb-4">
              {status === 'host' 
                ? '您拥有主机权限，可以审批其他用户' 
                : '您已获得使用权限'}
            </Text>
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleEnterSystem}
            >
              进入系统
            </Button>
          </CardContent>
        </Card>
      )}
    </View>
  )
}

export default LoginPage
