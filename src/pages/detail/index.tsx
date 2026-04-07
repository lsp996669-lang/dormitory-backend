import { View, Text, Picker } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { User, Phone, CreditCard, Calendar, LogOut, Bed, Trash2, ArrowRight, Pencil, Copy, MapPin } from 'lucide-react-taro'
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

// 日期修改类型
type DateEditType = 'checkin-checkin' | 'checkout-checkin' | 'checkout-checkout' | null

const DetailPage = () => {
  const router = useRouter()
  const { name, idCard, phone, checkInTime, checkOutTime, floor, bedNumber, position, checkInId, bedId, checkOutId, dormitory, room: currentRoom, isStationMarked: initialStationMarked, isRider: initialIsRider, stationName: initialStationName, isFlagged: initialIsFlagged } = router.params
  const isNanTwo = dormitory === 'nantwo'
  const [submitting, setSubmitting] = useState(false)
  const [showCheckOutDialog, setShowCheckOutDialog] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [showTransferDialog, setShowTransferDialog] = useState(false)
  const [showDateEditDialog, setShowDateEditDialog] = useState(false)
  const [showDatePasswordDialog, setShowDatePasswordDialog] = useState(false)
  const [showSwapDialog, setShowSwapDialog] = useState(false)
  const [checkOutDate, setCheckOutDate] = useState(() => {
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  })

  // 站点标注相关状态
  const [stationName, setStationName] = useState<string | null>(() => {
    if (initialIsRider === 'true') return 'rider'
    if (initialStationMarked === 'true') return 'exhibition' // 默认会展中心站
    if (initialStationName && initialStationName !== 'null' && initialStationName !== '') return decodeURIComponent(initialStationName)
    return null
  })
  const [showStationDialog, setShowStationDialog] = useState(false)
  // 红名标记相关状态
  const [isFlagged, setIsFlagged] = useState(() => initialIsFlagged === 'true')
  const [showFlagConfirmDialog, setShowFlagConfirmDialog] = useState(false)
  // 床位互换相关状态
  const [swapTargetBedId, setSwapTargetBedId] = useState<number | null>(null)
  const [swapFloor, setSwapFloor] = useState<string>('')
  const [swapAvailableBeds, setSwapAvailableBeds] = useState<Array<{
    id: number
    floor: number
    bed_number: number
    position: string
    room: string
    dormitory: string
    isOccupied: boolean
    occupantName?: string
  }>>([])

  // 日期编辑相关状态
  const [dateEditType, setDateEditType] = useState<DateEditType>(null)
  const [editCheckInDate, setEditCheckInDate] = useState('')
  const [editCheckOutDate, setEditCheckOutDate] = useState('')

  // 转移床位相关状态
  const [transferData, setTransferData] = useState<{
    dormitory: string
    currentBed: { id: number; floor: number; bedNumber: number; position: string; room: string }
    transferableBeds: Array<{ id: number; floor: number; bed_number: number; position: string; room: string }>
  } | null>(null)
  const [targetBedId, setTargetBedId] = useState<number | null>(null)
  const [loadingBeds, setLoadingBeds] = useState(false)
  const [selectedFloor, setSelectedFloor] = useState<string>('')

  useEffect(() => {
    if (showTransferDialog && bedId) {
      loadTransferableBeds()
    }
  }, [showTransferDialog])

  // 加载床位互换候选列表
  useEffect(() => {
    if (showSwapDialog && bedId) {
      loadSwapBeds()
    }
  }, [showSwapDialog])

  // 加载所有床位（用于互换）
  useEffect(() => {
    if (showSwapDialog && bedId) {
      loadSwapBeds()
    }
  }, [showSwapDialog])

  const loadSwapBeds = async () => {
    try {
      const res = await Network.request({
        url: '/api/beds/all'
      })
      console.log('互换可用床位响应:', res.data)
      if (res.data?.code === 200 && res.data?.data) {
        // 使用所有床位数据（南四巷和南二巷）
        const nansiBeds = res.data.data.nansiBeds || []
        const nantwoBeds = res.data.data.nantwoBeds || []
        const allBeds = [...nansiBeds, ...nantwoBeds].map((b: { id: number; floor: number; bed_number: number; position: string; room: string; dormitory: string; status: string }) => ({
          ...b,
          isOccupied: b.status === 'occupied', // 标记是否已入住
        }))
        setSwapAvailableBeds(allBeds)
        // 设置默认楼层
        const floors = [...new Set(allBeds.map((b: { floor: number }) => b.floor))]
        if (floors.length > 0) {
          setSwapFloor(String(floors[0]))
        }
        setSwapTargetBedId(null)
      } else {
        Taro.showToast({ title: res.data?.msg || '加载可用床位失败', icon: 'none' })
      }
    } catch (error) {
      console.error('加载可用床位失败:', error)
      Taro.showToast({ title: '加载可用床位失败', icon: 'none' })
    }
  }

  const loadTransferableBeds = async () => {
    setLoadingBeds(true)
    try {
      const res = await Network.request({
        url: `/api/beds/transferable/${bedId}`
      })

      console.log('可转移床位响应:', res.data)

      if (res.data?.code === 200 && res.data?.data) {
        setTransferData(res.data.data)
        setTargetBedId(null)
        // 设置默认选中的楼层
        const floors = [...new Set(res.data.data.transferableBeds.map((b: { floor: number }) => b.floor))]
        if (floors.length > 0) {
          setSelectedFloor(String(floors[0]))
        }
      } else {
        Taro.showToast({ title: res.data?.msg || '加载可转移床位失败', icon: 'none' })
      }
    } catch (error) {
      console.error('加载可转移床位失败:', error)
      Taro.showToast({ title: '加载可转移床位失败', icon: 'none' })
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

  // 格式化床位显示文本
  // 南四巷(nansi)：无房号，显示 "X楼Y号床上铺"
  // 南二巷(nantwo)：有房号，显示 "X楼Y号房Z号床上铺"
  const formatBedDisplay = (bedFloor: number | string, bedNum: number | string, pos: string, bedRoom?: string) => {
    const positionLabel = pos === 'upper' ? '上铺' : '下铺'
    if (isNanTwo && bedRoom) {
      // 南二巷有房号
      return `${bedFloor}楼${bedRoom}房${bedNum}号床 ${positionLabel}`
    }
    // 南四巷无房号
    return `${bedFloor}楼${bedNum}号床 ${positionLabel}`
  }

  const decodedName = name ? decodeURIComponent(name) : '-'
  const decodedIdCard = idCard ? decodeURIComponent(idCard) : '-'
  const decodedPhone = phone ? decodeURIComponent(phone) : '-'
  const decodedFloor = floor ? decodeURIComponent(floor as string) : '-'
  const decodedBedNumber = bedNumber ? decodeURIComponent(bedNumber as string) : '-'
  const decodedRoom = currentRoom && currentRoom !== '' ? decodeURIComponent(currentRoom) : ''
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

  // 复制电话号码
  const handleCopyPhone = () => {
    if (!decodedPhone || decodedPhone === '-') {
      Taro.showToast({ title: '无电话号码', icon: 'none' })
      return
    }
    Taro.setClipboardData({
      data: decodedPhone,
      success: () => {
        Taro.showToast({ title: '已复制', icon: 'success' })
      }
    })
  }

  // 点击站点标注按钮
  const handleStationClick = () => {
    if (!checkLogin()) {
      promptLogin()
      return
    }
    setShowStationDialog(true)
  }

  // 选择站点
  const handleSelectStation = async (station: string | null) => {
    if (!checkLogin()) {
      promptLogin()
      return
    }
    if (!checkInId) return
    setSubmitting(true)
    try {
      const res = await Network.request({
        url: '/api/checkin/toggle-station',
        method: 'POST',
        data: {
          checkInId: parseInt(checkInId as string, 10),
          stationName: station
        }
      })
      if (res.data?.code === 200) {
        setStationName(station)
        setShowStationDialog(false)
        const stationLabels: Record<string, string> = {
          'exhibition': '会展中心站',
          'wuyue': '吾悦广场站',
          'rider': '众包骑手'
        }
        Taro.showToast({ title: station ? `已标记${stationLabels[station]}` : '已取消标注', icon: 'success' })
      } else {
        Taro.showToast({ title: res.data?.msg || '操作失败', icon: 'none' })
      }
    } catch (error) {
      console.error('设置站点标注失败:', error)
      Taro.showToast({ title: '操作失败', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  // 点击红名标记按钮
  const handleFlagClick = () => {
    if (!checkLogin()) {
      promptLogin()
      return
    }
    setShowFlagConfirmDialog(true)
  }

  // 切换红名标记
  const handleToggleFlag = async () => {
    if (!checkLogin()) {
      promptLogin()
      return
    }
    if (!checkInId) return
    setSubmitting(true)
    try {
      const res = await Network.request({
        url: '/api/checkin/toggle-flag',
        method: 'POST',
        data: {
          checkInId: parseInt(checkInId as string, 10)
        }
      })
      if (res.data?.code === 200) {
        const newFlagged = !isFlagged
        setIsFlagged(newFlagged)
        setShowFlagConfirmDialog(false)
        Taro.showToast({ 
          title: newFlagged ? '已标记红名' : '已取消红名', 
          icon: 'success' 
        })
      } else {
        Taro.showToast({ title: res.data?.msg || '操作失败', icon: 'none' })
      }
    } catch (error) {
      console.error('切换红名标记失败:', error)
      Taro.showToast({ title: '操作失败', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  // 获取站点标签
  const getStationLabel = (station: string | null) => {
    const labels: Record<string, string> = {
      'exhibition': '会展中心站',
      'wuyue': '吾悦广场站',
      'rider': '众包骑手'
    }
    return station ? labels[station] || station : '设置站点'
  }

  // 获取站点按钮样式
  const getStationButtonStyle = () => {
    if (!stationName) return 'bg-gray-100 text-gray-600 border-gray-200'
    if (stationName === 'rider') return 'bg-green-500 text-white border-green-500'
    return 'bg-blue-500 text-white border-blue-500'
  }

  // 执行床位互换
  const handleSwapBed = async () => {
    if (!checkLogin()) {
      promptLogin()
      return
    }
    if (!checkInId || !swapTargetBedId) {
      Taro.showToast({ title: '请选择目标床位', icon: 'none' })
      return
    }
    setSubmitting(true)
    try {
      const res = await Network.request({
        url: '/api/beds/swap',
        method: 'POST',
        data: {
          checkInId: parseInt(checkInId as string, 10),
          targetBedId: swapTargetBedId
        }
      })
      if (res.data?.code === 200) {
        Taro.showToast({ title: '互换成功', icon: 'success' })
        setShowSwapDialog(false)
        setTimeout(() => {
          Taro.navigateBack()
        }, 1500)
      } else {
        Taro.showToast({ title: res.data?.msg || '互换失败', icon: 'none' })
      }
    } catch (error) {
      console.error('床位互换失败:', error)
      Taro.showToast({ title: '互换失败，请重试', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
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
    if (!targetBedId || !transferData) return '请选择目标床位'
    const bed = transferData.transferableBeds.find(b => b.id === targetBedId)
    if (!bed) return '请选择目标床位'
    // 根据宿舍类型显示床位信息
    // 南四巷(nansi)：无房号，显示 "X楼Y号床上铺"
    // 南二巷(nantwo)：有房号，显示 "X楼Y号房Z号床上铺"
    if (transferData.dormitory === 'nantwo' && bed.room) {
      return `${bed.floor}楼${bed.room}房${bed.bed_number}号床 ${bed.position === 'upper' ? '上铺' : '下铺'}`
    }
    return `${bed.floor}楼${bed.bed_number}号床 ${bed.position === 'upper' ? '上铺' : '下铺'}`
  }

  // 获取筛选后的床位列表
  const getFilteredBeds = () => {
    if (!transferData || !selectedFloor) return []
    return transferData.transferableBeds.filter(b => b.floor.toString() === selectedFloor)
  }

  // 获取可用的楼层列表
  const getAvailableFloors = () => {
    if (!transferData) return []
    return [...new Set(transferData.transferableBeds.map(b => b.floor))].sort((a, b) => a - b)
  }

  // 获取宿舍名称
  const getDormitoryName = () => {
    if (!transferData) return ''
    return transferData.dormitory === 'nansi' ? '南四巷180号宿舍' : '南二巷24号宿舍'
  }

  // 获取互换可用的楼层列表
  const getSwapAvailableFloors = () => {
    return [...new Set(swapAvailableBeds.map(b => b.floor))].sort((a, b) => a - b)
  }

  // 获取筛选后的床位列表
  const getFilteredSwapBeds = () => {
    if (!swapAvailableBeds || !swapFloor) return []
    return swapAvailableBeds.filter(b => b.floor.toString() === swapFloor)
  }

  // 获取选中的床位显示文本
  const getSwapTargetBedText = () => {
    if (!swapTargetBedId) return '请选择目标床位'
    const bed = swapAvailableBeds.find(b => b.id === swapTargetBedId)
    if (!bed) return '请选择目标床位'
    // 根据宿舍类型显示床位信息
    // 南四巷(nansi)：无房号，显示 "X楼Y号床上铺"
    // 南二巷(nantwo)：有房号，显示 "X楼Y号房Z号床上铺"
    if (bed.dormitory === 'nantwo' && bed.room) {
      return `${bed.floor}楼${bed.room}房${bed.bed_number}号床 ${bed.position === 'upper' ? '上铺' : '下铺'}`
    }
    return `${bed.floor}楼${bed.bed_number}号床 ${bed.position === 'upper' ? '上铺' : '下铺'}`
  }

  // 格式化任意床位显示文本
  const formatSwapBedDisplay = (bed: { floor: number; bed_number: number; position: string; room: string; dormitory: string }) => {
    if (bed.dormitory === 'nantwo' && bed.room) {
      return `${bed.floor}楼${bed.room}房${bed.bed_number}号床 ${bed.position === 'upper' ? '上铺' : '下铺'}`
    }
    return `${bed.floor}楼${bed.bed_number}号床 ${bed.position === 'upper' ? '上铺' : '下铺'}`
  }

  return (
    <View className="min-h-screen bg-gray-50 p-4">
      <Card className="overflow-hidden">
        <View className="bg-blue-600 px-4 py-6 text-center">
          <View className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-3">
            <User size={32} color="#2563eb" />
          </View>
          <Text className={`text-xl font-bold block ${isFlagged ? 'text-red-300' : 'text-white'}`}>{decodedName}</Text>
          {isFlagged && (
            <View className="mt-1">
              <Badge className="bg-red-500 text-white text-xs">红名标记</Badge>
            </View>
          )}
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
                  {formatBedDisplay(decodedFloor, decodedBedNumber, position || '', decodedRoom)}
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
              <View className="flex-1">
                <Text className="text-xs text-gray-500 block">手机号</Text>
                <Text className="text-sm text-gray-800">{decodedPhone}</Text>
              </View>
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={handleCopyPhone}
              >
                <Copy size={14} color="#6b7280" />
              </Button>
            </View>

            <View className="flex items-center gap-3">
              <MapPin size={20} color="#6b7280" />
              <View className="flex-1">
                <Text className="text-xs text-gray-500 block">站点标注</Text>
                <View className="mt-1">
                  <Button
                    size="sm"
                    className={`px-3 py-1 rounded text-xs font-medium border ${getStationButtonStyle()}`}
                    onClick={handleStationClick}
                  >
                    <Text>{getStationLabel(stationName)}</Text>
                  </Button>
                </View>
              </View>
            </View>

            {/* 红名标记 */}
            {!hasCheckOut && checkInId && (
              <View className="flex items-center gap-3">
                <View className="w-5 h-5 flex items-center justify-center">
                  <Text className="text-red-500 text-lg">!</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 block">红名标记</Text>
                  <Text className="text-xs text-gray-400 mt-1">用于标记需要关注的人员</Text>
                </View>
                <Button
                  size="sm"
                  className={`px-3 py-1 rounded text-xs font-medium border ${
                    isFlagged 
                      ? 'bg-red-500 text-white border-red-500' 
                      : 'bg-white text-red-500 border-red-300'
                  }`}
                  onClick={handleFlagClick}
                >
                  <Text className={isFlagged ? 'text-white' : 'text-red-500'}>
                    {isFlagged ? '已标记' : '标记红名'}
                  </Text>
                </Button>
              </View>
            )}

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
              {/* 床位互换按钮 */}
              <Button
                className="w-full bg-purple-500 hover:bg-purple-600 text-white"
                onClick={() => setShowSwapDialog(true)}
              >
                <View className="flex items-center gap-2">
                  <ArrowRight size={18} color="#fff" className="rotate-180" />
                  <Text className="text-white">床位互换</Text>
                </View>
              </Button>

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
            {loadingBeds ? (
              <View className="flex items-center justify-center py-8">
                <Text className="text-sm text-gray-400">加载中...</Text>
              </View>
            ) : transferData && transferData.transferableBeds.length > 0 ? (
              <View className="space-y-4">
                {/* 宿舍信息 */}
                <View className="bg-blue-50 rounded-lg p-3">
                  <Text className="text-xs text-gray-500 block mb-1">当前宿舍</Text>
                  <Text className="text-sm text-blue-600 font-medium">{getDormitoryName()}</Text>
                  <Text className="text-xs text-gray-500 block mt-1">（仅支持同宿舍内转移）</Text>
                </View>

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
                    range={getAvailableFloors().map(f => `${f}楼`)}
                    value={getAvailableFloors().findIndex(f => f.toString() === selectedFloor)}
                    onChange={(e) => {
                      const floors = getAvailableFloors()
                      if (floors[e.detail.value]) {
                        setSelectedFloor(floors[e.detail.value].toString())
                        setTargetBedId(null)
                      }
                    }}
                  >
                    <View className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm items-center">
                      <Text className="text-foreground">{selectedFloor}楼</Text>
                    </View>
                  </Picker>
                </View>

                {/* 选择目标床位 */}
                <View>
                  <Text className="text-sm text-gray-700 flex items-center gap-1 mb-2">
                    <Bed size={14} color="#6b7280" />
                    <Text>目标床位（仅显示空床位）</Text>
                  </Text>
                  {getFilteredBeds().length === 0 ? (
                    <View className="h-10 flex items-center justify-center border border-gray-200 rounded-md bg-gray-50">
                      <Text className="text-sm text-gray-400">该楼层暂无空床位</Text>
                    </View>
                  ) : (
                    <Picker
                      mode="selector"
                      range={getFilteredBeds().map(b => {
                        // 根据宿舍类型显示床位信息
                        if (transferData.dormitory === 'nantwo' && b.room) {
                          return `${b.floor}楼${b.room}房${b.bed_number}号床 ${b.position === 'upper' ? '上铺' : '下铺'}`
                        }
                        return `${b.floor}楼${b.bed_number}号床 ${b.position === 'upper' ? '上铺' : '下铺'}`
                      })}
                      value={targetBedId ? getFilteredBeds().findIndex(b => b.id === targetBedId) : 0}
                      onChange={(e) => {
                        const beds = getFilteredBeds()
                        const selectedBed = beds[e.detail.value]
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
                  <View className="bg-green-50 rounded-lg p-3">
                    <View className="flex items-center gap-2 mb-2">
                      <View className="flex items-center gap-1">
                        <Text className="text-xs text-gray-500">从</Text>
                        <Text className="text-sm text-gray-600 font-medium">
                          {formatBedDisplay(decodedFloor, decodedBedNumber, position || '', decodedRoom)}
                        </Text>
                      </View>
                      <ArrowRight size={14} color="#22c55e" />
                      <View className="flex items-center gap-1">
                        <Text className="text-xs text-gray-500">到</Text>
                        <Text className="text-sm text-green-600 font-medium">
                          {getTargetBedText()}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-xs text-gray-500 block">
                      转移后人员信息保持不变，仅更换床位
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View className="flex flex-col items-center justify-center py-8">
                <Text className="text-sm text-gray-400 block mb-2">当前宿舍暂无空床位</Text>
                <Text className="text-xs text-gray-400">无法进行床位转移</Text>
              </View>
            )}
          </View>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransferDialog(false)}>取消</Button>
            <Button 
              className="bg-blue-500 text-white" 
              onClick={handleTransfer}
              disabled={submitting || !targetBedId || !transferData || transferData.transferableBeds.length === 0}
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

      {/* 床位互换对话框 */}
      <Dialog open={showSwapDialog} onOpenChange={setShowSwapDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>床位互换</DialogTitle>
          </DialogHeader>
          <View className="py-4">
            <View className="space-y-4">
              {/* 当前信息 */}
              <View className="bg-purple-50 rounded-lg p-3">
                <Text className="text-xs text-gray-500 block mb-1">当前人员</Text>
                <Text className="text-sm text-purple-600 font-medium">{decodedName}</Text>
                <Text className="text-xs text-gray-500 block">
                  {formatBedDisplay(decodedFloor, decodedBedNumber, position || '', decodedRoom)}
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
                  range={getSwapAvailableFloors().map(f => `${f}楼`)}
                  value={getSwapAvailableFloors().findIndex(f => f.toString() === swapFloor)}
                  onChange={(e) => {
                    const floors = getSwapAvailableFloors()
                    if (floors[e.detail.value]) {
                      setSwapFloor(floors[e.detail.value].toString())
                      setSwapTargetBedId(null)
                    }
                  }}
                >
                  <View className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm items-center">
                    <Text className="text-foreground">{swapFloor || '选择楼层'}楼</Text>
                  </View>
                </Picker>
              </View>

              {/* 选择目标床位（上下铺） */}
              <View>
                <Text className="text-sm text-gray-700 flex items-center gap-1 mb-2">
                  <Bed size={14} color="#6b7280" />
                  <Text>选择床位</Text>
                </Text>
                {getFilteredSwapBeds().length === 0 ? (
                  <View className="h-10 flex items-center justify-center border border-gray-200 rounded-md bg-gray-50">
                    <Text className="text-sm text-gray-400">该楼层暂无床位</Text>
                  </View>
                ) : (
                  <Picker
                    mode="selector"
                    range={getFilteredSwapBeds().map(b => formatSwapBedDisplay(b))}
                    value={swapTargetBedId ? getFilteredSwapBeds().findIndex(b => b.id === swapTargetBedId) : 0}
                    onChange={(e) => {
                      const beds = getFilteredSwapBeds()
                      const selectedBed = beds[e.detail.value]
                      if (selectedBed) {
                        setSwapTargetBedId(selectedBed.id)
                      }
                    }}
                  >
                    <View className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm items-center">
                      <Text className={swapTargetBedId ? 'text-foreground' : 'text-muted-foreground'}>
                        {getSwapTargetBedText()}
                      </Text>
                    </View>
                  </Picker>
                )}
              </View>

              {/* 互换提示 */}
              {swapTargetBedId && (
                <View className="bg-green-50 rounded-lg p-3">
                  <View className="flex items-center gap-2 mb-2">
                    <View className="flex items-center gap-1">
                      <Text className="text-xs text-gray-500">当前</Text>
                      <Text className="text-sm text-gray-600 font-medium">
                        {formatBedDisplay(decodedFloor, decodedBedNumber, position || '', decodedRoom)}
                      </Text>
                    </View>
                    <ArrowRight size={14} color="#22c55e" />
                    <View className="flex items-center gap-1">
                      <Text className="text-xs text-gray-500">目标</Text>
                      <Text className="text-sm text-green-600 font-medium">
                        {getSwapTargetBedText()}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-xs text-gray-500 block">
                    互换后，当前人员到目标床位，目标床位人员到当前床位
                  </Text>
                </View>
              )}
            </View>
          </View>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSwapDialog(false)}>取消</Button>
            <Button
              className="bg-purple-500 text-white"
              onClick={handleSwapBed}
              disabled={submitting || !swapTargetBedId}
            >
              {submitting ? '处理中...' : '确认互换'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 站点选择对话框 */}
      <Dialog open={showStationDialog} onOpenChange={setShowStationDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>选择站点标注</DialogTitle>
          </DialogHeader>
          <View className="py-4 space-y-3">
            <Button
              className={`w-full py-3 rounded-lg border ${stationName === 'exhibition' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
              onClick={() => handleSelectStation('exhibition')}
              disabled={submitting}
            >
              <View className="flex items-center justify-center gap-2">
                <MapPin size={16} color={stationName === 'exhibition' ? '#fff' : '#6b7280'} />
                <Text className={stationName === 'exhibition' ? 'text-white' : 'text-gray-700'}>会展中心站</Text>
              </View>
            </Button>
            <Button
              className={`w-full py-3 rounded-lg border ${stationName === 'wuyue' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
              onClick={() => handleSelectStation('wuyue')}
              disabled={submitting}
            >
              <View className="flex items-center justify-center gap-2">
                <MapPin size={16} color={stationName === 'wuyue' ? '#fff' : '#6b7280'} />
                <Text className={stationName === 'wuyue' ? 'text-white' : 'text-gray-700'}>吾悦广场站</Text>
              </View>
            </Button>
            <Button
              className={`w-full py-3 rounded-lg border ${stationName === 'rider' ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
              onClick={() => handleSelectStation('rider')}
              disabled={submitting}
            >
              <View className="flex items-center justify-center gap-2">
                <MapPin size={16} color={stationName === 'rider' ? '#fff' : '#6b7280'} />
                <Text className={stationName === 'rider' ? 'text-white' : 'text-gray-700'}>众包骑手</Text>
              </View>
            </Button>
            {stationName && (
              <Button
                className="w-full py-3 rounded-lg border bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200"
                onClick={() => handleSelectStation(null)}
                disabled={submitting}
              >
                <Text className="text-gray-500">取消标注</Text>
              </Button>
            )}
          </View>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStationDialog(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 红名标记确认对话框 */}
      <AlertDialog open={showFlagConfirmDialog} onOpenChange={setShowFlagConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isFlagged ? '取消红名标记' : '设置红名标记'}</AlertDialogTitle>
            <AlertDialogDescription>
              {isFlagged 
                ? '确定要取消该人员的红名标记吗？取消后姓名将恢复正常颜色。'
                : '确定要将该人员标记为红名吗？标记后姓名将显示为红色，以便重点关注。'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowFlagConfirmDialog(false)}>取消</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleToggleFlag}
              className={isFlagged ? 'bg-gray-500 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'}
            >
              {isFlagged ? '取消标记' : '确认标记'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </View>
  )
}

export default DetailPage
