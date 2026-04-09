# Coze Mini Program - 宿舍管理助手

这是一个基于 [Taro 4](https://docs.taro.zone/docs/) 的微信小程序，使用**微信云开发**提供后端服务。

> **重要提示**：本项目已从 NestJS 后端迁移到微信云开发。请查看 [CLOUD_SETUP_GUIDE.md](./CLOUD_SETUP_GUIDE.md) 了解如何设置和使用云开发。
>
> **快速修复**：
> - 网络问题：查看 [QUICK_FIX.md](./QUICK_FIX.md)
> - 云开发环境错误：查看 [FIX_CLOUD_ENV_ERROR.md](./FIX_CLOUD_ENV_ERROR.md)（最快解决）
> - 添加床位：查看 [QUICK_ADD_BED.md](./QUICK_ADD_BED.md)
>
> **📚 完整文档索引**：查看 [DOCS_INDEX.md](./DOCS_INDEX.md) 获取所有文档列表和问题解决方案

## 🎯 快速操作

### 云开发配置
- **云开发环境错误**：点击这里查看 [FIX_CLOUD_ENV_ERROR.md](./FIX_CLOUD_ENV_ERROR.md) 快速修复
- **完整配置指南**：查看 [CLOUD_SETUP_GUIDE.md](./CLOUD_SETUP_GUIDE.md)

### 添加床位
- **小程序添加床位**：登录后在楼层页面点击「添加床位」按钮，或查看 [ADD_BED_FEATURE_GUIDE.md](./ADD_BED_FEATURE_GUIDE.md)
- **南二巷201房添加3号床**：查看 [QUICK_ADD_BED.md](./QUICK_ADD_BED.md)
- 其他房间添加床位：使用小程序添加功能或云开发控制台

### 常见问题
- 为什么只显示2个床？查看 [WHY_ONLY_2_BEDS.md](./WHY_ONLY_2_BEDS.md)
- 云开发环境错误"请选择云环境"：查看 [FIX_CLOUD_ENV_ERROR.md](./FIX_CLOUD_ENV_ERROR.md)（3步快速修复）
- 小程序无法连接网络：查看 [FIX_NETWORK_ISSUE.md](./FIX_NETWORK_ISSUE.md)
- 初始化所有床位：查看 [init-nantwo-beds.js](./init-nantwo-beds.js)

## 技术栈

- **整体框架**: Taro 4.1.9
- **语言**: TypeScript 5.4.5
- **渲染**: React 18.0.0
- **样式**: TailwindCSS 4.1.18
- **Tailwind 适配层**: weapp-tailwindcss 4.9.2
- **状态管理**: Zustand 5.0.9
- **图标库**: lucide-react-taro latest
- **工程化**: Vite 4.2.0
- **包管理**: pnpm
- **运行时**: Node.js >= 18
- **后端服务**: 微信云开发（云函数 + 云数据库 + 云存储）
- **数据导入导出**: exceljs 4.4.0

> **注意**：本项目后端已从 NestJS 迁移到微信云开发。云函数代码位于 `cloudfunctions/` 目录。

## 项目结构

```
├── .cozeproj/                # Coze 平台配置
│   └── scripts/              # 构建和运行脚本
├── config/                   # Taro 构建配置
│   ├── index.ts              # 主配置文件
│   ├── dev.ts                # 开发环境配置
│   └── prod.ts               # 生产环境配置
├── server/                   # NestJS 后端服务
│   └── src/
│       ├── main.ts           # 服务入口
│       ├── app.module.ts     # 根模块
│       ├── app.controller.ts # 应用控制器
│       └── app.service.ts    # 应用服务
├── src/                      # 前端源码
│   ├── pages/                # 页面组件
│   ├── presets/              # 框架预置逻辑（无需读取，如无必要不改动）
│   ├── utils/                # 工具函数
│   ├── network.ts            # 封装好的网络请求工具
│   ├── app.ts                # 应用入口
│   ├── app.config.ts         # 应用配置
│   └── app.css               # 全局样式
├── types/                    # TypeScript 类型定义
├── key/                      # 小程序密钥（CI 上传用）
├── .env.local                # 环境变量
└── project.config.json       # 微信小程序项目配置
```

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 本地开发

启动前端开发：

```bash
pnpm dev
```

- 前端地址：http://localhost:5000
- 小程序编译输出：dist-weapp/

注意：本项目使用微信云开发作为后端，无需单独启动后端服务。云函数和云数据库在微信开发者工具中运行。

### 构建

```bash
pnpm build        # 构建 H5 和小程序
pnpm build:web    # 仅构建 H5，输出到 dist-web
pnpm build:weapp  # 仅构建微信小程序，输出到 dist-weapp
```

### 预览小程序

```bash
pnpm preview:weapp # 构建并生成预览小程序二维码
```

## ☁️ 微信云开发配置

本项目使用微信云开发作为后端服务，包括云函数、云数据库和云存储。

### 快速配置

查看 [CLOUD_SETUP_GUIDE.md](./CLOUD_SETUP_GUIDE.md) 了解详细的云开发配置步骤。

### 云函数列表

项目包含以下 6 个云函数（位于 `cloudfunctions/` 目录）：

1. **checkin** - 入住登记
2. **checkout** - 搬离登记
3. **getCheckinList** - 获取入住列表
4. **getCheckoutList** - 获取搬离列表
5. **exportData** - 导出数据
6. **addBed** - 添加床位

### 云数据库集合

- **beds** - 床位信息表
- **checkin_records** - 入住记录表
- **checkout_records** - 搬离记录表

### 云存储目录

- **exports** - 导出文件存储目录
  - checkin/ - 入住数据导出
  - checkout/ - 搬离数据导出
  - temp/ - 临时文件

### 云函数调用示例

```typescript
// 在前端代码中调用云函数
import Taro from '@tarojs/taro'

const result = await Taro.cloud.callFunction({
  name: 'checkin',
  data: {
    dormitory: '南四巷180号',
    floor: '2',
    room: '201',
    position: 'upper',
    bed_number: '1',
    person_name: '张三',
    person_id: '110101199001011234',
    phone: '13800138000',
    checkin_time: '2024-04-09 12:00:00',
    payment_type: '公司支付',
    payment_amount: 500,
    remark: '测试入住'
  }
})

console.log(result.result)
```

## 🚀 自动部署

本项目已配置微信小程序自动部署功能，支持一键部署和 CI/CD 自动化。

### 快速开始

查看 [DEPLOYMENT_QUICKSTART.md](./DEPLOYMENT_QUICKSTART.md) 了解如何快速配置自动部署。

### 本地部署

```bash
# 上传预览版
pnpm deploy:preview

# 上传体验版
pnpm deploy:review

# 上传正式版
pnpm deploy:production
```

### GitHub Actions 自动部署

查看 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) 了解完整的 CI/CD 配置指南。

