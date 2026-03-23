import { View, Text, Input } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import { Button } from '@/components/ui/button'
import { Lock, Eye, EyeOff } from 'lucide-react-taro'

interface PasswordDialogProps {
  open: boolean
  title?: string
  confirmText?: string
  onConfirm: () => void
  onCancel: () => void
}

const DELETE_PASSWORD = '960710'

export const PasswordDialog: React.FC<PasswordDialogProps> = ({
  open,
  title = '请输入删除密码',
  confirmText = '确认删除',
  onConfirm,
  onCancel
}) => {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleConfirm = () => {
    if (password === DELETE_PASSWORD) {
      setPassword('')
      setError('')
      onConfirm()
    } else {
      setError('密码错误，请重新输入')
      Taro.vibrateShort({ type: 'heavy' })
    }
  }

  const handleCancel = () => {
    setPassword('')
    setError('')
    onCancel()
  }

  if (!open) return null

  return (
    <View 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={handleCancel}
    >
      <View 
        className="bg-white rounded-xl p-5 mx-4 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <View className="flex items-center justify-center mb-4">
          <View className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <Lock size={24} color="#ef4444" />
          </View>
        </View>
        
        <Text className="block text-center text-lg font-semibold text-gray-800 mb-4">
          {title}
        </Text>
        
        <View className="bg-gray-50 rounded-lg px-4 py-3 mb-2 flex items-center">
          <Input
            className="flex-1 text-base"
            placeholder="请输入密码"
            value={password}
            password={!showPassword}
            onInput={(e) => {
              setPassword(e.detail.value)
              setError('')
            }}
          />
          <View 
            className="ml-2 p-1"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff size={18} color="#9ca3af" />
            ) : (
              <Eye size={18} color="#9ca3af" />
            )}
          </View>
        </View>
        
        {error && (
          <Text className="block text-center text-sm text-red-500 mb-3">
            {error}
          </Text>
        )}
        
        <View className="flex gap-3 mt-4">
          <Button
            className="flex-1 bg-gray-100 text-gray-700"
            onClick={handleCancel}
          >
            取消
          </Button>
          <Button
            className="flex-1 bg-red-500 text-white"
            onClick={handleConfirm}
            disabled={!password}
          >
            {confirmText}
          </Button>
        </View>
      </View>
    </View>
  )
}
