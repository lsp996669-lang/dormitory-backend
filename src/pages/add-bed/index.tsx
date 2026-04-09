import { View, Text, Picker } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bed, Plus, Building, ChevronRight, House, Check, CircleAlert } from 'lucide-react-taro'
import { Cloud } from '@/cloud'
import { Network } from '@/network'
import './index.css'

const AddBedPage = () => {
  // 宿舍区域选择
  const [dormitoryIndex, setDormitoryIndex] = useState(0)
  const dormitories = ['南四巷180号', '南二巷24号']
  const dormitoryValues = ['nansi', 'nantwo']

  // 楼层选择
  const [floorIndex, setFloorIndex] = useState(0)
  const floors = ['2楼', '3楼', '4楼']
  const floorValues = [2, 3, 4]

  // 房间数据
  const [rooms, setRooms] = useState<string[]>([])
  const [roomIndex, setRoomIndex] = useState(0)

  // 床位编号
  const [bedNumber, setBedNumber] = useState('')

  // 状态
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')

  // 南二巷房间配置
  const nanTwoRoomsConfig: Record<number, string[]> = {
    2: ['201', '202', '203', '204'],
    3: ['301', '302', '303', '304'],
    4: ['401', '402', '大厅']
  }

  // 南四巷房间配置（每层15个床位）
  const nanSiRoomsConfig: Record<number, string[]> = {
    2: Array.from({ length: 15 }, (_, i) => (i + 1).toString()),
    3: Array.from({ length: 15 }, (_, i) => (i + 1).toString()),
    4: Array.from({ length: 15 }, (_, i) => (i + 1).toString())
  }

  // 处理宿舍区域变化
  const handleDormitoryChange = (e: any) => {
    setDormitoryIndex(e.detail.value)
    handleFloorChange({ detail: { value: floorIndex } })
  }

  // 处理楼层变化
  const handleFloorChange = (e: any) => {
    setFloorIndex(e.detail.value)
    const floor = floorValues[e.detail.value]
    const dorm = dormitoryValues[dormitoryIndex]

    // 更新房间列表
    if (dorm === 'nantwo') {
      setRooms(nanTwoRoomsConfig[floor] || [])
    } else {
      setRooms(nanSiRoomsConfig[floor] || [])
    }

    setRoomIndex(0)
  }

  // 处理房间变化
  const handleRoomChange = (e: any) => {
    setRoomIndex(e.detail.value)
  }

  // 添加床位
  const handleAddBed = async () => {
    const dorm = dormitoryValues[dormitoryIndex]
    const floor = floorValues[floorIndex]
    const room = rooms[roomIndex]

    if (!bedNumber.trim()) {
      Taro.showToast({ title: '请输入床位编号', icon: 'none' })
      return
    }

    setLoading(true)
    setResult('')

    try {
      console.log('[AddBed] 开始添加床位:', {
        dormitory: dorm,
        floor,
        room,
        bedNumber: bedNumber.trim()
      })

      let res
      if (dorm === 'nantwo') {
        // 南二巷：调用云函数
        res = await Cloud.callFunction('addBed', {
          dormitory: 'nantwo',
          floor,
          room,
          bedNumber: bedNumber.trim()
        })
      } else {
        // 南四巷：使用网络请求
        const networkRes = await Network.request({
          url: '/api/beds/add',
          method: 'POST',
          data: {
            dormitory: 'nansi',
            floor,
            room: room,
            bedNumber: parseInt(bedNumber.trim(), 10)
          }
        })
        res = { result: networkRes.data }
      }

      console.log('[AddBed] 添加结果:', res)

      if (res.result?.code === 200) {
        setResult(`✅ 成功：${res.result.msg}`)
        Taro.showToast({ title: '添加成功', icon: 'success' })

        // 清空床位编号，方便继续添加
        setBedNumber('')
      } else {
        setResult(`❌ 失败：${res.result?.msg || '未知错误'}`)
        Taro.showToast({ title: res.result?.msg || '添加失败', icon: 'none' })
      }
    } catch (error) {
      console.error('[AddBed] 添加床位失败:', error)
      setResult(`❌ 异常：${error.errMsg || error.message}`)
      Taro.showToast({ title: '调用失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="min-h-screen bg-gray-50 p-4">
      {/* 头部标题 */}
      <Card className="mb-4 border-2 border-blue-200">
        <CardHeader className="pb-3 bg-blue-50">
          <View className="flex items-center gap-3">
            <View className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Plus size={20} color="#2563eb" />
            </View>
            <View>
              <CardTitle className="text-lg">添加床位</CardTitle>
              <Text className="text-xs text-gray-500">为宿舍房间添加新床位（上下铺）</Text>
            </View>
          </View>
        </CardHeader>
      </Card>

      {/* 表单 */}
      <Card className="mb-4">
        <CardContent className="p-4 space-y-4">
          {/* 宿舍区域 */}
          <View>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              <Building size={16} color="#6b7280" className="inline mr-1" />
              宿舍区域
            </Label>
            <Picker
              mode="selector"
              range={dormitories}
              value={dormitoryIndex}
              onChange={handleDormitoryChange}
            >
              <View className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3">
                <Text className="text-gray-800">{dormitories[dormitoryIndex]}</Text>
                <ChevronRight size={16} color="#9ca3af" />
              </View>
            </Picker>
          </View>

          {/* 楼层 */}
          <View>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              <House size={16} color="#6b7280" className="inline mr-1" />
              楼层
            </Label>
            <Picker
              mode="selector"
              range={floors}
              value={floorIndex}
              onChange={handleFloorChange}
            >
              <View className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3">
                <Text className="text-gray-800">{floors[floorIndex]}</Text>
                <ChevronRight size={16} color="#9ca3af" />
              </View>
            </Picker>
          </View>

          {/* 房间 */}
          <View>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              <Bed size={16} color="#6b7280" className="inline mr-1" />
              房间号
            </Label>
            {rooms.length > 0 ? (
              <Picker
                mode="selector"
                range={rooms}
                value={roomIndex}
                onChange={handleRoomChange}
              >
                <View className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3">
                  <Text className="text-gray-800">{rooms[roomIndex]} 房</Text>
                  <ChevronRight size={16} color="#9ca3af" />
                </View>
              </Picker>
            ) : (
              <View className="bg-gray-100 border border-gray-200 rounded-lg px-4 py-3">
                <Text className="text-gray-500">暂无房间数据</Text>
              </View>
            )}
          </View>

          {/* 床位编号 */}
          <View>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              <Plus size={16} color="#6b7280" className="inline mr-1" />
              床位编号
            </Label>
            <Input
              className="bg-white"
              placeholder="请输入床位编号（如：3）"
              type="number"
              value={bedNumber}
              onInput={(e) => setBedNumber(e.detail.value)}
            />
            <Text className="text-xs text-gray-500 mt-1">
              提示：将同时添加上铺和下铺
            </Text>
          </View>

          {/* 添加按钮 */}
          <Button
            className="w-full bg-blue-600 text-white"
            onClick={handleAddBed}
            disabled={loading || rooms.length === 0}
          >
            {loading ? '添加中...' : '添加床位'}
          </Button>
        </CardContent>
      </Card>

      {/* 结果显示 */}
      {result && (
        <Card>
          <CardContent className="p-4">
            <View className="flex items-start gap-2">
              {result.includes('✅') ? (
                <Check size={20} color="#22c55e" />
              ) : (
                <CircleAlert size={20} color="#ef4444" />
              )}
              <Text className="text-sm text-gray-700 flex-1 whitespace-pre-wrap">{result}</Text>
            </View>
          </CardContent>
        </Card>
      )}

      {/* 提示信息 */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4">
          <View className="flex items-start gap-2">
            <CircleAlert size={16} color="#f59e0b" />
            <View>
              <Text className="text-sm font-medium text-amber-800 mb-1">使用说明</Text>
              <Text className="text-xs text-amber-700">
                1. 选择宿舍区域、楼层和房间号{'\n'}
                2. 输入要添加的床位编号{'\n'}
                3. 点击&quot;添加床位&quot;按钮{'\n'}
                4. 系统会自动创建该床位的上铺和下铺
              </Text>
            </View>
          </View>
        </CardContent>
      </Card>
    </View>
  )
}

export default AddBedPage
