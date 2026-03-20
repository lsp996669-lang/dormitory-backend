import { View, Text } from '@tarojs/components'
import { useRouter } from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { User, Phone, CreditCard, Calendar, LogOut, Bed } from 'lucide-react-taro'
import './index.css'

const DetailPage = () => {
  const router = useRouter()
  const { name, idCard, phone, checkInTime, checkOutTime, floor, bedNumber, position } = router.params

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    try {
      const date = new Date(decodeURIComponent(dateStr))
      return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
    } catch {
      return decodeURIComponent(dateStr || '-')
    }
  }

  const getPositionLabel = (pos?: string) => {
    if (!pos) return '-'
    const decoded = decodeURIComponent(pos)
    return decoded === 'upper' ? '上铺' : '下铺'
  }

  const decodedName = name ? decodeURIComponent(name) : '-'
  const decodedIdCard = idCard ? decodeURIComponent(idCard) : '-'
  const decodedPhone = phone ? decodeURIComponent(phone) : '-'
  const hasCheckOut = checkOutTime && checkOutTime !== 'undefined'

  return (
    <View className="min-h-screen bg-gray-50 p-4">
      <Card className="overflow-hidden">
        <View className="bg-blue-600 px-4 py-6 text-center">
          <View className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-3">
            <User size={32} color="#2563eb" />
          </View>
          <Text className="text-xl font-bold text-white block">{decodedName}</Text>
          {hasCheckOut && (
            <View className="mt-2">
              <Text className="text-xs text-blue-200">已搬离</Text>
            </View>
          )}
        </View>
        <CardContent className="p-4">
          <View className="space-y-4">
            <View className="flex items-center gap-3">
              <Bed size={20} color="#6b7280" />
              <View>
                <Text className="text-xs text-gray-500 block">床位信息</Text>
                <Text className="text-sm text-gray-800">
                  {floor ? decodeURIComponent(floor as string) : '-'}楼 {bedNumber ? decodeURIComponent(bedNumber as string) : '-'}号床 {getPositionLabel(position)}
                </Text>
              </View>
            </View>

            <View className="flex items-center gap-3">
              <CreditCard size={20} color="#6b7280" />
              <View>
                <Text className="text-xs text-gray-500 block">身份证号</Text>
                <Text className="text-sm text-gray-800">{decodedIdCard}</Text>
              </View>
            </View>

            <View className="flex items-center gap-3">
              <Phone size={20} color="#6b7280" />
              <View>
                <Text className="text-xs text-gray-500 block">手机号</Text>
                <Text className="text-sm text-gray-800">{decodedPhone}</Text>
              </View>
            </View>

            <View className="flex items-center gap-3">
              <Calendar size={20} color="#6b7280" />
              <View>
                <Text className="text-xs text-gray-500 block">入住时间</Text>
                <Text className="text-sm text-gray-800">{formatDate(checkInTime)}</Text>
              </View>
            </View>

            {hasCheckOut && (
              <View className="flex items-center gap-3">
                <LogOut size={20} color="#f97316" />
                <View>
                  <Text className="text-xs text-gray-500 block">搬离时间</Text>
                  <Text className="text-sm text-orange-600">{formatDate(checkOutTime)}</Text>
                </View>
              </View>
            )}
          </View>
        </CardContent>
      </Card>
    </View>
  )
}

export default DetailPage
