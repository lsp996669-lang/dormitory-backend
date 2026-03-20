import { View, Text } from '@tarojs/components'
import { useState } from 'react'
import { useDidShow } from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Network } from '@/network'
import { LogOut, Calendar, User, Phone, CreditCard, Bed } from 'lucide-react-taro'
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
  const [selectedRecord, setSelectedRecord] = useState<CheckOutRecord | null>(null)
  const [showDetail, setShowDetail] = useState(false)

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

  const handleRecordClick = (record: CheckOutRecord) => {
    setSelectedRecord(record)
    setShowDetail(true)
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    try {
      const date = new Date(dateStr)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
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
              className="cursor-pointer active:bg-gray-50"
              onClick={() => handleRecordClick(record)}
            >
              <CardContent className="p-4">
                <View className="flex items-center justify-between mb-2">
                  <View className="flex items-center gap-2">
                    <User size={16} color="#2563eb" />
                    <Text className="font-semibold text-gray-800">{record.name}</Text>
                  </View>
                  <Badge className="bg-orange-100 text-orange-600 text-xs">已搬离</Badge>
                </View>
                <View className="space-y-1">
                  <View className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar size={12} color="#9ca3af" />
                    <Text>入住: {formatDate(record.checkInTime)}</Text>
                  </View>
                  <View className="flex items-center gap-2 text-xs text-gray-500">
                    <LogOut size={12} color="#9ca3af" />
                    <Text>搬离: {formatDate(record.checkOutTime)}</Text>
                  </View>
                </View>
              </CardContent>
            </Card>
          ))}
        </View>
      )}

      {/* 详情弹窗 */}
      {showDetail && selectedRecord && (
        <View 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end"
          onClick={() => setShowDetail(false)}
        >
          <View 
            className="bg-white w-full rounded-t-2xl p-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <View className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
              <Text className="text-lg font-semibold text-gray-800">人员详情</Text>
              <Text 
                className="text-blue-600 text-sm"
                onClick={() => setShowDetail(false)}
              >
                关闭
              </Text>
            </View>

            <View className="space-y-4">
              <View className="bg-blue-50 rounded-lg p-3">
                <View className="flex items-center gap-2 mb-2">
                  <User size={16} color="#2563eb" />
                  <Text className="font-semibold text-blue-800">{selectedRecord.name}</Text>
                </View>
                <View className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <View className="flex items-center gap-1">
                    <Bed size={14} color="#6b7280" />
                    <Text>{selectedRecord.floor || '-'}楼</Text>
                  </View>
                  <View>
                    <Text>{selectedRecord.bedNumber || '-'}号床 {getPositionLabel(selectedRecord.position)}</Text>
                  </View>
                </View>
              </View>

              <View className="space-y-3">
                <View className="flex items-start gap-3">
                  <CreditCard size={16} color="#9ca3af" className="flex-shrink-0 mt-1" />
                  <View>
                    <Text className="text-xs text-gray-500 block">身份证号</Text>
                    <Text className="text-sm text-gray-800">{selectedRecord.idCard}</Text>
                  </View>
                </View>

                <View className="flex items-start gap-3">
                  <Phone size={16} color="#9ca3af" className="flex-shrink-0 mt-1" />
                  <View>
                    <Text className="text-xs text-gray-500 block">手机号</Text>
                    <Text className="text-sm text-gray-800">{selectedRecord.phone}</Text>
                  </View>
                </View>

                <View className="flex items-start gap-3">
                  <Calendar size={16} color="#9ca3af" className="flex-shrink-0 mt-1" />
                  <View>
                    <Text className="text-xs text-gray-500 block">入住时间</Text>
                    <Text className="text-sm text-gray-800">{formatDate(selectedRecord.checkInTime)}</Text>
                  </View>
                </View>

                <View className="flex items-start gap-3">
                  <LogOut size={16} color="#9ca3af" className="flex-shrink-0 mt-1" />
                  <View>
                    <Text className="text-xs text-gray-500 block">搬离时间</Text>
                    <Text className="text-sm text-gray-800">{formatDate(selectedRecord.checkOutTime)}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

export default CheckOutPage
