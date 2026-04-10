import { View, Text, Picker } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Network } from '@/network'
import { User, Check, X, Users } from 'lucide-react-taro'
import './index.css'

// 检查登录状态的工具函数
const checkLogin = (): boolean => {
  const userInfo = Taro.getStorageSync('userInfo')
  return !!userInfo
}

// 提示登录
const promptLogin = () => {
  Taro.showModal({
    title: '提示',
    content: '此功能需要登录后才能使用，是否立即登录？',
    confirmText: '去登录',
    cancelText: '取消',
    success: (res) => {
      if (res.confirm) {
        Taro.navigateTo({ url: '/pages/login/index' })
      }
    }
  })
}

interface RollCallItem {
  checkInId: number
  bedId: number
  bedNumber: number
  position: string
  name: string
  idCard: string
  phone: string
  checkInTime: string
  rollCallId: number | null
  status: 'present' | 'absent' | null
  remark: string | null
  rollCallTime: string | null
  dormitory?: string
}

interface RollCallStats {
  date: string
  floor: number
  totalPeople: number
  presentCount: number
  absentCount: number
  notCheckedCount: number
}

const RollCallPage = () => {
  const router = useRouter()
  const { floor: floorParam, dormitory: dormitoryParam } = router.params
  const floor = parseInt(floorParam || '2', 10)
  const dormitory = dormitoryParam || undefined

  const [rollCallList, setRollCallList] = useState<RollCallItem[]>([])
  const [stats, setStats] = useState<RollCallStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  })

  useEffect(() => {
    loadRollCallData()
  }, [floor, dormitory, selectedDate])

  const loadRollCallData = async () => {
    setLoading(true)
    try {
      // 构建查询参数
      const listParams: { floor: number; date?: string; dormitory?: string } = { floor, date: selectedDate }
      const statsParams: { floor: number; date?: string; dormitory?: string } = { floor, date: selectedDate }

      // 如果指定了宿舍，添加到参数中
      if (dormitory) {
        listParams.dormitory = dormitory
        statsParams.dormitory = dormitory
      }

      // 并行加载列表和统计
      const [listRes, statsRes] = await Promise.all([
        Network.request({
          url: '/api/rollcall/list',
          data: listParams
        }),
        Network.request({
          url: '/api/rollcall/stats',
          data: statsParams
        })
      ])

      console.log('[RollCall] 点名列表响应:', listRes.data)
      console.log('[RollCall] 点名统计响应:', statsRes.data)

      if (listRes.data?.code === 200 && listRes.data?.data) {
        setRollCallList(listRes.data.data)
        // 保存到本地缓存
        const cacheKey = `rollcall_${floor}_${selectedDate}`
        Taro.setStorageSync(cacheKey, listRes.data.data)
        console.log('[RollCall] 数据已缓存到本地:', cacheKey)
      }

      if (statsRes.data?.code === 200 && statsRes.data?.data) {
        setStats(statsRes.data.data)
        // 保存统计到本地缓存
        const statsCacheKey = `rollcall_stats_${floor}_${selectedDate}`
        Taro.setStorageSync(statsCacheKey, statsRes.data.data)
      }
    } catch (error) {
      console.error('[RollCall] 加载点名数据失败:', error)
      // 尝试从本地缓存加载
      const cacheKey = `rollcall_${floor}_${selectedDate}`
      const statsCacheKey = `rollcall_stats_${floor}_${selectedDate}`
      const cachedList = Taro.getStorageSync(cacheKey)
      const cachedStats = Taro.getStorageSync(statsCacheKey)
      
      if (cachedList && cachedList.length > 0) {
        console.log('[RollCall] 使用本地缓存数据')
        setRollCallList(cachedList)
        if (cachedStats) {
          setStats(cachedStats)
        }
        Taro.showToast({ title: '网络不可用，显示离线数据', icon: 'none', duration: 3000 })
      } else {
        Taro.showToast({ title: '加载失败，请检查网络连接', icon: 'none' })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleMarkRollCall = async (item: RollCallItem, status: 'present' | 'absent') => {
    // 检查登录状态
    if (!checkLogin()) {
      promptLogin()
      return
    }
    
    setSubmitting(true)
    try {
      const res = await Network.request({
        url: '/api/rollcall/mark',
        method: 'POST',
        data: {
          floor,
          checkInId: item.checkInId,
          name: item.name,
          status
        }
      })

      console.log('点名响应:', res.data)

      if (res.data?.code === 200) {
        // 更新本地状态
        setRollCallList(prev =>
          prev.map(p =>
            p.checkInId === item.checkInId
              ? { ...p, status, rollCallTime: new Date().toISOString() }
              : p
          )
        )
        
        // 更新统计
        loadRollCallData()
        
        Taro.showToast({
          title: status === 'present' ? '已标记在场' : '已标记缺席',
          icon: 'success',
          duration: 1000
        })
      } else {
        Taro.showToast({ title: res.data?.msg || '点名失败', icon: 'none' })
      }
    } catch (error) {
      console.error('点名失败:', error)
      Taro.showToast({ title: '点名失败', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleBatchRollCall = async (status: 'present' | 'absent') => {
    // 检查登录状态
    if (!checkLogin()) {
      promptLogin()
      return
    }
    
    // 只对未点名的人员进行批量操作
    const uncheckedItems = rollCallList.filter(item => !item.status)
    
    if (uncheckedItems.length === 0) {
      Taro.showToast({ title: '没有需要点名的人员', icon: 'none' })
      return
    }

    setSubmitting(true)
    try {
      const res = await Network.request({
        url: '/api/rollcall/batch',
        method: 'POST',
        data: {
          floor,
          items: uncheckedItems.map(item => ({
            checkInId: item.checkInId,
            name: item.name,
            status
          }))
        }
      })

      console.log('批量点名响应:', res.data)

      if (res.data?.code === 200) {
        loadRollCallData()
        Taro.showToast({
          title: `已批量标记${status === 'present' ? '在场' : '缺席'}`,
          icon: 'success'
        })
      } else {
        Taro.showToast({ title: res.data?.msg || '批量点名失败', icon: 'none' })
      }
    } catch (error) {
      console.error('批量点名失败:', error)
      Taro.showToast({ title: '批量点名失败', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  const getPositionLabel = (position: string) => {
    return position === 'upper' ? '上铺' : '下铺'
  }

  const presentCount = rollCallList.filter(item => item.status === 'present').length
  const absentCount = rollCallList.filter(item => item.status === 'absent').length
  const uncheckedCount = rollCallList.filter(item => !item.status).length

  return (
    <View className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex items-center justify-between">
          <View>
            <Text className="text-lg font-semibold text-gray-800">
              {dormitory === 'nanTwo' ? '南二巷' : '南四巷'} {floor}楼 - 点名
            </Text>
            <Text className="text-xs text-gray-500 block mt-1">
              {selectedDate}
            </Text>
          </View>
          <Picker
            mode="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.detail.value)}
          >
            <Button variant="outline" size="sm">
              <Text>选择日期</Text>
            </Button>
          </Picker>
        </View>
      </View>

      {/* 统计卡片 */}
      <View className="p-4">
        <View className="bg-white rounded-lg border border-gray-200 p-4">
          <View className="flex items-center gap-2 mb-3">
            <Users size={18} color="#3b82f6" />
            <Text className="text-sm font-medium text-gray-700">点名统计</Text>
          </View>
          <View className="grid grid-cols-4 gap-2 text-center">
            <View className="bg-gray-50 rounded-lg py-2">
              <Text className="text-lg font-bold text-gray-800">{stats?.totalPeople || rollCallList.length}</Text>
              <Text className="text-xs text-gray-500">总人数</Text>
            </View>
            <View className="bg-green-50 rounded-lg py-2">
              <Text className="text-lg font-bold text-green-600">{presentCount}</Text>
              <Text className="text-xs text-gray-500">在场</Text>
            </View>
            <View className="bg-red-50 rounded-lg py-2">
              <Text className="text-lg font-bold text-red-600">{absentCount}</Text>
              <Text className="text-xs text-gray-500">缺席</Text>
            </View>
            <View className="bg-gray-50 rounded-lg py-2">
              <Text className="text-lg font-bold text-gray-600">{uncheckedCount}</Text>
              <Text className="text-xs text-gray-500">未点名</Text>
            </View>
          </View>

          {/* 批量操作按钮 */}
          <View className="flex gap-2 mt-3">
            <Button
              size="sm"
              className="flex-1 bg-green-500 hover:bg-green-600 text-white"
              onClick={() => handleBatchRollCall('present')}
              disabled={submitting || uncheckedCount === 0}
            >
              <Check size={14} color="#fff" className="mr-1" />
              <Text>全部在场</Text>
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              onClick={() => handleBatchRollCall('absent')}
              disabled={submitting || uncheckedCount === 0}
            >
              <X size={14} color="#fff" className="mr-1" />
              <Text>全部缺席</Text>
            </Button>
          </View>
        </View>
      </View>

      {/* 人员列表 */}
      <View className="px-4">
        {loading ? (
          <View className="flex justify-center items-center py-12">
            <Text className="text-gray-400">加载中...</Text>
          </View>
        ) : rollCallList.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-12">
            <Users size={48} color="#d1d5db" />
            <Text className="mt-3 text-sm text-gray-400">暂无入住人员</Text>
          </View>
        ) : (
          <View className="space-y-3">
            {rollCallList.map((item) => (
              <View
                key={item.checkInId}
                className="bg-white rounded-lg border border-gray-200 p-3"
              >
                <View className="flex items-center justify-between">
                  <View className="flex items-center gap-3">
                    <View
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        item.status === 'present'
                          ? 'bg-green-100'
                          : item.status === 'absent'
                          ? 'bg-red-100'
                          : 'bg-gray-100'
                      }`}
                    >
                      <User
                        size={20}
                        color={
                          item.status === 'present'
                            ? '#22c55e'
                            : item.status === 'absent'
                            ? '#ef4444'
                            : '#9ca3af'
                        }
                      />
                    </View>
                    <View>
                      <View className="flex items-center gap-2">
                        <Text className="text-sm font-medium text-gray-800">{item.name}</Text>
                        {item.status && (
                          <Badge
                            className={`text-xs ${
                              item.status === 'present'
                                ? 'bg-green-500 text-white'
                                : 'bg-red-500 text-white'
                            }`}
                          >
                            {item.status === 'present' ? '在场' : '缺席'}
                          </Badge>
                        )}
                      </View>
                      <Text className="text-xs text-gray-500">
                        {item.bedNumber}号床 {getPositionLabel(item.position)}
                      </Text>
                    </View>
                  </View>

                  {/* 操作按钮 */}
                  <View className="flex gap-2">
                    <Button
                      size="sm"
                      className={`${
                        item.status === 'present'
                          ? 'bg-green-500'
                          : 'bg-gray-100 hover:bg-green-100'
                      }`}
                      onClick={() => handleMarkRollCall(item, 'present')}
                      disabled={submitting}
                    >
                      <Check
                        size={16}
                        color={item.status === 'present' ? '#fff' : '#22c55e'}
                      />
                    </Button>
                    <Button
                      size="sm"
                      className={`${
                        item.status === 'absent'
                          ? 'bg-red-500'
                          : 'bg-gray-100 hover:bg-red-100'
                      }`}
                      onClick={() => handleMarkRollCall(item, 'absent')}
                      disabled={submitting}
                    >
                      <X
                        size={16}
                        color={item.status === 'absent' ? '#fff' : '#ef4444'}
                      />
                    </Button>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* 底部留白 */}
      <View className="h-8" />
    </View>
  )
}

export default RollCallPage
