/** 中文（简体） */
import type { Locale } from "./en";

const zh: Locale = {
  "landing.badge": "100% 离线 · 零数据泄露",
  "landing.title": "文档压缩",
  "landing.subtitle": "可视化分析 · 智能压缩 · 文件永不离开设备",

  "upload.dragActive": "松手即可上传",
  "upload.dragIdle": "将文件拖到此处",
  "upload.orText": "或",
  "upload.selectFile": "点按选择文件",
  "upload.unsupportedFormat": "不支持的格式: .{ext}",
  "upload.fileTooLarge": "文件过大: {size}",

  "analyzing.title": "正在分析",

  "workspace.back": "返回",
  "workspace.items": "{count} 项",

  "resourceDistribution": "资源分布",

  "viewToggle.treemap": "树图",
  "viewToggle.list": "列表",

  "type.image": "图片",
  "type.font": "字体",
  "type.metadata": "元数据",
  "type.text": "文本",
  "type.xml": "XML",
  "type.video": "视频",
  "type.audio": "音频",
  "type.archive": "归档",
  "type.binary": "二进制",
  "type.other": "其他",

  "resourceList.name": "名称",
  "resourceList.type": "类型",
  "resourceList.size": "大小",
  "resourceList.percent": "占比",

  "actionBar.compress": "压缩",
  "actionBar.levelLow": "低",
  "actionBar.levelMed": "中",
  "actionBar.levelHigh": "高",
  "actionBar.selected": "已选 {count} 项",
  "actionBar.compressSelected": "压缩选中",
  "actionBar.compressing": "压缩中…",
  "actionBar.compressAll": "全部压缩",
  "actionBar.recompress": "重新压缩",
  "actionBar.download": "下载",
  "actionBar.xml": "XML",
  "actionBar.fonts": "字体",

  "result.reduced": "减少 {ratio}%",
  "result.saved": "节省 {size}",
  "result.downloadCompressed": "下载压缩文件",

  "treemap.loading": "加载中…",

  "formats.more": "+{count} 格式",

  "error.parseFailed": "文件分析失败",
  "error.compressFailed": "压缩失败",
} as const;

export default zh;
