import { View, Text } from '@tarojs/components'
import { useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Network } from '@/network'
import { LogOut, Calendar, Bed } from 'lucide-react-taro'
import './index.css'

interface CheckOutRecord {
  id: number
  checkInId: number
  bedId: number
  name: string
  idCard: string
  phone: string
  checkInTime: string
  checkOutTime: string
  floor?: number
  bedNumber?: number
  position?: string
}

const CheckOutPage = () => {
  const [records, setRecords] = useState<CheckOutRecord[]>([])
  const [loading, setLoading] = useState(true)


  useDidShow(() => {
    loadRecords()
  })

  const loadRecords = async () => {
    setLoading(true)
    try {
      const res = await Network.request({
        url: '/api/checkout/list'
      })

      console.log('搬离记录响应:', res.data)

      if (res.data?.code === 200 && res.data?.data) {
        setRecords(res.data.data)
      } else {
        setRecords([])
      }
    } catch (error) {
      console.error('加载搬离记录失败:', error)
      setRecords([])
    } finally {
      setLoading(false)
    }
  }

  const handleNameClick = (record: CheckOutRecord) => {
    // 点击名字跳转到个人信息页面
    Taro.navigateTo({
      url: `/pages/detail/index?name=${encodeURIComponent(record.name)}&idCard=${encodeURIComponent(record.idCard)}&phone=${encodeURIComponent(record.phone)}&checkInTime=${encodeURIComponent(record.checkInTime)}&checkOutTime=${encodeURIComponent(record.checkOutTime)}&floor=${record.floor}&bedNumber=${record.bedNumber}&position=${record.position}`
    })
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    try {
      const date = new Date(dateStr)
      return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
    } catch {
      return dateStr
    }
  }

  const getPositionLabel = (position?: string) => {
    if (!position) return '-'
    return position === 'upper' ? '上铺' : '下铺'
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <Text className="text-lg font-semibold text-gray-800">搬离记录</Text>
        <Text className="text-xs text-gray-500 block mt-1">
          共 {records.length} 条搬离记录
        </Text>
      </View>

      {loading ? (
        <View className="flex justify-center items-center py-12">
          <Text className="text-gray-400">加载中...</Text>
        </View>
      ) : records.length === 0 ? (
        <View className="flex flex-col items-center justify-center py-16">
          <LogOut size={48} color="#d1d5db" />
          <Text className="mt-3 text-sm text-gray-400">暂无搬离记录</Text>
        </View>
      ) : (
        <View className="p-4 space-y-3">
          {records.map((record) => (
            <Card 
              key={record.id} 
              className="overflow-hidden"
            >
              <CardContent className="p-4">
                <View className="flex items-center justify-between mb-3">
                  <View className="flex items-center gap-2">
                    <Bed size={16} color="#2563eb" />
                    <Text className="text-sm text-gray-600">
                      {record.bedNumber || '-'}号床 {getPositionLabel(record.position)}
                    </Text>
                  </View>
                  <Badge className="bg-orange-100 text-orange-600 text-xs">已搬离</Badge>
                </View>
                
                <View className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <View className="flex items-center justify-between">
                    <Text className="text-xs text-gray-500">姓名</Text>
                    <Text 
                      className="text-sm text-blue-600 font-medium"
                      onClick={() => handleNameClick(record)}
                    >
                      {record.name}
                    </Text>
                  </View>
                  <View className="flex items-center justify-between">
                    <View className="flex items-center gap-1">
                      <Calendar size={12} color="#9ca3af" />
                      <Text className="text-xs text-gray-500">入住</Text>
                    </View>
                    <Text className="text-xs text-gray-700">{formatDate(record.checkInTime)}</Text>
                  </View>
                  <View className="flex items-center justify-between">
                    <View className="flex items-center gap-1">
                      <LogOut size={12} color="#f97316" />
                      <Text className="text-xs text-gray-500">搬离</Text>
                    </View>
                    <Text className="text-xs text-orange-600">{formatDate(record.checkOutTime)}</Text>
                  </View>
                </View>
              </CardContent>
            </Card>
          ))}
        </View>
      )}


    </View>
  )
}

export default CheckOutPage
