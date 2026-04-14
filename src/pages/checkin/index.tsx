import { View, Text, Picker } from '@tarojs/components'
import { useState } from 'react'
import Taro, { useRouter, useDidShow, usePullDownRefresh } from '@tarojs/taro'
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
import { Bed, User, Phone, CreditCard, Calendar, DoorOpen } from 'lucide-react-taro'
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
  bedNumber: number
  position: string
  status: string
  room?: string
  dormitory?: string
  checkIn?: {
    id: number
    name: string
    idCard: string
    phone: string
    checkInTime: string
    isStationMarked?: boolean
    isRider?: boolean
    isFlagged?: boolean
    stationName?: string | null
  }
}

const CheckInPage = () => {
  const router = useRouter()
  const { floor: floorParam, dormitory, room } = router.params
  const floor = parseInt(floorParam || '1', 10)
  const isNanTwo = dormitory === 'nanTwo'

  const [beds, setBeds] = useState<BedInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBed, setSelectedBed] = useState<BedInfo | null>(null)
  const [showForm, setShowForm] = useState(false)

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

  usePullDownRefresh(() => {
    console.log('[CheckIn] 触发下拉刷新')
    loadBeds().finally(() => {
      Taro.stopPullDownRefresh()
    })
  })

  const loadBeds = async () => {
    setLoading(true)
    try {
      let url = '/api/beds/floor/' + floor
      let cacheKey = `beds_floor_${floor}`

      // 南二巷宿舍使用不同的API
      if (isNanTwo) {
        if (room) {
          url = `/api/beds/nantwo/floor/${floor}/room/${room}`
          cacheKey = `beds_nantwo_${floor}_${room}`
        } else {
          // 获取整个楼层的床位
          url = `/api/beds/nantwo/floor/${floor}/beds`
          cacheKey = `beds_nantwo_floor_${floor}`
        }
      }

      console.log(`[CheckIn] 开始加载床位数据，URL: ${url}`)

      // 添加超时控制（15秒）
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('请求超时')), 15000)
      })

      const res = await Promise.race([
        Network.request({ url }),
        timeoutPromise
      ]) as any

      console.log('[CheckIn] 床位数据响应:', res)
      console.log('[CheckIn] 响应状态码:', res.statusCode)
      console.log('[CheckIn] 响应数据:', res.data)

      if (res.statusCode !== 200) {
        console.error('[CheckIn] 请求失败，状态码:', res.statusCode)
        // 尝试从本地缓存加载
        const cachedData = Taro.getStorageSync(cacheKey)
        if (cachedData && cachedData.length > 0) {
          console.log('[CheckIn] 使用本地缓存数据')
          setBeds(cachedData)
          Taro.showToast({ title: '使用离线数据', icon: 'none' })
        } else {
          const errorMsg = res.statusCode === 408 ? '请求超时' : `请求失败: ${res.statusCode}`
          Taro.showToast({ title: errorMsg, icon: 'none', duration: 3000 })
          setBeds([])
        }
        return
      }

      if (res.data?.code === 200 && res.data?.data) {
        // 转换字段名：蛇形命名 -> 驼峰命名
        const formattedBeds = res.data.data.map((bed: any) => ({
          id: bed.id,
          floor: bed.floor,
          bedNumber: bed.bed_number,
          position: bed.position,
          status: bed.status,
          room: bed.room,
          dormitory: bed.dormitory,
          checkIn: bed.checkIn ? {
            id: bed.checkIn.id,
            name: bed.checkIn.name,
            idCard: bed.checkIn.id_card,
            phone: bed.checkIn.phone,
            checkInTime: bed.checkIn.check_in_time,
            isStationMarked: bed.checkIn.is_station_marked ?? false,
            isRider: bed.checkIn.is_rider ?? false,
            isFlagged: bed.checkIn.is_flagged ?? false,
            stationName: bed.checkIn.station_name ?? null,
          } : undefined
        }))
        console.log(`[CheckIn] 格式化后的床位数据: ${formattedBeds.length} 条`)
        setBeds(formattedBeds)
        // 保存到本地缓存
        Taro.setStorageSync(cacheKey, formattedBeds)
        console.log('[CheckIn] 数据已缓存到本地:', cacheKey)
      } else {
        console.error('[CheckIn] 响应数据格式错误:', res.data)
        // 尝试从本地缓存加载
        const cachedData = Taro.getStorageSync(cacheKey)
        if (cachedData && cachedData.length > 0) {
          console.log('[CheckIn] 使用本地缓存数据')
          setBeds(cachedData)
        } else {
          Taro.showToast({ title: res.data?.msg || '数据加载失败', icon: 'none' })
          setBeds([])
        }
      }
    } catch (error) {
      console.error('[CheckIn] 加载床位失败:', error)

      // 尝试从本地缓存加载
      const cacheKey = isNanTwo && room ? `beds_nantwo_${floor}_${room}` : `beds_floor_${floor}`
      const cachedData = Taro.getStorageSync(cacheKey)

      if (cachedData && cachedData.length > 0) {
        console.log('[CheckIn] 网络错误，使用本地缓存数据')
        setBeds(cachedData)

        // 根据错误类型显示不同的提示
        let errorMsg = '网络不可用，显示离线数据'
        if (error instanceof Error) {
          if (error.message === '请求超时') {
            errorMsg = '请求超时，显示离线数据'
          } else if (error.message.includes('network')) {
            errorMsg = '网络连接失败，显示离线数据'
          }
        }
        Taro.showToast({ title: errorMsg, icon: 'none', duration: 3000 })
      } else {
        let errorMsg = '网络请求失败，请检查网络连接'
        if (error instanceof Error) {
          if (error.message === '请求超时') {
            errorMsg = '请求超时，请稍后重试'
          } else if (error.message.includes('network')) {
            errorMsg = '网络连接失败，请检查网络设置'
          }
        }
        Taro.showToast({ title: errorMsg, icon: 'none', duration: 3000 })
        setBeds([])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleBedClick = (bed: BedInfo) => {
    if (bed.status === 'maintenance') {
      // 维修中的床位，询问是否取消维修中状态
      Taro.showModal({
        title: '床位维修中',
        content: '该床位正在维修中，暂时无法入住。是否要取消维修状态？',
        confirmText: '取消维修',
        cancelText: '关闭',
        success: async (res) => {
          if (res.confirm) {
            // 检查登录状态
            if (!checkLogin()) {
              promptLogin()
              return
            }
            try {
              const result = await Network.request({
                url: `/api/beds/maintenance/${bed.id}/cancel`,
                method: 'POST'
              })
              if (result.data?.code === 200) {
                Taro.showToast({ title: '已取消维修', icon: 'success' })
                loadBeds()
              } else {
                Taro.showToast({ title: result.data?.msg || '操作失败', icon: 'none' })
              }
            } catch (error) {
              console.error('取消维修失败:', error)
              Taro.showToast({ title: '操作失败，请稍后重试', icon: 'none' })
            }
          }
        }
      })
    } else if (bed.status === 'empty') {
      // 检查登录状态
      if (!checkLogin()) {
        promptLogin()
        return
      }
      // 空床位：显示操作选项（入住 或 设为维修）
      Taro.showActionSheet({
        itemList: ['入住登记', '设为维修中'],
        success: (res) => {
          if (res.tapIndex === 0) {
            // 入住登记
            setSelectedBed(bed)
            const today = new Date()
            const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
            setFormData({
              name: '',
              idCard: '',
              phone: '',
              checkInDate: dateStr
            })
            setShowForm(true)
          } else if (res.tapIndex === 1) {
            // 设为维修中
            Taro.showModal({
              title: '设置维修中',
              content: `确定将 ${bed.bedNumber}号床 ${getPositionLabel(bed.position)} 设置为维修中吗？`,
              confirmText: '确定',
              cancelText: '取消',
              success: async (modalRes) => {
                if (modalRes.confirm) {
                  try {
                    const result = await Network.request({
                      url: `/api/beds/maintenance/${bed.id}`,
                      method: 'POST'
                    })
                    if (result.data?.code === 200) {
                      Taro.showToast({ title: '已设为维修中', icon: 'success' })
                      loadBeds()
                    } else {
                      Taro.showToast({ title: result.data?.msg || '设置失败', icon: 'none' })
                    }
                  } catch (error) {
                    console.error('设置维修中失败:', error)
                    Taro.showToast({ title: '设置失败，请稍后重试', icon: 'none' })
                  }
                }
              }
            })
          }
        }
      })
    } else {
      // 已入住的床位，点击名字查看详情（不需要登录）
      if (bed.checkIn) {
        Taro.navigateTo({
          url: `/pages/detail/index?name=${encodeURIComponent(bed.checkIn.name)}&idCard=${encodeURIComponent(bed.checkIn.idCard)}&phone=${encodeURIComponent(bed.checkIn.phone)}&checkInTime=${encodeURIComponent(bed.checkIn.checkInTime)}&floor=${floor}&bedNumber=${bed.bedNumber}&position=${bed.position}&checkInId=${bed.checkIn.id}&bedId=${bed.id}&dormitory=${bed.dormitory || 'nansi'}&room=${bed.room || ''}&isStationMarked=${bed.checkIn.isStationMarked ?? false}&isRider=${bed.checkIn.isRider ?? false}&isFlagged=${bed.checkIn.isFlagged ?? false}`
        })
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
          {isNanTwo ? `南二巷24号宿舍 - ${floor}楼${room ? ` - ${room}` : ''}` : `南四巷180号宿舍 - ${floor}楼`} - 入住登记
        </Text>
        <Text className="text-xs text-gray-500 block mt-1">
          点击空床位进行入住登记，点击已入住床位查看详情
        </Text>
      </View>

      {loading ? (
        <View className="flex justify-center items-center py-12">
          <Text className="text-gray-400">加载中...</Text>
        </View>
      ) : isNanTwo && !room ? (
        // 南二巷宿舍楼层视图 - 按房间分组显示
        <View className="p-4 space-y-4">
          {Array.from(new Set(beds.map(b => b.room))).sort().map((roomName) => {
            const roomBeds = beds.filter(b => b.room === roomName)
            const bedNumbers = Array.from(new Set(roomBeds.map(b => b.bedNumber))).sort((a, b) => a - b)
            
            return (
              <View key={roomName} className="bg-white rounded-lg border border-purple-200 overflow-hidden">
                <View className="bg-purple-50 px-4 py-2 border-b border-purple-200">
                  <View className="flex items-center gap-2">
                    <DoorOpen size={16} color="#9333ea" />
                    <Text className="text-sm font-medium text-purple-700">{roomName}</Text>
                    <Text className="text-xs text-gray-500">
                      ({bedNumbers.length}张床 {roomBeds.length}个铺位)
                    </Text>
                  </View>
                </View>
                <View className="p-3">
                  <View className="grid grid-cols-2 gap-3">
                    {bedNumbers.map((bedNum) => {
                      const upperBed = roomBeds.find(b => b.bedNumber === bedNum && b.position === 'upper')
                      const lowerBed = roomBeds.find(b => b.bedNumber === bedNum && b.position === 'lower')

                      return (
                        <View key={bedNum} className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                          <View className="bg-gradient-to-r from-gray-100 to-gray-50 px-3 py-2 border-b border-gray-200">
                            <Text className="text-xs font-semibold text-gray-600">{bedNum}号床</Text>
                          </View>
                          <View className="p-2 space-y-2">
                            {/* 上铺 */}
                            <View
                              className={`rounded-lg p-2 cursor-pointer transition-all ${
                                upperBed?.status === 'occupied'
                                  ? `bg-green-50 border ${upperBed.checkIn?.isFlagged ? 'border-red-500 border-2' : 'border-green-200'} shadow-sm`
                                  : upperBed?.status === 'maintenance'
                                  ? 'bg-orange-50 border border-orange-200 shadow-sm'
                                  : 'bg-white border border-gray-200'
                              }`}
                              onClick={() => upperBed && handleBedClick(upperBed)}
                            >
                              <View className="flex items-center justify-between">
                                <View className="flex items-center gap-1">
                                  <Bed size={14} color={upperBed?.status === 'occupied' ? '#22c55e' : upperBed?.status === 'maintenance' ? '#f97316' : '#9ca3af'} />
                                  <Text className={`text-xs font-medium ${
                                    upperBed?.status === 'occupied' ? 'text-green-700' : upperBed?.status === 'maintenance' ? 'text-orange-700' : 'text-gray-500'
                                  }`}
                                  >
                                    上铺
                                  </Text>
                                </View>
                                {upperBed?.status === 'occupied' && (
                                  <Badge className="bg-green-500 text-white text-xs">已入住</Badge>
                                )}
                                {upperBed?.status === 'maintenance' && (
                                  <Badge className="bg-orange-500 text-white text-xs">维修中</Badge>
                                )}
                              </View>
                              {upperBed?.status === 'empty' && (
                                <Text className="text-xs text-gray-400 block mt-1">点击登记</Text>
                              )}
                              {upperBed?.status === 'maintenance' && (
                                <Text className="text-xs text-orange-500 block mt-1">维修中，暂停入住</Text>
                              )}
                              {upperBed?.status === 'occupied' && upperBed.checkIn && (
                                <View className="mt-1">
                                  <View className="flex items-center gap-2 flex-wrap">
                                    <Text className={`text-xs font-semibold ${upperBed.checkIn.isFlagged ? 'text-red-600' : 'text-blue-600'}`}>{upperBed.checkIn.name}</Text>
                                    {upperBed.checkIn.isFlagged && (
                                      <Badge className="bg-red-500 text-white text-xs">!</Badge>
                                    )}
                                    {/* 站点标注标签 */}
                                    {upperBed.checkIn.stationName && (
                                      <Badge className={`text-xs ${upperBed.checkIn.stationName === 'rider' ? 'bg-green-500' : 'bg-blue-500'} text-white`}>
                                        <Text className="text-white text-xs">
                                          {upperBed.checkIn.stationName === 'exhibition' ? '会展' : upperBed.checkIn.stationName === 'wuyue' ? '吾悦' : '骑手'}
                                        </Text>
                                      </Badge>
                                    )}
                                  </View>
                                  <Text className="text-xs text-gray-500 block mt-1">
                                    入住: {formatDate(upperBed.checkIn.checkInTime)}
                                  </Text>
                                </View>
                              )}
                            </View>

                            {/* 下铺 */}
                            <View
                              className={`rounded-lg p-2 cursor-pointer transition-all ${
                                lowerBed?.status === 'occupied'
                                  ? `bg-green-50 border ${lowerBed.checkIn?.isFlagged ? 'border-red-500 border-2' : 'border-green-200'} shadow-sm`
                                  : lowerBed?.status === 'maintenance'
                                  ? 'bg-orange-50 border border-orange-200 shadow-sm'
                                  : 'bg-white border border-gray-200'
                              }`}
                              onClick={() => lowerBed && handleBedClick(lowerBed)}
                            >
                              <View className="flex items-center justify-between">
                                <View className="flex items-center gap-1">
                                  <Bed size={14} color={lowerBed?.status === 'occupied' ? '#22c55e' : lowerBed?.status === 'maintenance' ? '#f97316' : '#9ca3af'} />
                                  <Text className={`text-xs font-medium ${
                                    lowerBed?.status === 'occupied' ? 'text-green-700' : lowerBed?.status === 'maintenance' ? 'text-orange-700' : 'text-gray-500'
                                  }`}
                                  >
                                    下铺
                                  </Text>
                                </View>
                                {lowerBed?.status === 'occupied' && (
                                  <Badge className="bg-green-500 text-white text-xs">已入住</Badge>
                                )}
                                {lowerBed?.status === 'maintenance' && (
                                  <Badge className="bg-orange-500 text-white text-xs">维修中</Badge>
                                )}
                              </View>
                              {lowerBed?.status === 'empty' && (
                                <Text className="text-xs text-gray-400 block mt-1">点击登记</Text>
                              )}
                              {lowerBed?.status === 'maintenance' && (
                                <Text className="text-xs text-orange-500 block mt-1">维修中，暂停入住</Text>
                              )}
                              {lowerBed?.status === 'occupied' && lowerBed.checkIn && (
                                <View className="mt-1">
                                  <View className="flex items-center gap-2 flex-wrap">
                                    <Text className={`text-xs font-semibold ${lowerBed.checkIn.isFlagged ? 'text-red-600' : 'text-blue-600'}`}>{lowerBed.checkIn.name}</Text>
                                    {lowerBed.checkIn.isFlagged && (
                                      <Badge className="bg-red-500 text-white text-xs">!</Badge>
                                    )}
                                    {/* 站点标注标签 */}
                                    {lowerBed.checkIn.stationName && (
                                      <Badge className={`text-xs ${lowerBed.checkIn.stationName === 'rider' ? 'bg-green-500' : 'bg-blue-500'} text-white`}>
                                        <Text className="text-white text-xs">
                                          {lowerBed.checkIn.stationName === 'exhibition' ? '会展' : lowerBed.checkIn.stationName === 'wuyue' ? '吾悦' : '骑手'}
                                        </Text>
                                      </Badge>
                                    )}
                                  </View>
                                  <Text className="text-xs text-gray-500 block mt-1">
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
              </View>
            )
          })}
        </View>
      ) : (
        // 南四巷宿舍或南二巷单个房间视图
        <View className="p-4">
          <View className="grid grid-cols-2 gap-3">
            {/* 根据实际床位数量动态显示 */}
            {Array.from(new Set(beds.map(b => b.bedNumber))).sort((a, b) => a - b).map((bedNum) => {
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
                          ? `bg-gradient-to-br from-green-50 to-green-100 border ${upperBed.checkIn?.isFlagged ? 'border-red-500 border-2' : 'border-green-200'} shadow-sm`
                          : upperBed?.status === 'maintenance'
                          ? 'bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 shadow-sm'
                          : 'bg-gray-50 border border-gray-200'
                      }`}
                      onClick={() => upperBed && handleBedClick(upperBed)}
                    >
                      <View className="flex items-center justify-between">
                        <View className="flex items-center gap-2">
                          <Bed size={14} color={upperBed?.status === 'occupied' ? '#22c55e' : upperBed?.status === 'maintenance' ? '#f97316' : '#9ca3af'} />
                          <Text className={`text-xs font-medium ${
                            upperBed?.status === 'occupied' ? 'text-green-700' : upperBed?.status === 'maintenance' ? 'text-orange-700' : 'text-gray-500'
                          }`}
                          >
                            上铺
                          </Text>
                        </View>
                        {upperBed?.status === 'occupied' && (
                          <Badge className="bg-green-500 text-white text-xs px-2">已入住</Badge>
                        )}
                        {upperBed?.status === 'maintenance' && (
                          <Badge className="bg-orange-500 text-white text-xs px-2">维修中</Badge>
                        )}
                      </View>
                      {upperBed?.status === 'empty' && (
                        <Text className="text-xs text-gray-400 block mt-2">点击登记</Text>
                      )}
                      {upperBed?.status === 'maintenance' && (
                        <Text className="text-xs text-orange-500 block mt-2">维修中，暂停入住</Text>
                      )}
                      {upperBed?.status === 'occupied' && upperBed.checkIn && (
                        <View className="mt-2">
                          <View className="flex items-center gap-2 flex-wrap">
                            <Text className={`text-xs font-semibold ${upperBed.checkIn.isFlagged ? 'text-red-600' : 'text-blue-600'}`}>{upperBed.checkIn.name}</Text>
                            {upperBed.checkIn.isFlagged && (
                              <Badge className="bg-red-500 text-white text-xs px-2">!</Badge>
                            )}
                            {/* 站点标注标签 */}
                            {upperBed.checkIn.stationName && (
                              <Badge className={`text-xs ${upperBed.checkIn.stationName === 'rider' ? 'bg-green-500' : 'bg-blue-500'} text-white px-2`}>
                                <Text className="text-white text-xs">
                                  {upperBed.checkIn.stationName === 'exhibition' ? '会展' : upperBed.checkIn.stationName === 'wuyue' ? '吾悦' : '骑手'}
                                </Text>
                              </Badge>
                            )}
                          </View>
                          <Text className="text-xs text-gray-400 block mt-1">
                            入住: {formatDate(upperBed.checkIn.checkInTime)}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* 下铺 */}
                    <View
                      className={`rounded cursor-pointer p-3 ${
                        lowerBed?.status === 'occupied'
                          ? `bg-gradient-to-br from-green-50 to-green-100 border ${lowerBed.checkIn?.isFlagged ? 'border-red-500 border-2' : 'border-green-200'} shadow-sm`
                          : lowerBed?.status === 'maintenance'
                          ? 'bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 shadow-sm'
                          : 'bg-gray-50 border border-gray-200'
                      }`}
                      onClick={() => lowerBed && handleBedClick(lowerBed)}
                    >
                      <View className="flex items-center justify-between">
                        <View className="flex items-center gap-2">
                          <Bed size={14} color={lowerBed?.status === 'occupied' ? '#22c55e' : lowerBed?.status === 'maintenance' ? '#f97316' : '#9ca3af'} />
                          <Text className={`text-xs font-medium ${
                            lowerBed?.status === 'occupied' ? 'text-green-700' : lowerBed?.status === 'maintenance' ? 'text-orange-700' : 'text-gray-500'
                          }`}
                          >
                            下铺
                          </Text>
                        </View>
                        {lowerBed?.status === 'occupied' && (
                          <Badge className="bg-green-500 text-white text-xs px-2">已入住</Badge>
                        )}
                        {lowerBed?.status === 'maintenance' && (
                          <Badge className="bg-orange-500 text-white text-xs px-2">维修中</Badge>
                        )}
                      </View>
                      {lowerBed?.status === 'empty' && (
                        <Text className="text-xs text-gray-400 block mt-2">点击登记</Text>
                      )}
                      {lowerBed?.status === 'maintenance' && (
                        <Text className="text-xs text-orange-500 block mt-2">维修中，暂停入住</Text>
                      )}
                      {lowerBed?.status === 'occupied' && lowerBed.checkIn && (
                        <View className="mt-2">
                          <View className="flex items-center gap-2 flex-wrap">
                            <Text className={`text-xs font-semibold ${lowerBed.checkIn.isFlagged ? 'text-red-600' : 'text-blue-600'}`}>{lowerBed.checkIn.name}</Text>
                            {lowerBed.checkIn.isFlagged && (
                              <Badge className="bg-red-500 text-white text-xs px-2">!</Badge>
                            )}
                            {/* 站点标注标签 */}
                            {lowerBed.checkIn.stationName && (
                              <Badge className={`text-xs ${lowerBed.checkIn.stationName === 'rider' ? 'bg-green-500' : 'bg-blue-500'} text-white px-2`}>
                                <Text className="text-white text-xs">
                                  {lowerBed.checkIn.stationName === 'exhibition' ? '会展' : lowerBed.checkIn.stationName === 'wuyue' ? '吾悦' : '骑手'}
                                </Text>
                              </Badge>
                            )}
                          </View>
                          <Text className="text-xs text-gray-400 block mt-1">
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
            <DialogTitle>床位操作</DialogTitle>
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
          <DialogFooter className="flex flex-row gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setShowForm(false)}
            >取消</Button>
            <Button 
              className="flex-1 bg-blue-600 text-white" 
              onClick={handleFormSubmit}
              disabled={submitting}
            >
              {submitting ? '提交中...' : '确认入住'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </View>
  )
}

export default CheckInPage
