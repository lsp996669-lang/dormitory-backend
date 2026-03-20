import { View, Text, Picker } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { User, Phone, CreditCard, Calendar, LogOut, Bed } from 'lucide-react-taro'
import { Network } from '@/network'
import './index.css'

const DetailPage = () => {
  const router = useRouter()
  const { name, idCard, phone, checkInTime, checkOutTime, floor, bedNumber, position, checkInId, bedId } = router.params
  const [submitting, setSubmitting] = useState(false)
  const [showCheckOutDialog, setShowCheckOutDialog] = useState(false)
  const [checkOutDate, setCheckOutDate] = useState(() => {
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  })

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

  const handleCheckOut = async () => {
    if (!checkInId || !bedId) {
      Taro.showToast({ title: '缺少必要参数', icon: 'none' })
      return
    }

    if (!checkOutDate) {
      Taro.showToast({ title: '请选择搬离日期', icon: 'none' })
      return
    }

    setSubmitting(true)
    try {
      const res = await Network.request({
        url: '/api/checkout',
        method: 'POST',
        data: {
          checkInId: parseInt(checkInId as string, 10),
          bedId: parseInt(bedId as string, 10),
          checkOutDate: checkOutDate
        }
      })

      console.log('搬离登记响应:', res.data)

      if (res.data?.code === 200) {
        Taro.showToast({ title: '搬离成功', icon: 'success' })
        setShowCheckOutDialog(false)
        setTimeout(() => {
          Taro.navigateBack()
        }, 1500)
      } else {
        Taro.showToast({ title: res.data?.msg || '搬离失败', icon: 'none' })
      }
    } catch (error) {
      console.error('搬离登记失败:', error)
      Taro.showToast({ title: '搬离失败，请重试', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

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

          {/* 搬离按钮：只在未搬离时显示 */}
          {!hasCheckOut && checkInId && bedId && (
            <View className="mt-6 pt-4 border-t border-gray-200">
              <Button
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                onClick={() => setShowCheckOutDialog(true)}
              >
                <View className="flex items-center gap-2">
                  <LogOut size={18} color="#fff" />
                  <Text className="text-white">确认搬离</Text>
                </View>
              </Button>
              <Text className="text-xs text-gray-400 text-center block mt-2">
                搬离后信息将记录到搬离名单
              </Text>
            </View>
          )}
        </CardContent>
      </Card>

      {/* 搬离日期选择对话框 */}
      <Dialog open={showCheckOutDialog} onOpenChange={setShowCheckOutDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>搬离登记</DialogTitle>
          </DialogHeader>
          <View className="py-4">
            <View className="space-y-4">
              <View className="bg-gray-50 rounded-lg p-3 space-y-2">
                <Text className="text-sm text-gray-600 block">
                  床位: {bedNumber ? decodeURIComponent(bedNumber as string) : '-'}号床 - {getPositionLabel(position)}
                </Text>
                <Text className="text-sm text-gray-600 block">
                  姓名: <Text className="text-blue-600 font-medium">{decodedName}</Text>
                </Text>
                <Text className="text-sm text-gray-600 block">
                  入住日期: {formatDate(checkInTime)}
                </Text>
              </View>

              <View>
                <Text className="text-sm text-gray-700 flex items-center gap-1 mb-2">
                  <Calendar size={14} color="#6b7280" />
                  <Text>搬离日期</Text>
                </Text>
                <Picker
                  mode="date"
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.detail.value)}
                >
                  <View className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <Text className={checkOutDate ? 'text-foreground' : 'text-muted-foreground'}>
                      {checkOutDate || '请选择搬离日期'}
                    </Text>
                  </View>
                </Picker>
              </View>

              <Text className="text-xs text-red-500 block">
                确认搬离后，信息将记录到搬离名单
              </Text>
            </View>
          </View>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckOutDialog(false)}>取消</Button>
            <Button 
              className="bg-orange-500 text-white" 
              onClick={handleCheckOut}
              disabled={submitting}
            >
              {submitting ? '处理中...' : '确认搬离'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </View>
  )
}

export default DetailPage
