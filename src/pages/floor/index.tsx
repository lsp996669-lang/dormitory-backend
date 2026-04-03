import { View, Text } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building, Bed, Bell, BellRing, User, Calendar, Trash2, ClipboardCheck, Wifi, WifiOff, RefreshCw, House, ChevronDown, ChevronUp } from 'lucide-react-taro'
import { Network } from '@/network'
import './index.css'

interface FloorStats {
  floor: number
  totalBeds: number
  occupiedBeds: number
  emptyBeds: number
  maintenanceBeds: number
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

interface NanTwoFloorStats {
  floor: number
  totalBeds: number
  occupiedBeds: number
  emptyBeds: number
  maintenanceBeds: number
  rooms: string[]
}

const FloorPage = () => {
  const [floorStats, setFloorStats] = useState<FloorStats[]>([])
  const [loading, setLoading] = useState(true)
  const [notificationCount, setNotificationCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [expandedDormitory, setExpandedDormitory] = useState(true) // 南四巷180号宿舍展开状态
  const [expandedNanTwo, setExpandedNanTwo] = useState(false) // 南二巷宿舍展开状态
  const [nanTwoFloorStats, setNanTwoFloorStats] = useState<NanTwoFloorStats[]>([]) // 南二巷楼层统计
  const [nanTwoStats, setNanTwoStats] = useState({ totalBeds: 0, occupiedBeds: 0, emptyBeds: 0, maintenanceBeds: 0 }) // 南二巷统计

  // 检查服务器状态
  const checkServerStatus = async () => {
    try {
      const res = await Network.request({
        url: '/api/export/stats',
        method: 'GET',
      })
      if (res.statusCode === 200) {
        setServerStatus('online')
      } else {
        setServerStatus('offline')
      }
    } catch (error) {
      setServerStatus('offline')
    }
  }

  // 定时检查服务器状态
  useEffect(() => {
    checkServerStatus()
    const timer = setInterval(checkServerStatus, 60000) // 每分钟检查一次
    return () => clearInterval(timer)
  }, [])

  useDidShow(() => {
    checkAuth()
    loadFloorStats()
    loadNotificationCount()
    loadNanTwoFloorStats()
  })

  usePullDownRefresh(() => {
    console.log('[Floor] 触发下拉刷新')
    Promise.all([loadFloorStats(), loadNotificationCount(), loadNanTwoFloorStats()])
      .finally(() => {
        Taro.stopPullDownRefresh()
      })
  })

  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const checkAuth = () => {
    const userInfo = Taro.getStorageSync('userInfo')
    setIsLoggedIn(!!userInfo)
    // 不强制跳转登录页，允许用户先浏览
  }

  // 加载南二巷楼层统计
  const loadNanTwoFloorStats = async () => {
    try {
      const res = await Network.request({
        url: '/api/floors/nantwo/floor-stats'
      })
      if (res.data?.code === 200 && res.data?.data) {
        setNanTwoFloorStats(res.data.data)
        // 计算总计
        const total = res.data.data.reduce((sum: number, f: NanTwoFloorStats) => sum + f.totalBeds, 0)
        const occupied = res.data.data.reduce((sum: number, f: NanTwoFloorStats) => sum + f.occupiedBeds, 0)
        const maintenance = res.data.data.reduce((sum: number, f: NanTwoFloorStats) => sum + (f.maintenanceBeds || 0), 0)
        setNanTwoStats({
          totalBeds: total,
          occupiedBeds: occupied,
          emptyBeds: total - occupied - maintenance,
          maintenanceBeds: maintenance
        })
      }
    } catch (error) {
      console.error('[Floor] 加载南二巷楼层统计失败:', error)
    }
  }

  const loadFloorStats = async () => {
    setLoading(true)
    try {
      console.log('[Floor] 开始加载楼层统计数据...')
      
      const res = await Network.request({
        url: '/api/floors/stats'
      })

      console.log('[Floor] 楼层统计响应:', res)
      console.log('[Floor] 响应状态码:', res.statusCode)
      console.log('[Floor] 响应数据:', res.data)

      if (res.statusCode !== 200) {
        console.error('[Floor] 请求失败，状态码:', res.statusCode)
        // 尝试从本地缓存加载
        const cachedData = Taro.getStorageSync('floorStats')
        if (cachedData && cachedData.length > 0) {
          console.log('[Floor] 使用本地缓存数据')
          setFloorStats(cachedData)
          Taro.showToast({ title: '使用离线数据', icon: 'none' })
        } else {
          Taro.showToast({ title: `请求失败: ${res.statusCode}`, icon: 'none' })
          setFloorStats([])
        }
        return
      }

      if (res.data?.code === 200 && res.data?.data) {
        // 过滤掉1楼，只显示2-4楼
        const floors = res.data.data.filter((f: FloorStats) => f.floor >= 2)
        console.log(`[Floor] 过滤后的楼层数据: ${floors.length} 个楼层`)
        setFloorStats(floors)
        // 保存到本地缓存
        Taro.setStorageSync('floorStats', floors)
        console.log('[Floor] 数据已缓存到本地')
      } else {
        console.error('[Floor] 响应数据格式错误:', res.data)
        // 尝试从本地缓存加载
        const cachedData = Taro.getStorageSync('floorStats')
        if (cachedData && cachedData.length > 0) {
          console.log('[Floor] 使用本地缓存数据')
          setFloorStats(cachedData)
        } else {
          setFloorStats([])
        }
      }
    } catch (error) {
      console.error('[Floor] 加载楼层统计失败:', error)
      // 尝试从本地缓存加载
      const cachedData = Taro.getStorageSync('floorStats')
      if (cachedData && cachedData.length > 0) {
        console.log('[Floor] 网络错误，使用本地缓存数据')
        setFloorStats(cachedData)
        Taro.showToast({ title: '网络不可用，显示离线数据', icon: 'none', duration: 3000 })
      } else {
        Taro.showToast({ title: '网络请求失败，请检查网络连接', icon: 'none', duration: 3000 })
        setFloorStats([])
      }
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
    if (!isLoggedIn) {
      Taro.showModal({
        title: '提示',
        content: '请先登录后再进行入住操作',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            Taro.navigateTo({ url: '/pages/login/index' })
          }
        }
      })
      return
    }
    Taro.navigateTo({
      url: `/pages/checkin/index?floor=${floor}`
    })
  }

  const handleRollCallClick = (floor: number) => {
    if (!isLoggedIn) {
      Taro.showModal({
        title: '提示',
        content: '请先登录后再进行点名操作',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            Taro.navigateTo({ url: '/pages/login/index' })
          }
        }
      })
      return
    }
    Taro.navigateTo({
      url: `/pages/rollcall/index?floor=${floor}`
    })
  }

  // 南二巷楼层入住
  const handleNanTwoFloorClick = (floor: number) => {
    if (!isLoggedIn) {
      Taro.showModal({
        title: '提示',
        content: '请先登录后再进行入住操作',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            Taro.navigateTo({ url: '/pages/login/index' })
          }
        }
      })
      return
    }
    Taro.navigateTo({
      url: `/pages/checkin/index?dormitory=nanTwo&floor=${floor}`
    })
  }

  // 南二巷楼层点名
  const handleNanTwoRollCallClick = (floor: number) => {
    if (!isLoggedIn) {
      Taro.showModal({
        title: '提示',
        content: '请先登录后再进行点名操作',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            Taro.navigateTo({ url: '/pages/login/index' })
          }
        }
      })
      return
    }
    Taro.navigateTo({
      url: `/pages/rollcall/index?dormitory=nanTwo&floor=${floor}`
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
      <View className="mb-4">
        <View className="flex items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-gray-800 block">宿舍管理</Text>
            <Text className="text-sm text-gray-500 block mt-1">选择楼层进行入住登记</Text>
          </View>
          {/* 用户登录状态 */}
          <View 
            className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer"
            style={{ backgroundColor: isLoggedIn ? '#dcfce7' : '#fef3c7' }}
            onClick={() => {
              if (isLoggedIn) {
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
              } else {
                Taro.navigateTo({ url: '/pages/login/index' })
              }
            }}
          >
            {isLoggedIn ? (
              <>
                <User size={16} color="#16a34a" />
                <Text className="text-xs" style={{ color: '#16a34a' }}>已登录</Text>
              </>
            ) : (
              <>
                <User size={16} color="#d97706" />
                <Text className="text-xs" style={{ color: '#d97706' }}>点击登录</Text>
              </>
            )}
          </View>
        </View>
      </View>

      {/* 未登录提示 */}
      {!isLoggedIn && (
        <Card className="overflow-hidden mb-4 border-2 border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <View className="flex items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <User size={20} color="#d97706" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-amber-800">您可以先浏览系统功能</Text>
                <Text className="text-xs text-amber-600 mt-1">
                  需要入住、搬离等操作时再登录即可
                </Text>
              </View>
              <Button
                size="sm"
                className="bg-amber-600 text-white"
                onClick={() => Taro.navigateTo({ url: '/pages/login/index' })}
              >
                登录
              </Button>
            </View>
          </CardContent>
        </Card>
      )}

      {/* 服务状态指示器 */}
      <View className="mb-4">
        <View 
          className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer inline-flex"
          style={{ backgroundColor: serverStatus === 'online' ? '#dcfce7' : serverStatus === 'offline' ? '#fee2e2' : '#fef3c7' }}
          onClick={checkServerStatus}
        >
          {serverStatus === 'online' ? (
            <>
              <Wifi size={16} color="#16a34a" />
              <Text className="text-xs" style={{ color: '#16a34a' }}>服务正常</Text>
            </>
          ) : serverStatus === 'offline' ? (
            <>
              <WifiOff size={16} color="#dc2626" />
              <Text className="text-xs" style={{ color: '#dc2626' }}>服务离线</Text>
            </>
          ) : (
            <>
              <RefreshCw size={16} color="#d97706" />
              <Text className="text-xs" style={{ color: '#d97706' }}>检测中...</Text>
            </>
          )}
        </View>
      </View>

      {/* 服务离线提示 */}
      {serverStatus === 'offline' && (
        <Card className="overflow-hidden mb-4 border-2 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <View className="flex items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <WifiOff size={20} color="#dc2626" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-red-800">后端服务已断开</Text>
                <Text className="text-xs text-red-600 mt-1">
                  请保持开发网页打开，或刷新此页面重新连接
                </Text>
              </View>
              <Button
                size="sm"
                className="bg-red-600 text-white"
                onClick={checkServerStatus}
              >
                <RefreshCw size={14} color="#fff" />
              </Button>
            </View>
          </CardContent>
        </Card>
      )}

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
          {/* 南四巷180号宿舍 */}
          <Card className="overflow-hidden border-2 border-blue-200">
            <CardHeader 
              className="pb-3 bg-blue-50 cursor-pointer"
              onClick={() => setExpandedDormitory(!expandedDormitory)}
            >
              <View className="flex items-center justify-between">
                <View className="flex items-center gap-3">
                  <View className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <House size={20} color="#2563eb" />
                  </View>
                  <View>
                    <CardTitle className="text-lg">南四巷180号宿舍</CardTitle>
                    <Text className="text-xs text-gray-500">
                      总床位: 80 | 
                      已入住: {floorStats.reduce((sum, f) => sum + f.occupiedBeds, 0)} | 
                      空床: {80 - floorStats.reduce((sum, f) => sum + f.occupiedBeds, 0)}
                    </Text>
                  </View>
                </View>
                <View className="flex items-center">
                  {expandedDormitory ? (
                    <ChevronUp size={20} color="#6b7280" />
                  ) : (
                    <ChevronDown size={20} color="#6b7280" />
                  )}
                </View>
              </View>
            </CardHeader>
            {expandedDormitory && (
              <CardContent className="p-4 space-y-3">
                {floorStats.map((floor) => (
                  <View 
                    key={floor.floor} 
                    className="bg-gray-50 rounded-lg p-3 border border-gray-100"
                  >
                    <View className="flex items-center justify-between">
                      <View className="flex items-center gap-3">
                        <View className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <Building size={16} color="#2563eb" />
                        </View>
                        <View>
                          <Text className="text-base font-medium text-gray-800">{floor.floor}楼</Text>
                          <Text className="text-xs text-gray-500">
                            总床位: {floor.totalBeds} | 已入住: {floor.occupiedBeds} | 空床: {floor.emptyBeds}{floor.maintenanceBeds > 0 ? ` | 维修: ${floor.maintenanceBeds}` : ''}
                          </Text>
                        </View>
                      </View>
                      <View className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => handleFloorClick(floor.floor)}
                        >
                          <View className="flex items-center gap-1">
                            <Bed size={14} color="#fff" />
                            <Text className="text-white text-xs">入住</Text>
                          </View>
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleRollCallClick(floor.floor)}
                        >
                          <View className="flex items-center gap-1">
                            <ClipboardCheck size={14} color="#fff" />
                            <Text className="text-white text-xs">点名</Text>
                          </View>
                        </Button>
                      </View>
                    </View>
                  </View>
                ))}
              </CardContent>
            )}
          </Card>

          {/* 南二巷宿舍 */}
          <Card className="overflow-hidden border-2 border-purple-200">
            <CardHeader 
              className="pb-3 bg-purple-50 cursor-pointer"
              onClick={() => setExpandedNanTwo(!expandedNanTwo)}
            >
              <View className="flex items-center justify-between">
                <View className="flex items-center gap-3">
                  <View className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <House size={20} color="#9333ea" />
                  </View>
                  <View>
                    <CardTitle className="text-lg">南二巷24号宿舍</CardTitle>
                    <Text className="text-xs text-gray-500">
                      总床位: {nanTwoStats.totalBeds} | 
                      已入住: {nanTwoStats.occupiedBeds} | 
                      空床: {nanTwoStats.emptyBeds}{nanTwoStats.maintenanceBeds > 0 ? ` | 维修: ${nanTwoStats.maintenanceBeds}` : ''}
                    </Text>
                  </View>
                </View>
                <View className="flex items-center">
                  {expandedNanTwo ? (
                    <ChevronUp size={20} color="#6b7280" />
                  ) : (
                    <ChevronDown size={20} color="#6b7280" />
                  )}
                </View>
              </View>
            </CardHeader>
            {expandedNanTwo && (
              <CardContent className="p-4 space-y-3">
                {nanTwoFloorStats.map((floor) => (
                  <View 
                    key={floor.floor} 
                    className="bg-gray-50 rounded-lg p-3 border border-gray-100"
                  >
                    <View className="flex items-center justify-between">
                      <View className="flex items-center gap-3">
                        <View className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                          <Building size={16} color="#9333ea" />
                        </View>
                        <View>
                          <Text className="text-base font-medium text-gray-800">{floor.floor}楼</Text>
                          <Text className="text-xs text-gray-500">
                            总床位: {floor.totalBeds} | 已入住: {floor.occupiedBeds} | 空床: {floor.emptyBeds}{floor.maintenanceBeds > 0 ? ` | 维修: ${floor.maintenanceBeds}` : ''}
                          </Text>
                        </View>
                      </View>
                      <View className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                          onClick={() => handleNanTwoFloorClick(floor.floor)}
                        >
                          <View className="flex items-center gap-1">
                            <Bed size={14} color="#fff" />
                            <Text className="text-white text-xs">入住</Text>
                          </View>
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleNanTwoRollCallClick(floor.floor)}
                        >
                          <View className="flex items-center gap-1">
                            <ClipboardCheck size={14} color="#fff" />
                            <Text className="text-white text-xs">点名</Text>
                          </View>
                        </Button>
                      </View>
                    </View>
                  </View>
                ))}
              </CardContent>
            )}
          </Card>
        </View>
      )}
    </View>
  )
}

export default FloorPage
