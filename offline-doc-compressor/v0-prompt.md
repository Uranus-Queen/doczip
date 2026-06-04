# v0 UI 重构提示词

请为一个离线文档压缩网站重构前端界面。

## 技术栈

- Next.js 16 + TypeScript + App Router
- Tailwind CSS v4 + shadcn/ui (New York style, Slate base color)
- D3.js 矩形树图（SVG 渲染，本地打包，完全离线）
- lucide-react 图标

## 项目核心逻辑

这是一个**纯前端离线文档压缩工具**，零后端请求。用户拖入文档后，浏览器解析内部资源（图片、字体、元数据等），用矩形树图可视化展示，支持选择性压缩后下载。

## 已有的后端 API（不需要重新实现，直接调用）

```typescript
// src/lib/worker-client.ts
import { parseInWorker, compressInWorker } from "@/lib/worker-client";

// 解析文档 → 返回资源树
const resources: ResourceNode[] = await parseInWorker(file);

// 压缩文档 → 返回压缩后的 Blob
const blob: Blob = await compressInWorker(file, resources, level, options);
```

```typescript
// src/lib/types.ts — 核心类型
type ResourceType = "image" | "font" | "metadata" | "text" | "xml" | "binary" | "other";
type CompressionLevel = "low" | "medium" | "high";
type SupportedFormat = "pdf" | "docx" | "pptx" | "xlsx" | "jpg" | "png";

interface ResourceNode {
  id: string;
  name: string;       // 如 "image1.jpg"
  path: string;       // ZIP 内部路径
  type: ResourceType;
  size: number;        // 字节
  selected: boolean;
  children?: ResourceNode[];
}

interface CompressionOptions {
  stripFonts?: boolean;   // 剥离嵌入字体
  minifyXml?: boolean;    // XML 压缩
}
```

```typescript
// src/lib/format.ts — 格式化工具
import { formatBytes, compressionRatio } from "@/lib/format";
formatBytes(1024000)        // → "1000 KB"
compressionRatio(2000, 800) // → 60 (百分比)
```

```typescript
// src/lib/parsers/index.ts — 文件校验
import { detectFormat, ACCEPTED_EXTENSIONS, MAX_FILE_SIZE } from "@/lib/parsers";
// ACCEPTED_EXTENSIONS = ".pdf,.docx,.pptx,.xlsx,.jpg,.jpeg,.png"
// MAX_FILE_SIZE = 100MB
```

## UI 需求（按 PRD 要求）

### 1. 首页 — 拖拽上传区

- 大面积拖拽区域，居中显示
- 文案："拖入文档或点击选择"
- 副标题："支持 PDF、DOCX、PPTX、XLSX、JPG、PNG（最大 100MB）"
- 支持 drag-and-drop 和 click 打开文件选择器
- 文件格式和大小校验，错误提示

### 2. 分析中状态

- 文件拖入后显示加载动画 + "正在分析文档结构…"
- 此时上传区域禁用

### 3. 文件信息栏

- 显示文件格式 Badge（如 "PPTX"）
- 文件名
- 原始大小 + 资源数量

### 4. 资源可视化区域（核心亮点）

- **矩形树图视图**：
  - D3 treemap SVG 渲染，用不同大小色块展示各类资源占比
  - 颜色按资源类型区分：图片=蓝色、字体=绿色、元数据=琥珀色、XML=橙色、二进制=靛蓝、其他=灰色
  - 鼠标悬停显示 Tooltip（资源名 + 类型 + 大小）
  - 点击色块切换 selected 状态（选中有白色边框，未选中 60% 透明度）
  - 色块内显示资源名和大小文字
  - 底部右侧显示颜色图例
  - 使用 ResizeObserver 响应容器尺寸变化

- **列表视图**：
  - 表格：Checkbox + 名称 + 类型 Badge + 大小 + 占比百分比
  - 按大小降序排列
  - 选中行高亮

- **视图切换**：Tabs 组件切换"树图"/"列表"

### 5. 操作栏

- **压缩等级滑块**：低/中/高 三档，显示当前等级文字
- **Office 选项**（仅对 DOCX/PPTX/XLSX 显示）：
  - Checkbox：XML 压缩（默认开启）
  - Checkbox：剥离嵌入字体（默认关闭）
- **已选统计**：显示已选资源数量和总大小
- **按钮**：
  - "压缩选中资源"（outline 样式，有选中资源时可用）
  - "全部压缩"（primary 样式，压缩中显示"压缩中…"）

### 6. 压缩结果区

- 渐变绿色背景卡片
- "压缩完成！"标题
- 原始大小 → 压缩后大小（带箭头图标）
- 压缩率进度条 + 百分比 + 节省大小
- 绿色"下载压缩文件"大按钮

### 7. 页头

- 左侧：FileText 图标 + "离线文档压缩"标题
- 右侧（有文件时）："← 返回上传"按钮

## 整体布局

- 页面最小高度 `min-h-screen`
- 内容区最大宽度 `max-w-6xl`，居中
- 暗色/亮色主题支持（CSS variables）
- 响应式：移动端操作栏纵向堆叠

## 交互流程

1. 用户拖入文件 → 校验格式和大小 → 解析资源（Worker）
2. 树图/列表展示资源 → 用户点击选中资源
3. 用户选择压缩等级 + Office 选项
4. 点击压缩 → Worker 压缩 → 显示结果
5. 点击下载 → 浏览器下载压缩文件
6. "返回上传" → 清空所有状态，回到上传界面

## 重要注意事项

- 所有组件都是 `"use client"` — 这是纯客户端应用
- D3 treemap 必须用 `useRef` + `useEffect` 驱动渲染
- 树图和列表共享同一个 `selected` 状态，切换视图不丢失选中
- `<html>` 和 `<body>` 需要 `suppressHydrationWarning`（Dark Reader 兼容）
- 压缩后的文件名格式：`原文件名_compressed.扩展名`
- 不要引入任何 CDN 或外部网络资源，所有库必须本地打包

## 文件输出

请输出以下文件的完整代码：
- `src/app/page.tsx` — 主页面
- `src/components/file-upload.tsx` — 上传组件
- `src/components/treemap.tsx` — D3 树图
- `src/components/resource-list.tsx` — 资源列表
- `src/components/view-toggle.tsx` — 视图切换
- `src/components/action-bar.tsx` — 操作栏
- `src/components/result-panel.tsx` — 结果面板
