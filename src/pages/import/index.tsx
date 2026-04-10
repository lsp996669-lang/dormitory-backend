import { View, Text } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, FileSpreadsheet, CircleCheck, CircleX, CircleAlert } from 'lucide-react-taro'
import { Network } from '@/network'
import './index.css'

interface ImportResult {
  checkIns: number
  checkOuts: number
  errors: string[]
}

const ImportPage = () => {
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  // 从URL导入默认文件（已禁用 - 生产环境不支持临时URL）
  const handleImportFromUrl = async () => {
    Taro.showModal({
      title: '功能已禁用',
      content: '默认文件导入功能已禁用。\n\n请使用"上传Excel文件"功能，选择您的本地Excel文件进行导入。',
      showCancel: false
    })
    return
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
          
          if (data.data.checkIns > 0 || data.data.checkOuts > 0) {
            Taro.showToast({
              title: `入住${data.data.checkIns}人，搬离${data.data.checkOuts}人`,
              icon: 'success',
              duration: 3000
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

  return (
    <View className="min-h-screen bg-gray-50 p-4">
      <View className="text-center mb-6">
        <Text className="text-xl font-bold text-gray-800 block">数据导入</Text>
        <Text className="text-sm text-gray-500 block mt-1">从Excel文件导入入住和搬离人员数据</Text>
      </View>

      {/* 导入方式卡片 */}
      <View className="space-y-3">
        {/* 默认文件导入（已禁用） */}
        <Card className="overflow-hidden opacity-60">
          <CardContent className="p-4">
            <View className="flex items-center gap-3 mb-3">
              <View className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <FileSpreadsheet size={20} color="#9ca3af" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-600">默认文件导入</Text>
                <Text className="text-xs text-gray-400">生产环境已禁用</Text>
              </View>
            </View>
            <Button
              className="w-full bg-gray-400 text-gray-600"
              onClick={handleImportFromUrl}
              disabled
            >
              <View className="flex items-center justify-center gap-2">
                <Upload size={16} color="#fff" />
                <Text className="text-white">已禁用</Text>
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
              disabled={importing}
            >
              <View className="flex items-center justify-center gap-2">
                <Upload size={16} color="#fff" />
                <Text className="text-white">选择文件</Text>
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
              {result.errors.length === 0 ? (
                <CircleCheck size={20} color="#22c55e" />
              ) : result.checkIns === 0 && result.checkOuts === 0 ? (
                <CircleX size={20} color="#ef4444" />
              ) : (
                <CircleAlert size={20} color="#f97316" />
              )}
              <Text className="text-base font-medium text-gray-800">导入结果</Text>
            </View>

            <View className="space-y-2">
              <View className="flex justify-between items-center py-2 border-b border-gray-100">
                <Text className="text-sm text-gray-600">入住人员</Text>
                <Text className="text-sm font-medium text-blue-600">{result.checkIns} 人</Text>
              </View>
              <View className="flex justify-between items-center py-2 border-b border-gray-100">
                <Text className="text-sm text-gray-600">搬离人员</Text>
                <Text className="text-sm font-medium text-green-600">{result.checkOuts} 人</Text>
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
          <Text className="text-sm font-medium text-gray-800 block mb-2">导入说明</Text>
          <View className="space-y-1">
            <Text className="text-xs text-gray-500 block">• 导入前会清空现有数据</Text>
            <Text className="text-xs text-gray-500 block">• 每个工作表代表一个楼层</Text>
            <Text className="text-xs text-gray-500 block">• 自动识别入住人员和搬离人员</Text>
            <Text className="text-xs text-gray-500 block">• 支持xlsx和xls格式</Text>
          </View>
        </CardContent>
      </Card>
    </View>
  )
}

export default ImportPage
