import { View, Text, Checkbox } from '@tarojs/components'
import { useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Network } from '@/network'
import { LogOut, Calendar, Bed, Building, User, ChevronDown, ChevronUp, Trash2, X } from 'lucide-react-taro'
import { PasswordDialog } from '@/components/PasswordDialog'
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
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)

  useDidShow(() => {
    loadRecords()
  })

  const loadRecords = async () => {
    setLoading(true)
    try {
      const res = await Network.request({
        url: '/api/checkout/list'
      })

      console.log('[CheckOut] 搬离记录响应:', res.data)

      if (res.data?.code === 200 && res.data?.data) {
        // 后端已返回驼峰命名，直接使用
        const formattedRecords = res.data.data.map((record: any) => ({
          id: record.id,
          checkInId: record.checkInId || record.check_in_id,
          bedId: record.bedId || record.bed_id,
          name: record.name,
          idCard: record.idCard || record.id_card,
          phone: record.phone,
          checkInTime: record.checkInTime || record.check_in_time,
          checkOutTime: record.checkOutTime || record.check_out_time,
          floor: record.floor,
          bedNumber: record.bedNumber || record.bed_number,
          position: record.position
        }))
        setRecords(formattedRecords)
        // 保存到本地缓存
        Taro.setStorageSync('checkOutRecords', formattedRecords)
        console.log('[CheckOut] 数据已缓存到本地')
      } else {
        // 尝试从本地缓存加载
        const cachedData = Taro.getStorageSync('checkOutRecords')
        if (cachedData && cachedData.length > 0) {
          console.log('[CheckOut] 使用本地缓存数据')
          setRecords(cachedData)
          Taro.showToast({ title: '使用离线数据', icon: 'none' })
        } else {
          setRecords([])
        }
      }
    } catch (error) {
      console.error('[CheckOut] 加载搬离记录失败:', error)
      // 尝试从本地缓存加载
      const cachedData = Taro.getStorageSync('checkOutRecords')
      if (cachedData && cachedData.length > 0) {
        console.log('[CheckOut] 网络错误，使用本地缓存数据')
        setRecords(cachedData)
        Taro.showToast({ title: '网络不可用，显示离线数据', icon: 'none', duration: 3000 })
      } else {
        setRecords([])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleNameClick = (record: CheckOutRecord) => {
    if (isSelectMode) {
      toggleSelect(record.id)
      return
    }
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

  const toggleSelect = (id: number) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === records.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(records.map(r => r.id)))
    }
  }

  const enterSelectMode = () => {
    setIsSelectMode(true)
    setSelectedIds(new Set())
  }

  const exitSelectMode = () => {
    setIsSelectMode(false)
    setSelectedIds(new Set())
  }

  // 打开密码对话框
  const handleBatchDeleteClick = () => {
    if (selectedIds.size === 0) {
      Taro.showToast({
        title: '请选择要删除的记录',
        icon: 'none'
      })
      return
    }
    setShowPasswordDialog(true)
  }

  // 密码验证成功后执行删除
  const executeBatchDelete = async () => {
    setShowPasswordDialog(false)
    setDeleting(true)
    try {
      const ids = Array.from(selectedIds)
      const response = await Network.request({
        url: '/api/checkout/batch-delete',
        method: 'POST',
        data: { ids }
      })

      if (response.data?.code === 200) {
        Taro.showToast({
          title: `成功删除 ${ids.length} 条记录`,
          icon: 'success'
        })
        // 从本地列表中移除已删除的记录
        setRecords(prev => prev.filter(r => !selectedIds.has(r.id)))
        setSelectedIds(new Set())
        setIsSelectMode(false)
      } else {
        Taro.showToast({
          title: response.data?.msg || '删除失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('批量删除失败:', error)
      Taro.showToast({
        title: '删除失败',
        icon: 'none'
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex items-center justify-between">
          <View>
            <Text className="text-lg font-semibold text-gray-800">搬离记录</Text>
            <Text className="text-xs text-gray-500 block mt-1">
              点击楼层查看搬离情况，共 {records.length} 条记录
            </Text>
          </View>
          {!isSelectMode && records.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={enterSelectMode}
              className="text-xs"
            >
              <Trash2 size={14} color="#6b7280" className="mr-1" />
              批量删除
            </Button>
          )}
        </View>
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
          {/* 选择模式工具栏 */}
          {isSelectMode && (
            <View className="bg-blue-50 rounded-lg p-3 mb-3 flex items-center justify-between">
              <View className="flex items-center gap-2">
                <Checkbox
                  value="selectAll"
                  checked={selectedIds.size === records.length}
                  onClick={toggleSelectAll}
                  color="#1890ff"
                />
                <Text className="text-sm text-blue-600">
                  全选 ({selectedIds.size}/{records.length})
                </Text>
              </View>
              <View className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={exitSelectMode}
                  className="text-xs"
                >
                  <X size={14} color="#6b7280" />
                  取消
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleBatchDeleteClick}
                  disabled={selectedIds.size === 0 || deleting}
                  className="text-xs"
                >
                  <Trash2 size={14} color="#fff" className="mr-1" />
                  {deleting ? '删除中...' : `删除(${selectedIds.size})`}
                </Button>
              </View>
            </View>
          )}

          {floors.map((floor) => (
            <Card key={floor} className="overflow-hidden">
              <CardHeader 
                className="pb-3 bg-gray-50 cursor-pointer"
                onClick={() => !isSelectMode && toggleFloor(floor)}
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
                  {!isSelectMode && (
                    <View className="flex items-center">
                      {expandedFloor === floor ? (
                        <ChevronUp size={20} color="#6b7280" />
                      ) : (
                        <ChevronDown size={20} color="#6b7280" />
                      )}
                    </View>
                  )}
                </View>
              </CardHeader>
              
              {(expandedFloor === floor || isSelectMode) && (
                <CardContent className="p-3 space-y-3 border-t border-gray-200">
                  {groupedByFloor[floor].map((record) => (
                    <View
                      key={record.id}
                      className={`bg-gray-50 rounded-lg p-3 border ${
                        selectedIds.has(record.id) 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-100'
                      }`}
                    >
                      {isSelectMode && (
                        <View className="flex items-center gap-2 mb-2">
                          <Checkbox
                            value={String(record.id)}
                            checked={selectedIds.has(record.id)}
                            onClick={() => toggleSelect(record.id)}
                            color="#1890ff"
                          />
                          <Text className="text-sm text-gray-700 font-medium">
                            {record.name}
                          </Text>
                        </View>
                      )}
                      
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

      {/* 密码验证对话框 */}
      <PasswordDialog
        open={showPasswordDialog}
        title="删除验证"
        confirmText="确认删除"
        onConfirm={executeBatchDelete}
        onCancel={() => setShowPasswordDialog(false)}
      />
    </View>
  )
}

export default CheckOutPage
