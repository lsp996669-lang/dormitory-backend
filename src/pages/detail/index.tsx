import { View, Text, Picker } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { User, Phone, CreditCard, Calendar, LogOut, Bed, Trash2, ArrowRight, Pencil } from 'lucide-react-taro'
import { Network } from '@/network'
import { PasswordDialog } from '@/components/PasswordDialog'
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

interface BedInfo {
  id: number
  floor: number
  bed_number: number  // 使用下划线命名，与后端返回一致
  position: string
  status: string
}

// 日期修改类型
type DateEditType = 'checkin-checkin' | 'checkout-checkin' | 'checkout-checkout' | null

const DetailPage = () => {
  const router = useRouter()
  const { name, idCard, phone, checkInTime, checkOutTime, floor, bedNumber, position, checkInId, bedId, checkOutId } = router.params
  const [submitting, setSubmitting] = useState(false)
  const [showCheckOutDialog, setShowCheckOutDialog] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [showTransferDialog, setShowTransferDialog] = useState(false)
  const [showDateEditDialog, setShowDateEditDialog] = useState(false)
  const [showDatePasswordDialog, setShowDatePasswordDialog] = useState(false)
  const [checkOutDate, setCheckOutDate] = useState(() => {
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  })

  // 日期编辑相关状态
  const [dateEditType, setDateEditType] = useState<DateEditType>(null)
  const [editCheckInDate, setEditCheckInDate] = useState('')
  const [editCheckOutDate, setEditCheckOutDate] = useState('')

  // 转移床位相关状态
  const [targetFloor, setTargetFloor] = useState('2')
  const [availableBeds, setAvailableBeds] = useState<BedInfo[]>([])
  const [targetBedId, setTargetBedId] = useState<number | null>(null)
  const [loadingBeds, setLoadingBeds] = useState(false)

  // 楼层选项
  const floorOptions = ['2', '3', '4']
  const floorSelector = floorOptions.map(f => `${f}楼`)

  useEffect(() => {
    if (showTransferDialog && targetFloor) {
      loadAvailableBeds(parseInt(targetFloor))
    }
  }, [showTransferDialog, targetFloor])

  const loadAvailableBeds = async (floorNum: number) => {
    setLoadingBeds(true)
    try {
      const res = await Network.request({
        url: `/api/beds/floor/${floorNum}`
      })

      if (res.data?.code === 200 && res.data?.data) {
        // 只保留空闲床位
        const emptyBeds = res.data.data.filter((bed: BedInfo) => bed.status === 'empty')
        setAvailableBeds(emptyBeds)
        setTargetBedId(null)
      }
    } catch (error) {
      console.error('加载床位失败:', error)
      Taro.showToast({ title: '加载床位失败', icon: 'none' })
    } finally {
      setLoadingBeds(false)
    }
  }

  const handleTransfer = async () => {
    // 检查登录状态
    if (!checkLogin()) {
      promptLogin()
      return
    }

    if (!checkInId || !targetBedId) {
      Taro.showToast({ title: '请选择目标床位', icon: 'none' })
      return
    }

    setSubmitting(true)
    try {
      const res = await Network.request({
        url: '/api/checkin/transfer',
        method: 'POST',
        data: {
          checkInId: parseInt(checkInId as string, 10),
          targetBedId: targetBedId
        }
      })

      console.log('转移床位响应:', res.data)

      if (res.data?.code === 200) {
        Taro.showToast({ title: '转移成功', icon: 'success' })
        setShowTransferDialog(false)
        setTimeout(() => {
          Taro.navigateBack()
        }, 1500)
      } else {
        Taro.showToast({ title: res.data?.msg || '转移失败', icon: 'none' })
      }
    } catch (error) {
      console.error('转移床位失败:', error)
      Taro.showToast({ title: '转移失败，请重试', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

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
  const decodedFloor = floor ? decodeURIComponent(floor as string) : '-'
  const decodedBedNumber = bedNumber ? decodeURIComponent(bedNumber as string) : '-'
  const hasCheckOut = checkOutTime && checkOutTime !== 'undefined'
  const hasCheckOutId = checkOutId && checkOutId !== 'undefined'

  // 初始化日期编辑状态
  useEffect(() => {
    if (checkInTime && checkInTime !== 'undefined') {
      try {
        const date = new Date(decodeURIComponent(checkInTime))
        setEditCheckInDate(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`)
      } catch {
        // 忽略解析错误
      }
    }
    if (hasCheckOut && checkOutTime) {
      try {
        const date = new Date(decodeURIComponent(checkOutTime))
        setEditCheckOutDate(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`)
      } catch {
        // 忽略解析错误
      }
    }
  }, [checkInTime, checkOutTime, hasCheckOut])

  // 点击日期编辑按钮，先弹出密码验证
  const handleDateEditClick = (type: DateEditType) => {
    if (!checkLogin()) {
      promptLogin()
      return
    }
    setDateEditType(type)
    setShowDatePasswordDialog(true)
  }

  // 密码验证成功后显示日期编辑对话框
  const handleDatePasswordSuccess = () => {
    setShowDatePasswordDialog(false)
    setShowDateEditDialog(true)
  }

  // 提交日期修改
  const handleDateEditSubmit = async () => {
    if (!dateEditType) return

    setSubmitting(true)
    try {
      let res
      if (dateEditType === 'checkin-checkin') {
        // 修改入住记录的入住日期
        res = await Network.request({
          url: '/api/checkin/update-date',
          method: 'POST',
          data: {
            checkInId: parseInt(checkInId as string, 10),
            checkInDate: editCheckInDate
          }
        })
      } else if (dateEditType === 'checkout-checkin') {
        // 修改搬离记录的入住日期
        res = await Network.request({
          url: '/api/checkout/update-checkin-date',
          method: 'POST',
          data: {
            checkOutId: parseInt(checkOutId as string, 10),
            checkInDate: editCheckInDate
          }
        })
      } else if (dateEditType === 'checkout-checkout') {
        // 修改搬离记录的搬离日期
        res = await Network.request({
          url: '/api/checkout/update-checkout-date',
          method: 'POST',
          data: {
            checkOutId: parseInt(checkOutId as string, 10),
            checkOutDate: editCheckOutDate
          }
        })
      }

      console.log('日期修改响应:', res?.data)

      if (res?.data?.code === 200) {
        Taro.showToast({ title: '修改成功', icon: 'success' })
        setShowDateEditDialog(false)
        setTimeout(() => {
          Taro.navigateBack()
        }, 1500)
      } else {
        Taro.showToast({ title: res?.data?.msg || '修改失败', icon: 'none' })
      }
    } catch (error) {
      console.error('日期修改失败:', error)
      Taro.showToast({ title: '修改失败，请重试', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  // 获取日期编辑对话框标题
  const getDateEditDialogTitle = () => {
    if (dateEditType === 'checkin-checkin') return '修改入住日期'
    if (dateEditType === 'checkout-checkin') return '修改入住日期'
    if (dateEditType === 'checkout-checkout') return '修改搬离日期'
    return '修改日期'
  }

  const handleCheckOut = async () => {
    // 检查登录状态
    if (!checkLogin()) {
      promptLogin()
      return
    }
    
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

  // 点击删除按钮，先弹出密码验证
  const handleDeleteClick = () => {
    // 检查登录状态
    if (!checkLogin()) {
      promptLogin()
      return
    }
    setShowPasswordDialog(true)
  }

  // 密码验证成功后执行删除
  const handleDelete = async () => {
    if (!checkOutId) {
      Taro.showToast({ title: '缺少必要参数', icon: 'none' })
      return
    }

    setShowPasswordDialog(false)
    setSubmitting(true)
    try {
      const res = await Network.request({
        url: `/api/checkout/${checkOutId}`,
        method: 'DELETE'
      })

      console.log('删除记录响应:', res.data)

      if (res.data?.code === 200) {
        Taro.showToast({ title: '删除成功', icon: 'success' })
        setTimeout(() => {
          Taro.navigateBack()
        }, 1500)
      } else {
        Taro.showToast({ title: res.data?.msg || '删除失败', icon: 'none' })
      }
    } catch (error) {
      console.error('删除记录失败:', error)
      Taro.showToast({ title: '删除失败，请重试', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  // 获取选中的目标床位显示文本
  const getTargetBedText = () => {
    if (!targetBedId) return '请选择目标床位'
    const bed = availableBeds.find(b => b.id === targetBedId)
    if (!bed) return '请选择目标床位'
    return `${bed.bed_number}号床 ${bed.position === 'upper' ? '上铺' : '下铺'}`
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
                  {decodedFloor}楼 {decodedBedNumber}号床 {getPositionLabel(position)}
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
              <View className="flex-1">
                <Text className="text-xs text-gray-500 block">入住时间</Text>
                <Text className="text-sm text-gray-800">{formatDate(checkInTime)}</Text>
              </View>
              {/* 修改入住日期按钮 */}
              {checkInId && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => handleDateEditClick(hasCheckOut ? 'checkout-checkin' : 'checkin-checkin')}
                >
                  <Pencil size={14} color="#6b7280" />
                </Button>
              )}
            </View>

            {hasCheckOut && (
              <View className="flex items-center gap-3">
                <LogOut size={20} color="#f97316" />
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 block">搬离时间</Text>
                  <Text className="text-sm text-orange-600">{formatDate(checkOutTime)}</Text>
                </View>
                {/* 修改搬离日期按钮 */}
                {hasCheckOutId && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => handleDateEditClick('checkout-checkout')}
                  >
                    <Pencil size={14} color="#f97316" />
                  </Button>
                )}
              </View>
            )}
          </View>

          {/* 操作按钮：只在未搬离时显示 */}
          {!hasCheckOut && checkInId && bedId && (
            <View className="mt-6 pt-4 border-t border-gray-200 space-y-3">
              {/* 转移床位按钮 */}
              <Button
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                onClick={() => setShowTransferDialog(true)}
              >
                <View className="flex items-center gap-2">
                  <ArrowRight size={18} color="#fff" />
                  <Text className="text-white">转移床位</Text>
                </View>
              </Button>

              {/* 搬离按钮 */}
              <Button
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                onClick={() => setShowCheckOutDialog(true)}
              >
                <View className="flex items-center gap-2">
                  <LogOut size={18} color="#fff" />
                  <Text className="text-white">确认搬离</Text>
                </View>
              </Button>
              <Text className="text-xs text-gray-400 text-center block">
                搬离后信息将记录到搬离名单
              </Text>
            </View>
          )}

          {/* 删除按钮：只在已搬离记录时显示 */}
          {hasCheckOut && hasCheckOutId && (
            <View className="mt-6 pt-4 border-t border-gray-200">
              <Button
                className="w-full bg-red-500 hover:bg-red-600 text-white"
                onClick={handleDeleteClick}
              >
                <View className="flex items-center gap-2">
                  <Trash2 size={18} color="#fff" />
                  <Text className="text-white">删除记录</Text>
                </View>
              </Button>
              <Text className="text-xs text-gray-400 text-center block mt-2">
                删除后无法恢复，需输入密码确认
              </Text>
            </View>
          )}
        </CardContent>
      </Card>

      {/* 转移床位对话框 */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>转移床位</DialogTitle>
          </DialogHeader>
          <View className="py-4">
            <View className="space-y-4">
              {/* 当前床位 */}
              <View className="bg-gray-50 rounded-lg p-3">
                <Text className="text-xs text-gray-500 block mb-1">当前床位</Text>
                <Text className="text-sm text-gray-800">
                  {decodedFloor}楼 {decodedBedNumber}号床 {getPositionLabel(position)}
                </Text>
              </View>

              {/* 选择目标楼层 */}
              <View>
                <Text className="text-sm text-gray-700 flex items-center gap-1 mb-2">
                  <Bed size={14} color="#6b7280" />
                  <Text>目标楼层</Text>
                </Text>
                <Picker
                  mode="selector"
                  range={floorSelector}
                  value={floorOptions.indexOf(targetFloor)}
                  onChange={(e) => setTargetFloor(floorOptions[e.detail.value])}
                >
                  <View className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm items-center">
                    <Text className="text-foreground">{targetFloor}楼</Text>
                  </View>
                </Picker>
              </View>

              {/* 选择目标床位 */}
              <View>
                <Text className="text-sm text-gray-700 flex items-center gap-1 mb-2">
                  <Bed size={14} color="#6b7280" />
                  <Text>目标床位（仅显示空床位）</Text>
                </Text>
                {loadingBeds ? (
                  <View className="h-10 flex items-center justify-center border border-gray-200 rounded-md">
                    <Text className="text-sm text-gray-400">加载中...</Text>
                  </View>
                ) : availableBeds.length === 0 ? (
                  <View className="h-10 flex items-center justify-center border border-gray-200 rounded-md bg-gray-50">
                    <Text className="text-sm text-gray-400">该楼层暂无空床位</Text>
                  </View>
                ) : (
                  <Picker
                    mode="selector"
                    range={availableBeds.map(b => `${b.bed_number}号床 ${b.position === 'upper' ? '上铺' : '下铺'}`)}
                    value={targetBedId ? availableBeds.findIndex(b => b.id === targetBedId) : 0}
                    onChange={(e) => {
                      const selectedBed = availableBeds[e.detail.value]
                      if (selectedBed) {
                        setTargetBedId(selectedBed.id)
                      }
                    }}
                  >
                    <View className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm items-center">
                      <Text className={targetBedId ? 'text-foreground' : 'text-muted-foreground'}>
                        {getTargetBedText()}
                      </Text>
                    </View>
                  </Picker>
                )}
              </View>

              {/* 转移提示 */}
              {targetBedId && (
                <View className="bg-blue-50 rounded-lg p-3">
                  <View className="flex items-center gap-2 mb-2">
                    <View className="flex items-center gap-1">
                      <Text className="text-xs text-gray-500">从</Text>
                      <Text className="text-sm text-blue-600 font-medium">
                        {decodedFloor}楼{decodedBedNumber}号床{getPositionLabel(position)}
                      </Text>
                    </View>
                    <ArrowRight size={14} color="#2563eb" />
                    <View className="flex items-center gap-1">
                      <Text className="text-xs text-gray-500">到</Text>
                      <Text className="text-sm text-green-600 font-medium">
                        {targetFloor}楼{getTargetBedText()}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-xs text-gray-500 block">
                    转移后人员信息保持不变，仅更换床位
                  </Text>
                </View>
              )}
            </View>
          </View>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransferDialog(false)}>取消</Button>
            <Button 
              className="bg-blue-500 text-white" 
              onClick={handleTransfer}
              disabled={submitting || !targetBedId || availableBeds.length === 0}
            >
              {submitting ? '处理中...' : '确认转移'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                  床位: {decodedBedNumber}号床 - {getPositionLabel(position)}
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

      {/* 密码验证对话框 */}
      <PasswordDialog
        open={showPasswordDialog}
        title="删除验证"
        confirmText="确认删除"
        onConfirm={handleDelete}
        onCancel={() => setShowPasswordDialog(false)}
      />

      {/* 日期修改密码验证对话框 */}
      <PasswordDialog
        open={showDatePasswordDialog}
        title="日期修改验证"
        confirmText="验证"
        onConfirm={handleDatePasswordSuccess}
        onCancel={() => setShowDatePasswordDialog(false)}
      />

      {/* 日期修改对话框 */}
      <Dialog open={showDateEditDialog} onOpenChange={setShowDateEditDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{getDateEditDialogTitle()}</DialogTitle>
          </DialogHeader>
          <View className="py-4">
            <View className="space-y-4">
              <View className="bg-gray-50 rounded-lg p-3">
                <Text className="text-sm text-gray-600 block">
                  姓名: <Text className="text-blue-600 font-medium">{decodedName}</Text>
                </Text>
              </View>

              {/* 入住日期编辑 */}
              {(dateEditType === 'checkin-checkin' || dateEditType === 'checkout-checkin') && (
                <View>
                  <Text className="text-sm text-gray-700 flex items-center gap-1 mb-2">
                    <Calendar size={14} color="#6b7280" />
                    <Text>入住日期</Text>
                  </Text>
                  <Picker
                    mode="date"
                    value={editCheckInDate}
                    onChange={(e) => setEditCheckInDate(e.detail.value)}
                  >
                    <View className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <Text className={editCheckInDate ? 'text-foreground' : 'text-muted-foreground'}>
                        {editCheckInDate || '请选择入住日期'}
                      </Text>
                    </View>
                  </Picker>
                </View>
              )}

              {/* 搬离日期编辑 */}
              {dateEditType === 'checkout-checkout' && (
                <View>
                  <Text className="text-sm text-gray-700 flex items-center gap-1 mb-2">
                    <Calendar size={14} color="#f97316" />
                    <Text>搬离日期</Text>
                  </Text>
                  <Picker
                    mode="date"
                    value={editCheckOutDate}
                    onChange={(e) => setEditCheckOutDate(e.detail.value)}
                  >
                    <View className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <Text className={editCheckOutDate ? 'text-foreground' : 'text-muted-foreground'}>
                        {editCheckOutDate || '请选择搬离日期'}
                      </Text>
                    </View>
                  </Picker>
                </View>
              )}
            </View>
          </View>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDateEditDialog(false)}>取消</Button>
            <Button
              className="bg-blue-500 text-white"
              onClick={handleDateEditSubmit}
              disabled={submitting}
            >
              {submitting ? '处理中...' : '确认修改'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </View>
  )
}

export default DetailPage
