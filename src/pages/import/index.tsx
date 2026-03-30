import { View, Text } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, FileSpreadsheet, CircleCheck, CircleX, CircleAlert, Trash2 } from 'lucide-react-taro'
import { Network } from '@/network'
import './index.css'

interface ImportResult {
  total: number
  success: number
  failed: number
  errors: string[]
}

const ImportPage = () => {
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [clearing, setClearing] = useState(false)

  // 从URL导入默认文件
  const handleImportFromUrl = async () => {
    const confirmed = await Taro.showModal({
      title: '确认导入',
      content: '确定要从默认文件导入数据吗？\n这将添加新的入住记录。',
    })
    
    if (!confirmed.confirm) return

    setImporting(true)
    setResult(null)

    try {
      // 默认的Excel文件URL（从用户提供的URL）
      const fileUrl = 'https://code.coze.cn/api/sandbox/coze_coding/file/proxy?expire_time=-1&file_path=assets%2F2_%E5%8D%97%E5%9B%9B%E5%B7%B7%E4%BD%8F%E5%AE%BF%E4%BA%BA%E5%91%98%E5%90%8D%E5%8D%953%E6%9C%8821%E5%8F%B7%283%29.xlsx&nonce=8ffc5d2c-5c3c-4333-b05b-939a58b9b99c&project_id=7619391393189953536&sign=8901d10187e045d66a85d87ad377927a4c1e1edbee16b6b2d50e9c6a7cacde81'

      Taro.showLoading({ title: '正在导入...', mask: true })

      const res = await Network.request({
        url: '/api/import/url',
        method: 'POST',
        data: { url: fileUrl }
      })

      Taro.hideLoading()

      console.log('[Import] 导入结果:', res.data)

      if (res.data?.code === 200 && res.data?.data) {
        setResult(res.data.data)
        
        if (res.data.data.success > 0) {
          Taro.showToast({
            title: `成功导入 ${res.data.data.success} 条`,
            icon: 'success'
          })
        }
      } else {
        throw new Error(res.data?.msg || '导入失败')
      }
    } catch (error: any) {
      Taro.hideLoading()
      console.error('[Import] 导入失败:', error)
      Taro.showToast({
        title: error.message || '导入失败',
        icon: 'none',
        duration: 3000
      })
    } finally {
      setImporting(false)
    }
  }

  // 上传Excel文件导入
  const handleUploadFile = async () => {
    try {
      // 选择文件
      const res = await Taro.chooseMessageFile({
        count: 1,
        type: 'file',
        extension: ['xlsx', 'xls']
      })

      if (!res.tempFiles || res.tempFiles.length === 0) {
        return
      }

      const file = res.tempFiles[0]
      console.log('[Import] 选择的文件:', file)

      setImporting(true)
      setResult(null)
      Taro.showLoading({ title: '正在上传...', mask: true })

      // 上传文件
      const uploadRes = await Network.uploadFile({
        url: '/api/import/upload',
        filePath: file.path,
        name: 'file'
      })

      Taro.hideLoading()

      console.log('[Import] 上传结果:', uploadRes)

      if (uploadRes.statusCode === 200) {
        const data = JSON.parse(uploadRes.data as string)
        
        if (data.code === 200 && data.data) {
          setResult(data.data)
          
          if (data.data.success > 0) {
            Taro.showToast({
              title: `成功导入 ${data.data.success} 条`,
              icon: 'success'
            })
          }
        } else {
          throw new Error(data.msg || '导入失败')
        }
      } else {
        throw new Error('上传失败')
      }
    } catch (error: any) {
      Taro.hideLoading()
      console.error('[Import] 上传失败:', error)
      Taro.showToast({
        title: error.message || '上传失败',
        icon: 'none',
        duration: 3000
      })
    } finally {
      setImporting(false)
    }
  }

  // 清空所有数据
  const handleClearData = async () => {
    const confirmed = await Taro.showModal({
      title: '危险操作',
      content: '确定要清空所有数据吗？\n\n这将删除所有入住、搬离记录，并重置所有床位状态。\n\n此操作不可恢复！',
      confirmText: '确认清空',
      confirmColor: '#ef4444'
    })

    if (!confirmed.confirm) return

    // 二次确认
    const confirmed2 = await Taro.showModal({
      title: '最后确认',
      content: '真的要清空所有数据吗？',
      confirmText: '确认',
      confirmColor: '#ef4444'
    })

    if (!confirmed2.confirm) return

    setClearing(true)

    try {
      Taro.showLoading({ title: '正在清空...', mask: true })

      const res = await Network.request({
        url: '/api/import/clear',
        method: 'POST'
      })

      Taro.hideLoading()

      if (res.data?.code === 200) {
        Taro.showToast({
          title: '数据已清空',
          icon: 'success'
        })
        
        // 清空本地缓存
        Taro.removeStorageSync('floorStats')
        for (let i = 1; i <= 4; i++) {
          Taro.removeStorageSync(`beds_floor_${i}`)
        }
        Taro.removeStorageSync('checkOutRecords')
        
        setResult(null)
      } else {
        throw new Error(res.data?.msg || '清空失败')
      }
    } catch (error: any) {
      Taro.hideLoading()
      console.error('[Import] 清空失败:', error)
      Taro.showToast({
        title: error.message || '清空失败',
        icon: 'none',
        duration: 3000
      })
    } finally {
      setClearing(false)
    }
  }

  return (
    <View className="min-h-screen bg-gray-50 p-4">
      <View className="text-center mb-6">
        <Text className="text-xl font-bold text-gray-800 block">数据导入</Text>
        <Text className="text-sm text-gray-500 block mt-1">从Excel文件导入入住人员数据</Text>
      </View>

      {/* 导入方式卡片 */}
      <View className="space-y-3">
        {/* 默认文件导入 */}
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <View className="flex items-center gap-3 mb-3">
              <View className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <FileSpreadsheet size={20} color="#2563eb" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-800">南四巷住宿名单</Text>
                <Text className="text-xs text-gray-500">从预设文件导入数据</Text>
              </View>
            </View>
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleImportFromUrl}
              disabled={importing || clearing}
            >
              <View className="flex items-center justify-center gap-2">
                <Upload size={16} color="#fff" />
                <Text className="text-white">
                  {importing ? '导入中...' : '导入数据'}
                </Text>
              </View>
            </Button>
          </CardContent>
        </Card>

        {/* 上传文件导入 */}
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <View className="flex items-center gap-3 mb-3">
              <View className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Upload size={20} color="#22c55e" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-800">上传Excel文件</Text>
                <Text className="text-xs text-gray-500">选择本地xlsx/xls文件</Text>
              </View>
            </View>
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              onClick={handleUploadFile}
              disabled={importing || clearing}
            >
              <View className="flex items-center justify-center gap-2">
                <Upload size={16} color="#fff" />
                <Text className="text-white">选择文件</Text>
              </View>
            </Button>
          </CardContent>
        </Card>

        {/* 清空数据 */}
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <View className="flex items-center gap-3 mb-3">
              <View className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 size={20} color="#ef4444" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-800">清空数据</Text>
                <Text className="text-xs text-gray-500">删除所有记录，重置床位</Text>
              </View>
            </View>
            <Button
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              onClick={handleClearData}
              disabled={importing || clearing}
            >
              <View className="flex items-center justify-center gap-2">
                <Trash2 size={16} color="#fff" />
                <Text className="text-white">
                  {clearing ? '清空中...' : '清空数据'}
                </Text>
              </View>
            </Button>
          </CardContent>
        </Card>
      </View>

      {/* 导入结果 */}
      {result && (
        <Card className="overflow-hidden mt-4">
          <CardContent className="p-4">
            <View className="flex items-center gap-2 mb-3">
              {result.failed === 0 ? (
                <CircleCheck size={20} color="#22c55e" />
              ) : result.success === 0 ? (
                <CircleX size={20} color="#ef4444" />
              ) : (
                <CircleAlert size={20} color="#f97316" />
              )}
              <Text className="text-base font-medium text-gray-800">导入结果</Text>
            </View>

            <View className="space-y-2">
              <View className="flex justify-between items-center py-2 border-b border-gray-100">
                <Text className="text-sm text-gray-600">总计</Text>
                <Text className="text-sm font-medium text-gray-800">{result.total} 条</Text>
              </View>
              <View className="flex justify-between items-center py-2 border-b border-gray-100">
                <Text className="text-sm text-gray-600">成功</Text>
                <Text className="text-sm font-medium text-green-600">{result.success} 条</Text>
              </View>
              <View className="flex justify-between items-center py-2 border-b border-gray-100">
                <Text className="text-sm text-gray-600">失败</Text>
                <Text className="text-sm font-medium text-red-600">{result.failed} 条</Text>
              </View>
            </View>

            {/* 错误详情 */}
            {result.errors && result.errors.length > 0 && (
              <View className="mt-3">
                <Text className="text-sm font-medium text-gray-700 block mb-2">错误详情:</Text>
                <View className="bg-red-50 rounded-lg p-3 max-h-48 overflow-y-auto">
                  {result.errors.map((error, index) => (
                    <Text key={index} className="text-xs text-red-600 block mb-1">
                      {index + 1}. {error}
                    </Text>
                  ))}
                </View>
              </View>
            )}
          </CardContent>
        </Card>
      )}

      {/* 使用说明 */}
      <Card className="overflow-hidden mt-4">
        <CardContent className="p-4">
          <Text className="text-sm font-medium text-gray-800 block mb-2">Excel格式要求</Text>
          <View className="space-y-1">
            <Text className="text-xs text-gray-500 block">• 第一行为表头</Text>
            <Text className="text-xs text-gray-500 block">• 必须包含：姓名、身份证号、手机号</Text>
            <Text className="text-xs text-gray-500 block">• 可选列：楼层、床号、铺位、入住日期</Text>
            <Text className="text-xs text-gray-500 block">• 铺位：上铺/下铺</Text>
          </View>
        </CardContent>
      </Card>
    </View>
  )
}

export default ImportPage
