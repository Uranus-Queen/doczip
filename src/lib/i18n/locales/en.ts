/** English locale — reference translations */
const en = {
  // Landing page
  "landing.badge": "100% Offline · Zero Data Leak",
  "landing.title": "Doc Compress",
  "landing.subtitle": "Visual Analysis · Smart Compression · Files Never Leave Your Device",

  // File upload
  "upload.dragActive": "Release to upload",
  "upload.dragIdle": "Drop file here",
  "upload.orText": "or",
  "upload.selectFile": "click to select file",
  "upload.unsupportedFormat": "Unsupported format: .{ext}",
  "upload.fileTooLarge": "File too large: {size}",

  // Analyzing
  "analyzing.title": "Analyzing",

  // Workspace header
  "workspace.back": "Back",
  "workspace.items": "{count} items",

  // Resource distribution
  "resourceDistribution": "Resource Distribution",

  // View toggle
  "viewToggle.treemap": "Treemap",
  "viewToggle.list": "List",

  // Resource type labels
  "type.image": "Image",
  "type.font": "Font",
  "type.metadata": "Metadata",
  "type.text": "Text",
  "type.xml": "XML",
  "type.video": "Video",
  "type.audio": "Audio",
  "type.archive": "Archive",
  "type.binary": "Binary",
  "type.other": "Other",

  // Resource list sort
  "resourceList.name": "Name",
  "resourceList.type": "Type",
  "resourceList.size": "Size",
  "resourceList.percent": "Percent",

  // Action bar
  "actionBar.compress": "Compress",
  "actionBar.levelLow": "Low",
  "actionBar.levelMed": "Med",
  "actionBar.levelHigh": "High",
  "actionBar.selected": "{count} selected",
  "actionBar.compressSelected": "Compress Selected",
  "actionBar.compressing": "Compressing…",
  "actionBar.compressAll": "Compress All",
  "actionBar.recompress": "Recompress",
  "actionBar.download": "Download",
  "actionBar.xml": "XML",
  "actionBar.fonts": "Fonts",

  // Result panel
  "result.reduced": "Reduced {ratio}%",
  "result.saved": "Saved {size}",
  "result.downloadCompressed": "Download Compressed",

  // Treemap
  "treemap.loading": "Loading…",

  // Formats
  "formats.more": "+{count} formats",

  // Errors
  "error.parseFailed": "File analysis failed",
  "error.compressFailed": "Compression failed",
} as const;

export default en;
export type LocaleKeys = keyof typeof en;
export type Locale = Record<LocaleKeys, string>;
