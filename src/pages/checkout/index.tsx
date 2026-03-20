import { View, Text } from '@tarojs/components'
import { useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Network } from '@/network'
import { LogOut, Calendar, Bed, Building, User, ChevronDown, ChevronUp } from 'lucide-react-taro'
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
  const [expandedFloor, setExpandedFloor] = useState<number | null>(null)

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
        // 转换字段名
        const formattedRecords = res.data.data.map((record: any) => ({
          id: record.id,
          checkInId: record.check_in_id,
          bedId: record.bed_id,
          name: record.name,
          idCard: record.id_card,
          phone: record.phone,
          checkInTime: record.check_in_time,
          checkOutTime: record.check_out_time,
          floor: record.floor,
          bedNumber: record.bed_number,
          position: record.position
        }))
        setRecords(formattedRecords)
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
    // 点击名字跳转到个人信息页面，传递 checkOutId
    Taro.navigateTo({
      url: `/pages/detail/index?name=${encodeURIComponent(record.name)}&idCard=${encodeURIComponent(record.idCard)}&phone=${encodeURIComponent(record.phone)}&checkInTime=${encodeURIComponent(record.checkInTime)}&checkOutTime=${encodeURIComponent(record.checkOutTime)}&floor=${record.floor}&bedNumber=${record.bedNumber}&position=${record.position}&checkOutId=${record.id}`
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

  // 按楼层分组
  const groupedByFloor = records.reduce((acc, record) => {
    const floor = record.floor || 0
    if (!acc[floor]) {
      acc[floor] = []
    }
    acc[floor].push(record)
    return acc
  }, {} as Record<number, CheckOutRecord[]>)

  // 获取楼层列表并排序
  const floors = Object.keys(groupedByFloor)
    .map(Number)
    .sort((a, b) => a - b)

  const toggleFloor = (floor: number) => {
    setExpandedFloor(expandedFloor === floor ? null : floor)
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <Text className="text-lg font-semibold text-gray-800">搬离记录</Text>
        <Text className="text-xs text-gray-500 block mt-1">
          点击楼层查看搬离情况，共 {records.length} 条记录
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
          {floors.map((floor) => (
            <Card key={floor} className="overflow-hidden">
              <CardHeader 
                className="pb-3 bg-gray-50 cursor-pointer"
                onClick={() => toggleFloor(floor)}
              >
                <View className="flex items-center justify-between">
                  <View className="flex items-center gap-2">
                    <View className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <Building size={20} color="#f97316" />
                    </View>
                    <View>
                      <CardTitle className="text-lg">{floor}楼</CardTitle>
                      <Text className="text-xs text-gray-500">
                        {groupedByFloor[floor].length} 条搬离记录
                      </Text>
                    </View>
                  </View>
                  <View className="flex items-center">
                    {expandedFloor === floor ? (
                      <ChevronUp size={20} color="#6b7280" />
                    ) : (
                      <ChevronDown size={20} color="#6b7280" />
                    )}
                  </View>
                </View>
              </CardHeader>
              
              {expandedFloor === floor && (
                <CardContent className="p-3 space-y-3 border-t border-gray-200">
                  {groupedByFloor[floor].map((record) => (
                    <View
                      key={record.id}
                      className="bg-gray-50 rounded-lg p-3 border border-gray-100"
                    >
                      {/* 床位信息 */}
                      <View className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200">
                        <Bed size={14} color="#6b7280" />
                        <Text className="text-sm text-gray-700 font-medium">
                          {record.bedNumber || '-'}号床，{getPositionLabel(record.position)}
                        </Text>
                      </View>

                      {/* 人员信息 */}
                      <View className="space-y-2">
                        <View className="flex items-center justify-between">
                          <View className="flex items-center gap-1">
                            <User size={12} color="#9ca3af" />
                            <Text className="text-xs text-gray-500">姓名</Text>
                          </View>
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
                            <Text className="text-xs text-gray-500">入住日期</Text>
                          </View>
                          <Text className="text-xs text-gray-700">{formatDate(record.checkInTime)}</Text>
                        </View>

                        <View className="flex items-center justify-between">
                          <View className="flex items-center gap-1">
                            <LogOut size={12} color="#f97316" />
                            <Text className="text-xs text-gray-500">搬离日期</Text>
                          </View>
                          <Text className="text-xs text-orange-600">{formatDate(record.checkOutTime)}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </CardContent>
              )}
            </Card>
          ))}
        </View>
      )}
    </View>
  )
}

export default CheckOutPage