## 前端核心开发规范

### 新建页面流程

1. 在 \`src/pages/\` 下创建页面目录
2. 创建 \`index.tsx\`（页面组件）
3. 创建 \`index.config.ts\`（页面配置）
4. 创建 \`index.css\`（页面样式，可选）
5. 在 \`src/app.config.ts\` 的 \`pages\` 数组中注册页面路径

或使用 Taro 脚手架命令：

```bash
pnpm new      # 交互式创建页面/组件
```

### 组件库

#### UI 组件

UI 组件位于 `@/components/ui`，推荐按需引入：

```typescript
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
```

UI 组件列表:

Accordion,Alert,AlertDialog,AspectRatio,Avatar,Badge,Breadcrumb,Button,ButtonGroup,Calendar,Card,Carousel,Checkbox,CodeBlock,Collapsible,Command,ContextMenu,Dialog,Drawer,DropdownMenu,Field,HoverCard,Input,InputGroup,InputOTP,Label,Menubar,NavigationMenu,Pagination,Popover,Portal,Progress,RadioGroup,Resizable,ScrollArea,Select,Separator,Sheet,Skeleton,Slider,Sonner,Switch,Table,Tabs,Textarea,Toast,Toggle,ToggleGroup,Tooltip

#### Taro 原生组件

可以使用的 Taro 组件（UI 未覆盖）

```typescript
import { View, Text, Icon, Image } from '@tarojs/components'
```

Taro 原生组件列表：

Text,Icon,RichText,CheckboxGroup,Editor,Form,Picker,PickerView,PickerViewColumn,Radio,FunctionalPageNavigator,NavigationBar,Navigator,TabItem,Camera,Image,Video,ScrollView,Swiper,SwiperItem,View

### 路径别名

项目配置了 `@/*` 路径别名指向 `src/*`：

```typescript
import { SomeComponent } from '@/components/some-component'
import { useUserStore } from '@/stores/user'
```

### 代码模板

#### 页面组件 (TypeScript + React)

```tsx
// src/pages/example/index.tsx
import { View } from '@tarojs/components'
import { useLoad, useDidShow } from '@tarojs/taro'
import type { FC } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import './index.css'

const ExamplePage: FC = () => {
  useLoad(() => {
    console.log('Page loaded.')
  })

  useDidShow(() => {
    console.log('Page showed.')
  })

  return (
    <View className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>Hello Taro!</CardTitle>
          <CardDescription>
            页面布局用 Taro 基础组件，交互与视觉优先用项目内置 UI 组件。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <View className="text-sm text-muted-foreground">
            组件位于 src/components/ui，推荐按需从 @/components/ui/* 引入。
          </View>
        </CardContent>
        <CardFooter className="justify-end">
          <Button size="sm" onClick={() => console.log('clicked')}>
            点击
          </Button>
        </CardFooter>
      </Card>
    </View>
  )
}

export default ExamplePage
```

#### 页面配置

```typescript
// src/pages/example/index.config.ts
import { definePageConfig } from '@tarojs/taro'

export default definePageConfig({
  navigationBarTitleText: '示例页面',
  enablePullDownRefresh: true,
  backgroundTextStyle: 'dark',
})
```

#### 应用配置

```typescript
// src/app.config.ts
import { defineAppConfig } from '@tarojs/taro'

export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/example/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'App',
    navigationBarTextStyle: 'black',
  },
  // TabBar 配置 (可选)
  // tabBar: {
  //   list: [
  //     { pagePath: 'pages/index/index', text: '首页' },
  //   ],
  // },
})
```

### 发送请求

**IMPORTANT: 禁止直接使用 Taro.request、Taro.uploadFile、Taro.downloadFile，使用 Network.request、Network.uploadFile、Network.downloadFile 替代。**

Network 是对 Taro.request、Taro.uploadFile、Taro.downloadFile 的封装，自动添加项目域名前缀，参数与 Taro 一致。

✅ 正确使用方式

```typescript
import { Network } from '@/network'

// GET 请求
const data = await Network.request({
  url: '/api/hello'
})

// POST 请求
const result = await Network.request({
  url: '/api/user/login',
  method: 'POST',
  data: { username, password }
})

// 文件上传
await Network.uploadFile({
  url: '/api/upload',
  filePath: tempFilePath,
  name: 'file'
})

// 文件下载
await Network.downloadFile({
  url: '/api/download/file.pdf'
})
```

❌ 错误用法

```typescript
import Taro from '@tarojs/taro'

// ❌ 会导致自动域名拼接无法生效，除非是特殊指定域名
const data = await Network.request({
  url: 'http://localhost/api/hello'
})

// ❌ 不要直接使用 Taro.request
await Taro.request({ url: '/api/hello' })

// ❌ 不要直接使用 Taro.uploadFile
await Taro.uploadFile({ url: '/api/upload', filePath, name: 'file' })
```

### Zustand 状态管理

```typescript
// src/stores/user.ts
import { create } from 'zustand'

interface UserState {
  userInfo: UserInfo | null
  token: string
  setUserInfo: (info: UserInfo) => void
  setToken: (token: string) => void
  logout: () => void
}

interface UserInfo {
  id: string
  name: string
  avatar: string
}

export const useUserStore = create<UserState>((set) => ({
  userInfo: null,
  token: '',
  setUserInfo: (info) => set({ userInfo: info }),
  setToken: (token) => set({ token }),
  logout: () => set({ userInfo: null, token: '' }),
}))
```

### Taro 生命周期 Hooks

```typescript
import {
  useLoad,             // 页面加载 (onLoad)
  useReady,            // 页面初次渲染完成 (onReady)
  useDidShow,          // 页面显示 (onShow)
  useDidHide,          // 页面隐藏 (onHide)
  usePullDownRefresh,  // 下拉刷新 (onPullDownRefresh)
  useReachBottom,      // 触底加载 (onReachBottom)
  useShareAppMessage,  // 分享 (onShareAppMessage)
  useRouter,           // 获取路由参数
} from '@tarojs/taro'
```

### 路由导航

```typescript
import Taro from '@tarojs/taro'

// 保留当前页面，跳转到新页面
Taro.navigateTo({ url: '/pages/detail/index?id=1' })

// 关闭当前页面，跳转到新页面
Taro.redirectTo({ url: '/pages/detail/index' })

// 跳转到 tabBar 页面
Taro.switchTab({ url: '/pages/index/index' })

// 返回上一页
Taro.navigateBack({ delta: 1 })

// 获取路由参数
const router = useRouter()
const { id } = router.params
```

### 图标使用 (lucide-react-taro)

**IMPORTANT: 禁止使用 lucide-react，必须使用 lucide-react-taro 替代。**

lucide-react-taro 是 Lucide 图标库的 Taro 适配版本，专为小程序环境优化，API 与 lucide-react 一致：

```tsx
import { View } from '@tarojs/components'
import { House, Settings, User, Search, Camera, Zap } from 'lucide-react-taro'

const IconDemo = () => {
  return (
    <View className="flex gap-4">
      {/* 基本用法 */}
      <House />
      {/* 自定义尺寸和颜色 */}
      <Settings size={32} color="#1890ff" />
      {/* 自定义描边宽度 */}
      <User size={24} strokeWidth={1.5} />
      {/* 绝对描边宽度（描边不随 size 缩放） */}
      <Camera size={48} strokeWidth={2} absoluteStrokeWidth />
      {/* 组合使用 */}
      <Zap size={32} color="#ff6b00" strokeWidth={1.5} className="my-icon" />
    </View>
  )
}
```

常用属性：
- `size` - 图标大小（默认 24）
- `color` - 图标颜色（默认 currentColor，小程序中建议显式设置）
- `strokeWidth` - 线条粗细（默认 2）
- `absoluteStrokeWidth` - 绝对描边宽度，启用后描边不随 size 缩放
- `className` / `style` - 自定义样式

更多图标请访问：https://lucide.dev/icons

### TabBar 图标生成 (CLI 工具)

**IMPORTANT: 微信小程序的 TabBar 不支持 base64 或 SVG 图片，必须使用本地 PNG 文件。**

lucide-react-taro 提供了 CLI 工具来生成 TabBar 所需的 PNG 图标：

```bash
# 生成带选中状态的图标
npx taro-lucide-tabbar House Settings User -c "#999999" -a "#1890ff"

