import { View, Text, Picker } from '@tarojs/components'
import { useState } from 'react'
import Taro, { useRouter, useDidShow } from '@tarojs/taro'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Network } from '@/network'
import { Bed, User, Phone, CreditCard, Calendar } from 'lucide-react-taro'
import './index.css'

interface BedInfo {
  id: number
  floor: number
  bedNumber: number
  position: string
  status: string
  checkIn?: {
    id: number
    name: string
    idCard: string
    phone: string
    checkInTime: string
  }
}

const CheckInPage = () => {
  const router = useRouter()
  const { floor: floorParam, type } = router.params
  const floor = parseInt(floorParam || '1', 10)
  const mode = type === 'checkout' ? 'checkout' : 'checkin'

  const [beds, setBeds] = useState<BedInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBed, setSelectedBed] = useState<BedInfo | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    idCard: '',
    phone: '',
    checkInDate: ''
  })
  const [submitting, setSubmitting] = useState(false)

  useDidShow(() => {
    loadBeds()
  })

  const loadBeds = async () => {
    setLoading(true)
    try {
      const res = await Network.request({
        url: '/api/beds/floor/' + floor
      })

      console.log('床位数据响应:', res.data)

      if (res.data?.code === 200 && res.data?.data) {
        // 转换字段名：蛇形命名 -> 驼峰命名
        const formattedBeds = res.data.data.map((bed: any) => ({
          id: bed.id,
          floor: bed.floor,
          bedNumber: bed.bed_number,
          position: bed.position,
          status: bed.status,
          checkIn: bed.checkIn ? {
            id: bed.checkIn.id,
            name: bed.checkIn.name,
            idCard: bed.checkIn.id_card,
            phone: bed.checkIn.phone,
            checkInTime: bed.checkIn.check_in_time
          } : undefined
        }))
        console.log('格式化后的床位数据:', formattedBeds)
        setBeds(formattedBeds)
      } else {
        // 如果后端未返回数据，生成默认床位
        const defaultBeds: BedInfo[] = []
        for (let i = 1; i <= 15; i++) {
          defaultBeds.push({
            id: (floor - 1) * 30 + (i - 1) * 2 + 1,
            floor,
            bedNumber: i,
            position: 'upper',
            status: 'empty'
          })
          defaultBeds.push({
            id: (floor - 1) * 30 + (i - 1) * 2 + 2,
            floor,
            bedNumber: i,
            position: 'lower',
            status: 'empty'
          })
        }
        setBeds(defaultBeds)
      }
    } catch (error) {
      console.error('加载床位失败:', error)
      // 生成默认床位
      const defaultBeds: BedInfo[] = []
      for (let i = 1; i <= 15; i++) {
        defaultBeds.push({
          id: (floor - 1) * 30 + (i - 1) * 2 + 1,
          floor,
          bedNumber: i,
          position: 'upper',
          status: 'empty'
        })
        defaultBeds.push({
          id: (floor - 1) * 30 + (i - 1) * 2 + 2,
          floor,
          bedNumber: i,
          position: 'lower',
          status: 'empty'
        })
      }
      setBeds(defaultBeds)
    } finally {
      setLoading(false)
    }
  }

  const handleBedClick = (bed: BedInfo) => {
    if (mode === 'checkin') {
      if (bed.status === 'empty') {
        setSelectedBed(bed)
        // 设置默认入住日期为今天
        const today = new Date()
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
        setFormData({
          name: '',
          idCard: '',
          phone: '',
          checkInDate: dateStr
        })
        setShowForm(true)
      } else {
        // 已入住的床位，点击名字查看详情
        if (bed.checkIn) {
          Taro.navigateTo({
            url: `/pages/detail/index?name=${encodeURIComponent(bed.checkIn.name)}&idCard=${encodeURIComponent(bed.checkIn.idCard)}&phone=${encodeURIComponent(bed.checkIn.phone)}&checkInTime=${encodeURIComponent(bed.checkIn.checkInTime)}&floor=${floor}&bedNumber=${bed.bedNumber}&position=${bed.position}`
          })
        }
      }
    } else {
      // checkout 模式
      if (bed.status === 'occupied') {
        setSelectedBed(bed)
        setShowConfirm(true)
      }
    }
  }

  const handleFormSubmit = async () => {
    if (!selectedBed) return

    // 表单验证
    if (!formData.name.trim()) {
      Taro.showToast({ title: '请输入姓名', icon: 'none' })
      return
    }
    if (!/^\d{17}[\dXx]$/.test(formData.idCard)) {
      Taro.showToast({ title: '身份证号格式不正确', icon: 'none' })
      return
    }
    if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
      Taro.showToast({ title: '手机号格式不正确', icon: 'none' })
      return
    }
    if (!formData.checkInDate) {
      Taro.showToast({ title: '请选择入住日期', icon: 'none' })
      return
    }

    setSubmitting(true)
    try {
      const res = await Network.request({
        url: '/api/checkin',
        method: 'POST',
        data: {
          bedId: selectedBed.id,
          name: formData.name,
          idCard: formData.idCard,
          phone: formData.phone,
          checkInDate: formData.checkInDate
        }
      })

      console.log('入住登记响应:', res.data)

      if (res.data?.code === 200) {
        Taro.showToast({ title: '入住成功', icon: 'success' })
        setShowForm(false)
        setFormData({ name: '', idCard: '', phone: '', checkInDate: '' })
        loadBeds()
      } else {
        Taro.showToast({ title: res.data?.msg || '入住失败', icon: 'none' })
      }
    } catch (error) {
      console.error('入住登记失败:', error)
      Taro.showToast({ title: '入住失败，请重试', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCheckOut = async () => {
    if (!selectedBed || !selectedBed.checkIn) return

    setSubmitting(true)
    try {
      const res = await Network.request({
        url: '/api/checkout',
        method: 'POST',
        data: {
          checkInId: selectedBed.checkIn.id,
          bedId: selectedBed.id
        }
      })

      console.log('搬离登记响应:', res.data)

      if (res.data?.code === 200) {
        Taro.showToast({ title: '搬离成功', icon: 'success' })
        setShowConfirm(false)
        loadBeds()
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

  const getPositionLabel = (position: string) => {
    return position === 'upper' ? '上铺' : '下铺'
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    try {
      const date = new Date(dateStr)
      return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
    } catch {
      return dateStr
    }
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <Text className="text-lg font-semibold text-gray-800">
          {floor}楼 - {mode === 'checkin' ? '入住登记' : '搬离登记'}
        </Text>
        <Text className="text-xs text-gray-500 block mt-1">
          {mode === 'checkin' ? '点击空床位进行入住登记' : '点击已入住床位进行搬离'}
        </Text>
      </View>

      {loading ? (
        <View className="flex justify-center items-center py-12">
          <Text className="text-gray-400">加载中...</Text>
        </View>
      ) : (
        <View className="p-4">
          <View className="grid grid-cols-2 gap-3">
            {Array.from({ length: 15 }, (_, i) => i + 1).map((bedNum) => {
              const upperBed = beds.find(b => b.bedNumber === bedNum && b.position === 'upper')
              const lowerBed = beds.find(b => b.bedNumber === bedNum && b.position === 'lower')

              return (
                <View key={bedNum} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <View className="bg-gray-100 px-3 py-1 border-b border-gray-200">
                    <Text className="text-xs font-medium text-gray-600">{bedNum}号床</Text>
                  </View>
                  <View className="p-2 space-y-2">
                    {/* 上铺 */}
                    <View
                      className={`rounded p-2 cursor-pointer ${
                        upperBed?.status === 'occupied'
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-gray-50 border border-gray-200'
                      }`}
                      onClick={() => upperBed && handleBedClick(upperBed)}
                    >
                      <View className="flex items-center justify-between">
                        <View className="flex items-center gap-1">
                          <Bed size={14} color={upperBed?.status === 'occupied' ? '#22c55e' : '#9ca3af'} />
                          <Text className={`text-xs font-medium ${
                            upperBed?.status === 'occupied' ? 'text-green-700' : 'text-gray-500'
                          }`}
                          >
                            上铺
                          </Text>
                        </View>
                        {upperBed?.status === 'occupied' && (
                          <Badge className="bg-green-500 text-white text-xs">已入住</Badge>
                        )}
                      </View>
                      {upperBed?.status === 'empty' && (
                        <Text className="text-xs text-gray-400 block mt-1">点击登记</Text>
                      )}
                      {upperBed?.status === 'occupied' && upperBed.checkIn && (
                        <View className="mt-1">
                          <Text className="text-xs text-blue-600 font-medium block">{upperBed.checkIn.name}</Text>
                          <Text className="text-xs text-gray-500 block">
                            入住: {formatDate(upperBed.checkIn.checkInTime)}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* 下铺 */}
                    <View
                      className={`rounded p-2 cursor-pointer ${
                        lowerBed?.status === 'occupied'
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-gray-50 border border-gray-200'
                      }`}
                      onClick={() => lowerBed && handleBedClick(lowerBed)}
                    >
                      <View className="flex items-center justify-between">
                        <View className="flex items-center gap-1">
                          <Bed size={14} color={lowerBed?.status === 'occupied' ? '#22c55e' : '#9ca3af'} />
                          <Text className={`text-xs font-medium ${
                            lowerBed?.status === 'occupied' ? 'text-green-700' : 'text-gray-500'
                          }`}
                          >
                            下铺
                          </Text>
                        </View>
                        {lowerBed?.status === 'occupied' && (
                          <Badge className="bg-green-500 text-white text-xs">已入住</Badge>
                        )}
                      </View>
                      {lowerBed?.status === 'empty' && (
                        <Text className="text-xs text-gray-400 block mt-1">点击登记</Text>
                      )}
                      {lowerBed?.status === 'occupied' && lowerBed.checkIn && (
                        <View className="mt-1">
                          <Text className="text-xs text-blue-600 font-medium block">{lowerBed.checkIn.name}</Text>
                          <Text className="text-xs text-gray-500 block">
                            入住: {formatDate(lowerBed.checkIn.checkInTime)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              )
            })}
          </View>
        </View>
      )}

      {/* 入住登记表单 */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>入住登记</DialogTitle>
            <DialogDescription>
              {selectedBed?.bedNumber}号床 - {selectedBed && getPositionLabel(selectedBed.position)}
            </DialogDescription>
          </DialogHeader>
          <View className="space-y-4 py-4">
            <View>
              <Label className="text-sm text-gray-700 flex items-center gap-1">
                <User size={14} color="#6b7280" />
                <Text>姓名</Text>
              </Label>
              <Input
                className="mt-1"
                placeholder="请输入姓名"
                value={formData.name}
                onInput={(e) => setFormData({ ...formData, name: e.detail.value })}
              />
            </View>
            <View>
              <Label className="text-sm text-gray-700 flex items-center gap-1">
                <CreditCard size={14} color="#6b7280" />
                <Text>身份证号</Text>
              </Label>
              <Input
                className="mt-1"
                placeholder="请输入身份证号"
                maxlength={18}
                value={formData.idCard}
                onInput={(e) => setFormData({ ...formData, idCard: e.detail.value })}
              />
            </View>
            <View>
              <Label className="text-sm text-gray-700 flex items-center gap-1">
                <Phone size={14} color="#6b7280" />
                <Text>手机号</Text>
              </Label>
              <Input
                className="mt-1"
                placeholder="请输入手机号"
                type="number"
                maxlength={11}
                value={formData.phone}
                onInput={(e) => setFormData({ ...formData, phone: e.detail.value })}
              />
            </View>
            <View>
              <Label className="text-sm text-gray-700 flex items-center gap-1">
                <Calendar size={14} color="#6b7280" />
                <Text>入住日期</Text>
              </Label>
              <Picker
                mode="date"
                value={formData.checkInDate}
                onChange={(e) => setFormData({ ...formData, checkInDate: e.detail.value })}
              >
                <View className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <Text className={formData.checkInDate ? 'text-foreground' : 'text-muted-foreground'}>
                    {formData.checkInDate || '请选择入住日期'}
                  </Text>
                </View>
              </Picker>
            </View>
          </View>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>取消</Button>
            <Button 
              className="bg-blue-600 text-white" 
              onClick={handleFormSubmit}
              disabled={submitting}
            >
              {submitting ? '提交中...' : '确认入住'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 搬离确认对话框 */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>搬离登记</DialogTitle>
          </DialogHeader>
          <View className="py-4">
            {selectedBed?.checkIn && (
              <View className="space-y-3">
                <View className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <Text className="text-sm text-gray-600 block">
                    床位: {selectedBed?.bedNumber}号床 - {selectedBed && getPositionLabel(selectedBed.position)}
                  </Text>
                  <Text className="text-sm text-gray-600 block">
                    姓名: <Text className="text-blue-600 font-medium">{selectedBed.checkIn.name}</Text>
                  </Text>
                  <Text className="text-sm text-gray-600 block">
                    入住日期: {formatDate(selectedBed.checkIn.checkInTime)}
                  </Text>
                </View>
                <Text className="text-xs text-red-500 block">
                  确认搬离后，信息将记录到搬离名单
                </Text>
              </View>
            )}
          </View>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>取消</Button>
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

export default CheckInPage
