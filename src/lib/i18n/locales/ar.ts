/** العربية */
import type { Locale } from "./en";

const ar: Locale = {
  "landing.badge": "بدون اتصال 100% · صفر تسريب بيانات",
  "landing.title": "ضغط المستندات",
  "landing.subtitle": "تحليل مرئي · ضغط ذكي · الملفات لا تغادر جهازك أبدًا",

  "upload.dragActive": "أفلت للرفع",
  "upload.dragIdle": "اسحب الملف هنا",
  "upload.orText": "أو",
  "upload.selectFile": "انقر لاختيار ملف",
  "upload.unsupportedFormat": "صيغة غير مدعومة: .{ext}",
  "upload.fileTooLarge": "الملف كبير جدًا: {size}",

  "analyzing.title": "جارٍ التحليل",

  "workspace.back": "رجوع",
  "workspace.items": "{count} عنصر",

  "resourceDistribution": "توزيع الموارد",

  "viewToggle.treemap": "خريطة شجرية",
  "viewToggle.list": "قائمة",

  "type.image": "صورة",
  "type.font": "خط",
  "type.metadata": "بيانات وصفية",
  "type.text": "نص",
  "type.xml": "XML",
  "type.video": "فيديو",
  "type.audio": "صوت",
  "type.archive": "أرشيف",
  "type.binary": "ثنائي",
  "type.other": "أخرى",

  "resourceList.name": "الاسم",
  "resourceList.type": "النوع",
  "resourceList.size": "الحجم",
  "resourceList.percent": "النسبة",

  "actionBar.compress": "ضغط",
  "actionBar.levelLow": "منخفض",
  "actionBar.levelMed": "متوسط",
  "actionBar.levelHigh": "مرتفع",
  "actionBar.selected": "{count} محدد",
  "actionBar.compressSelected": "ضغط المحدد",
  "actionBar.compressing": "جارٍ الضغط…",
  "actionBar.compressAll": "ضغط الكل",
  "actionBar.recompress": "إعادة الضغط",
  "actionBar.download": "تحميل",
  "actionBar.xml": "XML",
  "actionBar.fonts": "خطوط",

  "result.reduced": "تم التخفيض {ratio}%",
  "result.saved": "تم التوفير {size}",
  "result.downloadCompressed": "تحميل الملف المضغوط",

  "treemap.loading": "جارٍ التحميل…",

  "formats.more": "+{count} صيغة",

  "error.parseFailed": "فشل تحليل الملف",
  "error.compressFailed": "فشل الضغط",
} as const;

export default ar;