# 指定输出目录和尺寸
npx taro-lucide-tabbar House Settings User -c "#999999" -a "#1890ff" -o ./src/assets/tabbar -s 81
```

CLI 参数：
- `--color, -c` (默认 #000000): 图标颜色
- `--active-color, -a`: 选中状态颜色
- `--size, -s` (默认 81): 图标尺寸
- `--output, -o` (默认 ./tabbar-icons): 输出目录
- `--stroke-width` (默认 2): 描边宽度

在 `app.config.ts` 中使用生成的图标：

> IMPORTANT：iconPath 和 selectedIconPath 必须以 `./` 开头，否则图标无法渲染

```typescript
export default defineAppConfig({
  tabBar: {
    color: '#999999',
    selectedColor: '#1890ff',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
        iconPath: './assets/tabbar/house.png',
        selectedIconPath: './assets/tabbar/house-active.png',
      },
      {
        pagePath: 'pages/settings/index',
        text: '设置',
        iconPath: './assets/tabbar/settings.png',
        selectedIconPath: './assets/tabbar/settings-active.png',
      },
      {
        pagePath: 'pages/user/index',
        text: '用户',
        iconPath: './assets/tabbar/user.png',
        selectedIconPath: './assets/tabbar/user-active.png',
      },
    ],
  },
})

