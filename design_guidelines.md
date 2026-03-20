# 宿舍管理系统设计指南

## 1. 品牌定位

- **应用定位**：宿舍管理登记系统
- **设计风格**：简洁、专业、高效
- **目标用户**：宿舍管理员、宿管人员
- **核心价值**：快速登记、清晰展示、便捷管理

## 2. 配色方案

### 主色板

| 颜色 | Tailwind 类名 | 用途 |
|------|--------------|------|
| 主色 | `bg-blue-600` / `text-blue-600` | 主按钮、重点信息、选中状态 |
| 辅助色 | `bg-blue-500` / `text-blue-500` | 次级按钮、链接 |
| 强调色 | `bg-orange-500` / `text-orange-500` | 搬离按钮、警告操作 |

### 中性色

| 颜色 | Tailwind 类名 | 用途 |
|------|--------------|------|
| 深灰 | `text-gray-800` | 主标题 |
| 中灰 | `text-gray-600` | 副标题、描述文字 |
| 浅灰 | `text-gray-400` | 辅助文字、占位符 |
| 边框 | `border-gray-200` | 卡片边框、分割线 |
| 背景 | `bg-gray-50` / `bg-gray-100` | 页面背景、卡片背景 |

### 语义色

| 颜色 | Tailwind 类名 | 用途 |
|------|--------------|------|
| 成功 | `bg-green-500` / `text-green-600` | 已入住状态、成功提示 |
| 空闲 | `bg-gray-100` / `text-gray-500` | 空床位状态 |
| 搬离 | `bg-orange-100` / `text-orange-600` | 已搬离记录 |

## 3. 字体规范

| 层级 | Tailwind 类名 | 用途 |
|------|--------------|------|
| H1 | `text-2xl font-bold` | 页面主标题 |
| H2 | `text-xl font-semibold` | 区块标题 |
| H3 | `text-lg font-semibold` | 卡片标题 |
| Body | `text-base` | 正文内容 |
| Caption | `text-sm text-gray-500` | 辅助说明 |

## 4. 间距系统

| 类型 | Tailwind 类名 | 说明 |
|------|--------------|------|
| 页面边距 | `p-4` | 页面左右上下边距 |
| 卡片内边距 | `p-4` | 卡片内部间距 |
| 列表间距 | `gap-3` | 列表项之间的间距 |
| 楼层网格 | `gap-2` | 床位网格间距 |

## 5. 组件规范

### 按钮组件

```tsx
import { Button } from '@/components/ui/button'

// 主按钮
<Button className="bg-blue-600 hover:bg-blue-700 text-white">确认入住</Button>

// 次按钮
<Button variant="outline">取消</Button>

// 危险按钮（搬离）
<Button className="bg-orange-500 hover:bg-orange-600 text-white">搬离</Button>

// 禁用状态
<Button disabled>已入住</Button>
```

### 卡片组件

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

<Card className="rounded-lg border border-gray-200">
  <CardHeader className="pb-2">
    <CardTitle className="text-lg">1楼 - 入住</CardTitle>
  </CardHeader>
  <CardContent>
    {/* 内容 */}
  </CardContent>
</Card>
```

### 床位状态展示

```tsx
import { View, Text } from '@tarojs/components'
import { Badge } from '@/components/ui/badge'

// 已入住床位
<View className="bg-green-50 border border-green-200 rounded-lg p-3">
  <Text className="text-sm font-medium text-green-700">1-1-A 上铺</Text>
  <Text className="text-xs text-gray-500">张三</Text>
  <Badge className="bg-green-500 text-white text-xs mt-1">已入住</Badge>
</View>

// 空床位
<View className="bg-gray-50 border border-gray-200 rounded-lg p-3">
  <Text className="text-sm font-medium text-gray-700">1-1-A 上铺</Text>
  <Text className="text-xs text-gray-400">空床位</Text>
  <Button size="sm" className="mt-2 bg-blue-600 text-white">入住</Button>
</View>
```

### 对话框（二次确认）

```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

<Dialog open={showConfirm} onOpenChange={setShowConfirm}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>确认搬离</DialogTitle>
      <DialogDescription>
        确定要为 张三 办理搬离吗？此操作不可撤销。
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onClick={() => setShowConfirm(false)}>取消</Button>
      <Button className="bg-orange-500 text-white" onClick={handleConfirm}>确认搬离</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 表单输入

```tsx
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { View, Text } from '@tarojs/components'

<View className="space-y-3">
  <View>
    <Label className="text-sm text-gray-700">姓名</Label>
    <Input className="mt-1" placeholder="请输入姓名" />
  </View>
  <View>
    <Label className="text-sm text-gray-700">身份证号</Label>
    <Input className="mt-1" placeholder="请输入身份证号" maxlength={18} />
  </View>
  <View>
    <Label className="text-sm text-gray-700">手机号</Label>
    <Input className="mt-1" placeholder="请输入手机号" type="number" maxlength={11} />
  </View>
</View>
```

## 6. 导航结构

### TabBar 配置

```typescript
// src/app.config.ts
export default defineAppConfig({
  pages: [
    'pages/login/index',    // 登录页
    'pages/floor/index',    // 楼层选择
    'pages/checkin/index',  // 入住界面
    'pages/checkout/index', // 搬离界面
    'pages/detail/index',   // 详情页面
  ],
  tabBar: {
    color: '#999999',
    selectedColor: '#2563eb',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/floor/index',
        text: '楼层',
        iconPath: './assets/tabbar/building.png',
        selectedIconPath: './assets/tabbar/building-active.png',
      },
      {
        pagePath: 'pages/checkout/index',
        text: '搬离',
        iconPath: './assets/tabbar/log-out.png',
        selectedIconPath: './assets/tabbar/log-out-active.png',
      },
    ]
  }
})
```

### 页面跳转规范

- 登录验证：使用 `Taro.redirectTo` 跳转到楼层页
- TabBar 页面：使用 `Taro.switchTab`
- 普通页面：使用 `Taro.navigateTo`
- 返回上一页：使用 `Taro.navigateBack`

## 7. 空状态组件

```tsx
import { View, Text } from '@tarojs/components'
import { Inbox } from 'lucide-react-taro'

<View className="flex flex-col items-center justify-center py-12">
  <Inbox size={48} color="#d1d5db" />
  <Text className="mt-3 text-sm text-gray-400">暂无数据</Text>
</View>
```

## 8. 小程序约束

### 包体积优化

- 图标使用 `lucide-react-taro`，按需引入
- TabBar 图标使用 PNG 格式，尺寸 81x81

### 性能优化

- 列表使用虚拟滚动（长列表）
- 图片使用懒加载
- 合理使用分页查询

### 数据存储

- 用户登录态存储在本地 Storage
- 敏感数据（身份证号）需加密传输
- 使用 Supabase 进行数据持久化
