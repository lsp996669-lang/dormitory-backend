import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Users, UserMinus, FileSpreadsheet, Building, RefreshCw } from 'lucide-react-taro'
import { Network } from '@/network'
import './index.css'

interface ExportStats {
  checkInCount: number
  checkOutCount: number
  floorStats: Array<{
    floor: number
    total: number
    occupied: number
    empty: number
  }>
}

const ExportPage = () => {
  const [stats, setStats] = useState<ExportStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await Network.request({
        url: '/api/export/stats',
        method: 'GET',
      })

      console.log('统计数据:', res.data)

      if (res.data?.code === 200 && res.data?.data) {
        setStats(res.data.data)
      }
    } catch (error) {
      console.error('获取统计数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (type: 'checkin' | 'checkout' | 'all') => {
    setExporting(type)
    try {
      const url = `/api/export/${type}`
      
      // 显示加载提示
      Taro.showLoading({ title: '正在导出...' })

      // 下载文件
      const res = await Network.downloadFile({ url })

      Taro.hideLoading()

      if (res.statusCode === 200) {
        // 在小程序中打开文档
        Taro.openDocument({
          filePath: res.tempFilePath,
          fileType: 'xlsx',
          success: () => {
            Taro.showToast({ title: '导出成功', icon: 'success' })
          },
          fail: (err) => {
            console.error('打开文档失败:', err)
            // 如果打开失败，尝试保存到相册或提示用户
            Taro.showToast({ 
              title: '文件已下载', 
              icon: 'success' 
            })
          }
        })
      } else {
        throw new Error('下载失败')
      }
    } catch (error: any) {
      Taro.hideLoading()
      console.error('导出失败:', error)
      Taro.showToast({
        title: error.message || '导出失败',
        icon: 'none'
      })
    } finally {
      setExporting(null)
    }
  }

  return (
    <View className="min-h-screen bg-gray-50 p-4">
      <View className="text-center mb-6">
        <Text className="text-xl font-bold text-gray-800 block">数据导出</Text>
        <Text className="text-sm text-gray-500 block mt-1">导出宿舍管理数据</Text>
      </View>

      {/* 统计卡片 */}
      <Card className="overflow-hidden mb-4">
        <CardContent className="p-4">
          <View className="flex items-center justify-between mb-4">
            <Text className="text-base font-medium text-gray-800">数据统计</Text>
            <View className="cursor-pointer" onClick={fetchStats}>
              <RefreshCw size={18} color="#2563eb" />
            </View>
          </View>

          {loading ? (
            <View className="text-center py-4">
              <Text className="text-sm text-gray-400">加载中...</Text>
            </View>
          ) : stats ? (
            <View className="space-y-3">
              {/* 总体统计 */}
              <View className="flex justify-around bg-gray-50 rounded-lg p-3">
                <View className="text-center">
                  <Text className="text-2xl font-bold text-blue-600 block">{stats.checkInCount}</Text>
                  <Text className="text-xs text-gray-500">当前入住</Text>
                </View>
                <View className="text-center">
                  <Text className="text-2xl font-bold text-green-600 block">{stats.checkOutCount}</Text>
                  <Text className="text-xs text-gray-500">已搬离</Text>
                </View>
              </View>

              {/* 各楼层统计 */}
              <View className="space-y-2">
                {stats.floorStats.map((floor) => (
                  <View key={floor.floor} className="flex items-center justify-between bg-white border border-gray-100 rounded-lg p-2">
                    <View className="flex items-center gap-2">
                      <Building size={16} color="#6b7280" />
                      <Text className="text-sm text-gray-700">{floor.floor}楼</Text>
                    </View>
                    <View className="flex items-center gap-3 text-xs">
                      <Text className="text-blue-600">{floor.occupied}入住</Text>
                      <Text className="text-gray-400">{floor.empty}空闲</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View className="text-center py-4">
              <Text className="text-sm text-gray-400">暂无数据</Text>
            </View>
          )}
        </CardContent>
      </Card>

      {/* 导出按钮 */}
      <View className="space-y-3">
        {/* 导出入住人员 */}
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <View className="flex items-center gap-3 mb-3">
              <View className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Users size={20} color="#2563eb" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-800">导出入住人员</Text>
                <Text className="text-xs text-gray-500">当前所有入住人员名单</Text>
              </View>
            </View>
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => handleExport('checkin')}
              disabled={exporting !== null}
            >
              <View className="flex items-center justify-center gap-2">
                <Download size={16} color="#fff" />
                <Text className="text-white">
                  {exporting === 'checkin' ? '导出中...' : '导出Excel'}
                </Text>
              </View>
            </Button>
          </CardContent>
        </Card>

        {/* 导出搬离人员 */}
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <View className="flex items-center gap-3 mb-3">
              <View className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <UserMinus size={20} color="#22c55e" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-800">导出搬离人员</Text>
                <Text className="text-xs text-gray-500">历史搬离人员记录</Text>
              </View>
            </View>
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              onClick={() => handleExport('checkout')}
              disabled={exporting !== null}
            >
              <View className="flex items-center justify-center gap-2">
                <Download size={16} color="#fff" />
                <Text className="text-white">
                  {exporting === 'checkout' ? '导出中...' : '导出Excel'}
                </Text>
              </View>
            </Button>
          </CardContent>
        </Card>

        {/* 导出全部数据 */}
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <View className="flex items-center gap-3 mb-3">
              <View className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <FileSpreadsheet size={20} color="#9333ea" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-800">导出全部数据</Text>
                <Text className="text-xs text-gray-500">入住+搬离+统计汇总</Text>
              </View>
            </View>
            <Button
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => handleExport('all')}
              disabled={exporting !== null}
            >
              <View className="flex items-center justify-center gap-2">
                <Download size={16} color="#fff" />
                <Text className="text-white">
                  {exporting === 'all' ? '导出中...' : '导出Excel'}
                </Text>
              </View>
            </Button>
          </CardContent>
        </Card>
      </View>

      {/* 使用说明 */}
      <Card className="overflow-hidden mt-4">
        <CardContent className="p-4">
          <Text className="text-sm font-medium text-gray-800 block mb-2">导出说明</Text>
          <View className="space-y-2">
            <Text className="text-xs text-gray-500 block">1. 点击对应按钮导出Excel文件</Text>
            <Text className="text-xs text-gray-500 block">2. 导出的文件可在微信中打开查看</Text>
            <Text className="text-xs text-gray-500 block">3. 支持转发或保存到电脑编辑</Text>
          </View>
        </CardContent>
      </Card>
    </View>
  )
}

export default ExportPage
