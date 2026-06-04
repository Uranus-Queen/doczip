/** हिन्दी */
import type { Locale } from "./en";

const hi: Locale = {
  "landing.badge": "100% ऑफ़लाइन · शून्य डेटा लीक",
  "landing.title": "दस्तावेज़ संपीड़न",
  "landing.subtitle": "दृश्य विश्लेषण · स्मार्ट संपीड़न · फ़ाइलें कभी डिवाइस नहीं छोड़तीं",

  "upload.dragActive": "अपलोड करने के लिए छोड़ें",
  "upload.dragIdle": "फ़ाइल यहाँ खींचें",
  "upload.orText": "या",
  "upload.selectFile": "फ़ाइल चुनने के लिए क्लिक करें",
  "upload.unsupportedFormat": "असमर्थित प्रारूप: .{ext}",
  "upload.fileTooLarge": "फ़ाइल बहुत बड़ी है: {size}",

  "analyzing.title": "विश्लेषण हो रहा है",

  "workspace.back": "वापस",
  "workspace.items": "{count} आइटम",

  "resourceDistribution": "संसाधन वितरण",

  "viewToggle.treemap": "ट्रीमैप",
  "viewToggle.list": "सूची",

  "type.image": "चित्र",
  "type.font": "फ़ॉन्ट",
  "type.metadata": "मेटाडेटा",
  "type.text": "पाठ",
  "type.xml": "XML",
  "type.video": "वीडियो",
  "type.audio": "ऑडियो",
  "type.archive": "संग्रह",
  "type.binary": "बाइनरी",
  "type.other": "अन्य",

  "resourceList.name": "नाम",
  "resourceList.type": "प्रकार",
  "resourceList.size": "आकार",
  "resourceList.percent": "प्रतिशत",

  "actionBar.compress": "संपीड़न",
  "actionBar.levelLow": "कम",
  "actionBar.levelMed": "मध्यम",
  "actionBar.levelHigh": "उच्च",
  "actionBar.selected": "{count} चयनित",
  "actionBar.compressSelected": "चयनित संपीड़ित करें",
  "actionBar.compressing": "संपीड़न हो रहा है…",
  "actionBar.compressAll": "सभी संपीड़ित करें",
  "actionBar.download": "डाउनलोड",
  "actionBar.xml": "XML",
  "actionBar.fonts": "फ़ॉन्ट",

  "result.reduced": "{ratio}% कम हुआ",
  "result.saved": "{size} बचाया",
  "result.downloadCompressed": "संपीड़ित डाउनलोड करें",

  "treemap.loading": "लोड हो रहा है…",

  "formats.more": "+{count} प्रारूप",

  "error.parseFailed": "फ़ाइल विश्लेषण विफल",
  "error.compressFailed": "संपीड़न विफल",
} as const;

export default hi;
