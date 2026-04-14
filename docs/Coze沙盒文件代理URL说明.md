# Coze 沙盒文件代理 URL 说明

## 🔍 URL 解析

```
https://code.coze.cn/api/sandbox/coze_coding/file/proxy?expire_time=-1&file_path=assets%2Fimage.png&nonce=...&project_id=...&sign=...
```

### 参数说明

| 参数 | 说明 | 示例值 |
|------|------|--------|
| `expire_time` | 过期时间 | `-1` 表示永不过期 |
| `file_path` | 文件路径 | `assets%2Fimage.png`（URL编码，解码后：`assets/image.png`） |
| `nonce` | 随机数 | 防止缓存攻击 |
| `project_id` | 项目ID | `7619391393189953536` |
| `sign` | 签名 | 验证访问权限 |

---

## 📋 作用

这是 **Coze 沙盒环境的文件代理 URL**，用于在开发环境中访问项目内的静态资源文件。

### 1. 开发环境访问静态资源
在开发环境中，这个URL用于访问项目中的静态文件，如：
- TabBar 图标
- 页面图片
- 其他静态资源

### 2. 自动生成
这个URL通常由以下工具自动生成：
- `coze dev` - 开发服务器
- `taro-lucide-tabbar` - TabBar 图标生成工具

### 3. 工作原理

**开发环境：**
```
代码中的相对路径 → 代理URL → 实际文件
./assets/tabbar/building.png → https://code.coze.cn/api/.../file_path=assets%2Ftabbar%2Fbuilding.png → 读取实际文件
```

**生产环境（小程序打包后）：**
```
代码中的相对路径 → 本地路径
./assets/tabbar/building.png → ./assets/tabbar/building.png
```

---

## ⚠️ 重要说明

### 1. 仅用于开发环境
- ✅ 开发环境：使用代理URL访问
- ❌ 生产环境：使用相对路径
- ❌ **不要在代码中直接使用这种代理URL**

### 2. 项目中是否存在此文件

经过检查，**当前项目中不存在 `assets/image.png` 文件**。

项目中现有的图片文件：
```
src/assets/tabbar/
  ├── building.png
  ├── building-active.png
  ├── hard-drive-upload.png
  ├── hard-drive-upload-active.png
  ├── log-out.png
  ├── log-out-active.png
  ├── qr-code.png
  └── qr-code-active.png
```

### 3. 可能的情况

这个 `assets/image.png` 文件可能是：
- ❌ 其他项目的示例文件
- ❌ 文档或说明中的占位符
- ❌ 未提交到项目的临时文件
- ❌ 已删除但URL仍被缓存的文件

---

## 🛠️ 正确使用方法

### TabBar 图标配置（正确示例）

```typescript
// src/app.config.ts
export default defineAppConfig({
  tabBar: {
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
        iconPath: './assets/tabbar/building.png',  // ✅ 正确：使用相对路径
        selectedIconPath: './assets/tabbar/building-active.png'
      }
    ]
  }
})
```

### 页面中使用图片（正确示例）

```typescript
import buildingIcon from './assets/tabbar/building.png'  // ✅ 正确：导入模块

export default function HomePage() {
  return (
    <View>
      <Image src={buildingIcon} />  {/* ✅ 正确：使用导入的变量 */}
    </View>
  )
}
```

### ❌ 错误示例

```typescript
// ❌ 错误：不要直接使用代理URL
const imageUrl = 'https://code.coze.cn/api/sandbox/coze_coding/file/proxy?file_path=assets%2Fimage.png&...'

export default function HomePage() {
  return (
    <View>
      <Image src={imageUrl} />  {/* ❌ 错误：生产环境会失效 */}
    </View>
  )
}
```

---

## 🔍 如何找到图片被使用的地方

如果你想找到某个图片文件在哪里被使用：

```bash
# 方法 1：搜索文件名
grep -r "building.png" --include="*.tsx" --include="*.ts" --include="*.json"

# 方法 2：查找所有图片文件
find src -name "*.png" -o -name "*.jpg" -o -name "*.jpeg"

# 方法 3：查找 app.config.ts 中的配置
cat src/app.config.ts | grep -A 5 "iconPath"
```

---

## 📝 总结

### URL 作用
- ✅ 用于开发环境访问静态资源
- ✅ 由 Coze 开发服务器自动生成
- ✅ 包含签名验证，确保安全

### 使用原则
- ✅ 代码中使用相对路径
- ✅ 通过打包工具自动转换为生产路径
- ❌ 不要在代码中直接使用代理URL

### 项目状态
- ✅ 当前项目没有 `assets/image.png` 文件
- ✅ 8 个 TabBar 图标正常配置
- ✅ 所有图片使用相对路径

---

**如果这个URL是你项目中某处显示的，请告诉我具体在哪里看到的，我可以帮你进一步排查！**
