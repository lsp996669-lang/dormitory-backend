import { View, Text } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Cloud } from '@/cloud'
import './index.css'

const TestCloudPage = () => {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')

  const testCheckin = async () => {
    if (!name || !phone) {
      Taro.showToast({ title: '请填写姓名和手机号', icon: 'none' })
      return
    }

    setLoading(true)
    setResult('')

    try {
      console.log('[测试] 调用 checkin 云函数')
      const res = await Cloud.callFunction('checkin', {
        name,
        phone,
        location: '南四巷180号',
        floor: '2楼',
        bed: '1',
        station: '会展中心站'
      })

      console.log('[测试] 云函数响应:', res)

      if (res.result?.code === 200) {
        setResult(`✅ 成功：${res.result.msg}`)
        Taro.showToast({ title: '测试成功', icon: 'success' })
      } else {
        setResult(`❌ 失败：${res.result?.msg}`)
        Taro.showToast({ title: res.result?.msg || '测试失败', icon: 'none' })
      }
    } catch (error) {
      console.error('[测试] 云函数调用失败:', error)
      setResult(`❌ 异常：${error.errMsg || error.message}`)
      Taro.showToast({ title: '调用失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const testGetCheckinList = async () => {
    setLoading(true)
    setResult('')

    try {
      console.log('[测试] 调用 getCheckinList 云函数')
      const res = await Cloud.callFunction('getCheckinList', {
        location: '南四巷180号'
      })

      console.log('[测试] 云函数响应:', res)

      if (res.result?.code === 200) {
        const count = res.result?.data?.length || 0
        setResult(`✅ 成功：获取到 ${count} 条入住记录`)
        Taro.showToast({ title: `获取到 ${count} 条记录`, icon: 'success' })
      } else {
        setResult(`❌ 失败：${res.result?.msg}`)
        Taro.showToast({ title: res.result?.msg || '获取失败', icon: 'none' })
      }
    } catch (error) {
      console.error('[测试] 云函数调用失败:', error)
      setResult(`❌ 异常：${error.errMsg || error.message}`)
      Taro.showToast({ title: '调用失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const testExportData = async () => {
    setLoading(true)
    setResult('')

    try {
      console.log('[测试] 调用 exportData 云函数')
      const res = await Cloud.callFunction('exportData', {})

      console.log('[测试] 云函数响应:', res)

      if (res.result?.code === 200) {
        const fileID = res.result?.data?.fileID
        setResult(`✅ 成功：文件已导出\nFileID: ${fileID}`)
        Taro.showToast({ title: '导出成功', icon: 'success' })
      } else {
        setResult(`❌ 失败：${res.result?.msg}`)
        Taro.showToast({ title: res.result?.msg || '导出失败', icon: 'none' })
      }
    } catch (error) {
      console.error('[测试] 云函数调用失败:', error)
      setResult(`❌ 异常：${error.errMsg || error.message}`)
      Taro.showToast({ title: '调用失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="min-h-screen bg-gray-50 p-4">
      <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
        <Text className="text-lg font-semibold text-gray-800 mb-2">云开发测试页面</Text>
        <Text className="text-sm text-gray-500">
          测试云函数是否正常工作
        </Text>
      </View>

      <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
        <Text className="text-base font-semibold text-gray-800 mb-3">入住登记测试</Text>
        <View className="space-y-3">
          <View>
            <Label className="text-sm text-gray-700">姓名</Label>
            <Input
              className="mt-1"
              placeholder="请输入姓名"
              value={name}
              onInput={(e) => setName(e.detail.value)}
            />
          </View>
          <View>
            <Label className="text-sm text-gray-700">手机号</Label>
            <Input
              className="mt-1"
              placeholder="请输入手机号"
              type="number"
              maxlength={11}
              value={phone}
              onInput={(e) => setPhone(e.detail.value)}
            />
          </View>
          <Button
            className="w-full bg-blue-600 text-white"
            onClick={testCheckin}
            disabled={loading}
          >
            {loading ? '测试中...' : '测试入住登记'}
          </Button>
        </View>
      </View>

      <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
        <Text className="text-base font-semibold text-gray-800 mb-3">获取入住列表测试</Text>
        <Button
          className="w-full bg-green-600 text-white"
          onClick={testGetCheckinList}
          disabled={loading}
        >
          {loading ? '测试中...' : '测试获取入住列表'}
        </Button>
      </View>

      <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
        <Text className="text-base font-semibold text-gray-800 mb-3">导出数据测试</Text>
        <Button
          className="w-full bg-purple-600 text-white"
          onClick={testExportData}
          disabled={loading}
        >
          {loading ? '测试中...' : '测试导出数据'}
        </Button>
      </View>

      {result && (
        <View className="bg-white rounded-lg p-4 shadow-sm">
          <Text className="text-base font-semibold text-gray-800 mb-2">测试结果</Text>
          <Text className="text-sm text-gray-600 whitespace-pre-wrap">{result}</Text>
        </View>
      )}
    </View>
  )
}

export default TestCloudPage
