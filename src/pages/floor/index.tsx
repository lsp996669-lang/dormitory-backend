import { View, Text } from '@tarojs/components'
import { useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building, Bed, LogOut } from 'lucide-react-taro'
import { Network } from '@/network'
import './index.css'

interface FloorStats {
  floor: number
  totalBeds: number
  occupiedBeds: number
  emptyBeds: number
}

const FloorPage = () => {
  const [floorStats, setFloorStats] = useState<FloorStats[]>([])
  const [loading, setLoading] = useState(true)

  useDidShow(() => {
    checkAuth()
    loadFloorStats()
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
        setFloorStats(res.data.data)
      } else {
        // 如果后端未返回数据，使用默认数据
        setFloorStats([
          { floor: 1, totalBeds: 30, occupiedBeds: 0, emptyBeds: 30 },
          { floor: 2, totalBeds: 30, occupiedBeds: 0, emptyBeds: 30 },
          { floor: 3, totalBeds: 30, occupiedBeds: 0, emptyBeds: 30 },
          { floor: 4, totalBeds: 30, occupiedBeds: 0, emptyBeds: 30 },
        ])
      }
    } catch (error) {
      console.error('加载楼层统计失败:', error)
      // 使用默认数据
      setFloorStats([
        { floor: 1, totalBeds: 30, occupiedBeds: 0, emptyBeds: 30 },
        { floor: 2, totalBeds: 30, occupiedBeds: 0, emptyBeds: 30 },
        { floor: 3, totalBeds: 30, occupiedBeds: 0, emptyBeds: 30 },
        { floor: 4, totalBeds: 30, occupiedBeds: 0, emptyBeds: 30 },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleFloorClick = (floor: number, type: 'checkin' | 'checkout') => {
    Taro.navigateTo({
      url: `/pages/checkin/index?floor=${floor}&type=${type}`
    })
  }

  return (
    <View className="min-h-screen bg-gray-50 p-4">
      <View className="mb-6">
        <Text className="text-2xl font-bold text-gray-800 block">宿舍管理</Text>
        <Text className="text-sm text-gray-500 block mt-1">选择楼层进行入住或搬离操作</Text>
      </View>

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
                <View className="flex gap-3">
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => handleFloorClick(floor.floor, 'checkin')}
                  >
                    <View className="flex items-center gap-2">
                      <Bed size={18} color="#fff" />
                      <Text className="text-white text-sm">入住登记</Text>
                    </View>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-orange-500 text-orange-500 hover:bg-orange-50"
                    onClick={() => handleFloorClick(floor.floor, 'checkout')}
                  >
                    <View className="flex items-center gap-2">
                      <LogOut size={18} color="#f97316" />
                      <Text className="text-orange-500 text-sm">搬离登记</Text>
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
