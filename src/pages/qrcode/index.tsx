import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Users, UserMinus, FileSpreadsheet, Building, RefreshCw, FolderOpen } from 'lucide-react-taro'
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

// 导出类型名称映射
const EXPORT_TYPE_NAMES: Record<string, string> = {
  checkin: '入住人员',
  checkout: '搬离人员',
  all: '全部数据'
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

      console.log('[Export] 统计数据:', res.data)

      if (res.data?.code === 200 && res.data?.data) {
        setStats(res.data.data)
      }
    } catch (error) {
      console.error('[Export] 获取统计数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * 生成文件名
   */
  const generateFileName = (type: string): string => {
    const now = new Date()
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`
    return `宿舍管理_${EXPORT_TYPE_NAMES[type]}_${dateStr}_${timeStr}.xlsx`
  }

  /**
   * 处理导出
   */
  const handleExport = async (type: 'checkin' | 'checkout' | 'all') => {
    setExporting(type)
    
    try {
      console.log(`[Export] 开始导出 ${type} 数据...`)
      
      // 显示加载提示
      Taro.showLoading({ title: '正在导出...', mask: true })

      const url = `/api/export/${type}`
      const fileName = generateFileName(type)

      // 1. 下载文件到临时目录
      console.log('[Export] 下载文件:', url)
      const downloadRes = await Network.downloadFile({ url })
      
      console.log('[Export] 下载结果:', downloadRes)

      if (downloadRes.statusCode !== 200) {
        throw new Error(`下载失败，状态码: ${downloadRes.statusCode}`)
      }

      const tempFilePath = downloadRes.tempFilePath
      console.log('[Export] 临时文件路径:', tempFilePath)

      // 2. 保存文件到本地持久化存储
      // 微信小程序需要先保存文件，才能在其他应用中打开
      let savedFilePath = tempFilePath
      
      try {
        // 尝试保存到本地
        const saveRes = await Taro.saveFile({
          tempFilePath: tempFilePath,
          filePath: `${Taro.env.USER_DATA_PATH}/${fileName}`
        }) as Taro.saveFile.SuccessCallbackResult
        savedFilePath = saveRes.savedFilePath
        console.log('[Export] 文件已保存到:', savedFilePath)
      } catch (saveError) {
        console.warn('[Export] 保存文件失败，使用临时文件:', saveError)
        // 如果保存失败，继续使用临时文件
      }

      Taro.hideLoading()

      // 3. 打开文档供用户查看和保存
      try {
        await Taro.openDocument({
          filePath: savedFilePath,
          fileType: 'xlsx',
          showMenu: true, // 显示右上角菜单，允许用户转发、保存等操作
        })
        
        console.log('[Export] 文档打开成功')
        
        // 提示用户如何保存
        Taro.showModal({
          title: '导出成功',
          content: `文件「${fileName}」已打开\n\n点击右上角「...」可转发或保存到手机`,
          showCancel: false,
          confirmText: '知道了'
        })
      } catch (openError) {
        console.error('[Export] 打开文档失败:', openError)
        
        // 如果打开失败，提示用户文件位置
        Taro.showModal({
          title: '导出完成',
          content: `文件已保存，但无法自动打开\n\n文件路径：\n${savedFilePath}\n\n请在微信「我-设置-通用-存储空间」中查看`,
          showCancel: true,
          cancelText: '取消',
          confirmText: '复制路径'
        }).then(res => {
          if (res.confirm) {
            Taro.setClipboardData({
              data: savedFilePath,
              success: () => {
                Taro.showToast({ title: '路径已复制', icon: 'success' })
              }
            })
          }
        })
      }

    } catch (error: any) {
      Taro.hideLoading()
      console.error('[Export] 导出失败:', error)
      
      let errorMsg = '导出失败，请重试'
      if (error.errMsg) {
        if (error.errMsg.includes('network')) {
          errorMsg = '网络错误，请检查网络连接'
        } else if (error.errMsg.includes('permission')) {
          errorMsg = '没有文件保存权限'
        }
      }
      
      Taro.showToast({
        title: errorMsg,
        icon: 'none',
        duration: 3000
      })
    } finally {
      setExporting(null)
    }
  }

  /**
   * 打开文件管理器（H5端）
   */
  const handleOpenFileManager = () => {
    Taro.showModal({
      title: '查看已保存文件',
      content: '请在微信中按以下路径查找：\n\n我 → 设置 → 通用 → 存储空间 → 微信聊天记录 → 文件',
      showCancel: false
    })
  }

  return (
    <View className="min-h-screen bg-gray-50 p-4">
      <View className="text-center mb-6">
        <Text className="text-xl font-bold text-gray-800 block">数据导出</Text>
        <Text className="text-sm text-gray-500 block mt-1">导出宿舍管理数据到Excel</Text>
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
          <Text className="text-sm font-medium text-gray-800 block mb-3">保存方法</Text>
          <View className="space-y-2">
            <View className="flex items-start gap-2">
              <Text className="text-xs text-gray-500">1.</Text>
              <Text className="text-xs text-gray-500 flex-1">点击导出按钮，等待文件生成</Text>
            </View>
            <View className="flex items-start gap-2">
              <Text className="text-xs text-gray-500">2.</Text>
              <Text className="text-xs text-gray-500 flex-1">文件自动打开后，点击右上角「...」</Text>
            </View>
            <View className="flex items-start gap-2">
              <Text className="text-xs text-gray-500">3.</Text>
              <Text className="text-xs text-gray-500 flex-1">选择「发送给朋友」转发到微信</Text>
            </View>
            <View className="flex items-start gap-2">
              <Text className="text-xs text-gray-500">4.</Text>
              <Text className="text-xs text-gray-500 flex-1">或选择「保存到手机」本地保存</Text>
            </View>
          </View>
          
          {/* 查找已保存文件 */}
          <View 
            className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2 cursor-pointer"
            onClick={handleOpenFileManager}
          >
            <FolderOpen size={16} color="#6b7280" />
            <Text className="text-xs text-blue-600">如何查找已保存的文件？</Text>
          </View>
        </CardContent>
      </Card>
    </View>
  )
}

export default ExportPage
