import { View, Text } from '@tarojs/components'
import { useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building, Bed, Bell, BellRing, User, Calendar, Trash2, ClipboardCheck } from 'lucide-react-taro'
import { Network } from '@/network'
import './index.css'

interface FloorStats {
  floor: number
  totalBeds: number
  occupiedBeds: number
  emptyBeds: number
}

interface Notification {
  id: number
  type: string
  floor: number
  bed_number: number
  position: string
  name: string
  message: string
  created_at: string
}

const FloorPage = () => {
  const [floorStats, setFloorStats] = useState<FloorStats[]>([])
  const [loading, setLoading] = useState(true)
  const [notificationCount, setNotificationCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)

  useDidShow(() => {
    checkAuth()
    loadFloorStats()
    loadNotificationCount()
  })

  const checkAuth = () => {
    const userInfo = Taro.getStorageSync('userInfo')
    if (!userInfo) {
      Taro.redirectTo({ url: '/pages/login/index' })
    }
  }

  const loadFloorStats = async () => {
    setLoading(true)
    try {
      const res = await Network.request({
        url: '/api/floors/stats'
      })

      console.log('楼层统计响应:', res.data)

      if (res.data?.code === 200 && res.data?.data) {
        // 过滤掉1楼，只显示2-4楼
        const floors = res.data.data.filter((f: FloorStats) => f.floor >= 2)
        setFloorStats(floors)
      } else {
        setFloorStats([
          { floor: 2, totalBeds: 30, occupiedBeds: 0, emptyBeds: 30 },
          { floor: 3, totalBeds: 30, occupiedBeds: 0, emptyBeds: 30 },
          { floor: 4, totalBeds: 30, occupiedBeds: 0, emptyBeds: 30 },
        ])
      }
    } catch (error) {
      console.error('加载楼层统计失败:', error)
      setFloorStats([
        { floor: 2, totalBeds: 30, occupiedBeds: 0, emptyBeds: 30 },
        { floor: 3, totalBeds: 30, occupiedBeds: 0, emptyBeds: 30 },
        { floor: 4, totalBeds: 30, occupiedBeds: 0, emptyBeds: 30 },
      ])
    } finally {
      setLoading(false)
    }
  }

  const loadNotificationCount = async () => {
    try {
      const res = await Network.request({
        url: '/api/notification/count'
      })
      if (res.data?.code === 200) {
        setNotificationCount(res.data.data?.count || 0)
      }
    } catch (error) {
      console.error('加载通知数量失败:', error)
    }
  }

  const loadNotifications = async () => {
    try {
      const res = await Network.request({
        url: '/api/notification/list'
      })
      if (res.data?.code === 200) {
        setNotifications(res.data.data || [])
      }
    } catch (error) {
      console.error('加载通知列表失败:', error)
      setNotifications([])
    }
  }

  const handleFloorClick = (floor: number) => {
    Taro.navigateTo({
      url: `/pages/checkin/index?floor=${floor}`
    })
  }

  const handleRollCallClick = (floor: number) => {
    Taro.navigateTo({
      url: `/pages/rollcall/index?floor=${floor}`
    })
  }

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications)
    if (!showNotifications) {
      loadNotifications()
    }
  }

  const handleClearNotifications = async () => {
    const res = await Taro.showModal({
      title: '确认清空',
      content: '确定要清空所有通知吗？'
    })
    if (!res.confirm) return

    try {
      const response = await Network.request({
        url: '/api/notification/clear',
        method: 'POST'
      })
      if (response.data?.code === 200) {
        Taro.showToast({ title: '已清空', icon: 'success' })
        setNotifications([])
        setNotificationCount(0)
        setShowNotifications(false)
      }
    } catch (error) {
      console.error('清空通知失败:', error)
    }
  }

  const formatTime = (dateStr: string) => {
    if (!dateStr) return ''
    try {
      const date = new Date(dateStr)
      const now = new Date()
      const diff = now.getTime() - date.getTime()
      const minutes = Math.floor(diff / 60000)
      const hours = Math.floor(diff / 3600000)
      const days = Math.floor(diff / 86400000)

      if (minutes < 1) return '刚刚'
      if (minutes < 60) return `${minutes}分钟前`
      if (hours < 24) return `${hours}小时前`
      if (days < 7) return `${days}天前`
      return `${date.getMonth() + 1}月${date.getDate()}日`
    } catch {
      return dateStr
    }
  }

  const getPositionLabel = (position?: string) => {
    if (!position) return ''
    return position === 'upper' ? '上铺' : '下铺'
  }

  return (
    <View className="min-h-screen bg-gray-50 p-4">
      <View className="mb-6">
        <Text className="text-2xl font-bold text-gray-800 block">宿舍管理</Text>
        <Text className="text-sm text-gray-500 block mt-1">选择楼层进行入住登记，点击已入住床位可搬离</Text>
      </View>

      {/* 系统通知卡片 */}
      <Card className="overflow-hidden mb-4">
        <CardHeader className="pb-3">
          <View className="flex items-center justify-between">
            <View className="flex items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center relative">
                <Bell size={20} color="#f97316" />
                {notificationCount > 0 && (
                  <View className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                    <Text className="text-white text-xs">{notificationCount > 99 ? '99+' : notificationCount}</Text>
                  </View>
                )}
              </View>
              <View>
                <CardTitle className="text-lg">系统通知</CardTitle>
                <Text className="text-xs text-gray-500">
                  {notificationCount > 0 ? `${notificationCount} 条新通知` : '暂无新通知'}
                </Text>
              </View>
            </View>
            {notificationCount > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleNotificationClick}
              >
                <BellRing size={16} color="#f97316" />
              </Button>
            )}
          </View>
        </CardHeader>

        {/* 通知列表 */}
        {showNotifications && (
          <CardContent className="pt-0 border-t border-gray-100">
            {notifications.length === 0 ? (
              <View className="py-6 text-center">
                <Text className="text-gray-400 text-sm">暂无通知</Text>
              </View>
            ) : (
              <View className="space-y-2 mt-3">
                {notifications.map((notification) => (
                  <View
                    key={notification.id}
                    className="bg-gray-50 rounded-lg p-3 border border-gray-100"
                  >
                    <View className="flex items-start justify-between">
                      <View className="flex-1">
                        <View className="flex items-center gap-1 mb-1">
                          <User size={12} color="#6b7280" />
                          <Text className="text-sm font-medium text-gray-800">{notification.name}</Text>
                        </View>
                        <View className="flex items-center gap-1 text-xs text-gray-500">
                          <Building size={12} color="#9ca3af" />
                          <Text>{notification.floor}楼 {notification.bed_number}号床 {getPositionLabel(notification.position)}</Text>
                        </View>
                      </View>
                      <View className="flex items-center gap-1 text-xs text-gray-400">
                        <Calendar size={10} color="#9ca3af" />
                        <Text>{formatTime(notification.created_at)}</Text>
                      </View>
                    </View>
                  </View>
                ))}
                <Button
                  className="w-full mt-3 bg-gray-100 hover:bg-gray-200"
                  onClick={handleClearNotifications}
                >
                  <Trash2 size={14} color="#6b7280" className="mr-1" />
                  <Text className="text-gray-600 text-sm">清空通知</Text>
                </Button>
              </View>
            )}
          </CardContent>
        )}
      </Card>

      {loading ? (
        <View className="flex justify-center items-center py-12">
          <Text className="text-gray-400">加载中...</Text>
        </View>
      ) : (
        <View className="space-y-4">
          {floorStats.map((floor) => (
            <Card key={floor.floor} className="overflow-hidden">
              <CardHeader className="pb-3">
                <View className="flex items-center gap-3">
                  <View className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Building size={20} color="#2563eb" />
                  </View>
                  <View>
                    <CardTitle className="text-lg">{floor.floor}楼</CardTitle>
                    <Text className="text-xs text-gray-500">
                      总床位: {floor.totalBeds} | 已入住: {floor.occupiedBeds} | 空床: {floor.emptyBeds}
                    </Text>
                  </View>
                </View>
              </CardHeader>
              <CardContent className="pt-0">
                <View className="flex gap-2">
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => handleFloorClick(floor.floor)}
                  >
                    <View className="flex items-center gap-1">
                      <Bed size={16} color="#fff" />
                      <Text className="text-white text-sm">入住</Text>
                    </View>
                  </Button>
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleRollCallClick(floor.floor)}
                  >
                    <View className="flex items-center gap-1">
                      <ClipboardCheck size={16} color="#fff" />
                      <Text className="text-white text-sm">点名</Text>
                    </View>
                  </Button>
                </View>
              </CardContent>
            </Card>
          ))}
        </View>
      )}
    </View>
  )
}

export default FloorPage