### Tailwind CSS 样式开发

IMPORTANT：必须使用 tailwindcss 实现样式，只有在必要情况下才能 fallback 到 css / less

> 项目已集成 Tailwind CSS 4.x + weapp-tailwindcss，支持跨端原子化样式：

```tsx
import { View, Text } from '@tarojs/components'
import { Button } from '@/components/ui/button'

<View className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
  <Text className="text-2xl font-bold text-blue-600 mb-4">标题</Text>
  <View className="w-full px-4">
    <Button className="w-full" size="lg">
      按钮
    </Button>
  </View>
</View>
```

### 性能优化

#### 图片懒加载

```tsx
import { Image } from '@tarojs/components'

<Image src={imageUrl} lazyLoad mode="aspectFill" />
```

#### 虚拟列表

```tsx
import { VirtualList } from '@tarojs/components'

<VirtualList
  height={500}
  itemData={list}
  itemCount={list.length}
  itemSize={100}
  renderItem={({ index, style, data }) => (
    <View style={style}>{data[index].name}</View>
  )}
/>
```

#### 分包加载

```typescript
// src/app.config.ts
export default defineAppConfig({
  pages: ['pages/index/index'],
  subPackages: [
    {
      root: 'packageA',
      pages: ['pages/detail/index'],
    },
  ],
})
```

### 小程序限制

| 限制项   | 说明                                     |
| -------- | ---------------------------------------- |
| 主包体积 | ≤ 2MB                                    |
| 总包体积 | ≤ 20MB                                   |
| 域名配置 | 生产环境需在小程序后台配置合法域名       |
| 本地开发 | 需在微信开发者工具开启「不校验合法域名」 |

### 权限配置

```typescript
// src/app.config.ts
export default defineAppConfig({
  // ...其他配置
  permission: {
    'scope.userLocation': {
      desc: '你的位置信息将用于小程序位置接口的效果展示'
    }
  },
  requiredPrivateInfos: ['getLocation', 'chooseAddress']
})
```

### 位置服务

```typescript
// 需先在 app.config.ts 中配置 permission
async function getLocation(): Promise<Taro.getLocation.SuccessCallbackResult> {
  return await Taro.getLocation({ type: 'gcj02' })
}
```

## 云函数开发规范

本项目后端使用微信云开发（云函数），代码位于 `cloudfunctions/` 目录。

### 云函数结构

```sh
cloudfunctions/
├── checkin/           # 入住登记
│   ├── index.js       # 云函数入口
│   ├── package.json   # 依赖配置
│   └── config.json    # 云函数配置
├── checkout/          # 搬离登记
├── getCheckinList/    # 获取入住列表
├── getCheckoutList/   # 获取搬离列表
├── exportData/        # 导出数据
└── addBed/            # 添加床位
```

### 云函数开发命令

```bash
# 上传云函数（在微信开发者工具中操作）
# 右键点击云函数文件夹 -> 上传并部署：云端安装依赖

# 云函数调试
# 在微信开发者工具中，点击「云开发」->「云函数」-> 选择云函数 -> 「云端测试」
```

### 云函数示例

```javascript
// cloudfunctions/checkin/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { dormitory, floor, room, position, bed_number, person_name } = event

  // 业务逻辑处理
  // ...

  return {
    code: 200,
    msg: '成功',
    data: { /* ... */ }
  }
}
```

### 云数据库操作

```javascript
// 添加记录
await db.collection('beds').add({
  data: {
    dormitory: '南四巷180号',
    floor: '2',
    room: '201',
    position: 'upper',
    bed_number: '1',
    status: 'empty',
    created_at: new Date().toISOString()
  }
})

// 查询记录
const result = await db.collection('beds')
  .where({
    dormitory: '南四巷180号',
    floor: '2'
  })
  .get()

// 更新记录
await db.collection('beds').doc('record-id').update({
  data: {
    status: 'occupied'
  }
})

// 删除记录
await db.collection('beds').doc('record-id').remove()
```

详细的云开发配置指南请查看 [CLOUD_SETUP_GUIDE.md](./CLOUD_SETUP_GUIDE.md)。

> **注意**：本项目已从 NestJS 迁移到微信云开发。原有的 NestJS 后端代码已废弃，请使用云函数实现业务逻辑。
