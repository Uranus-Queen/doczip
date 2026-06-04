/** বাংলা */
import type { Locale } from "./en";

const bn: Locale = {
  "landing.badge": "100% অফলাইন · শূন্য ডেটা ফাঁস",
  "landing.title": "ডকুমেন্ট কম্প্রেশন",
  "landing.subtitle": "ভিজ্যুয়াল বিশ্লেষণ · স্মার্ট কম্প্রেশন · ফাইল কখনো আপনার ডিভাইস ছাড়ে না",

  "upload.dragActive": "আপলোড করতে ছেড়ে দিন",
  "upload.dragIdle": "ফাইল এখানে টেনে আনুন",
  "upload.orText": "অথবা",
  "upload.selectFile": "ফাইল নির্বাচন করতে ক্লিক করুন",
  "upload.unsupportedFormat": "অসমর্থিত ফরম্যাট: .{ext}",
  "upload.fileTooLarge": "ফাইল খুব বড়: {size}",

  "analyzing.title": "বিশ্লেষণ চলছে",

  "workspace.back": "পিছনে",
  "workspace.items": "{count}টি আইটেম",

  "resourceDistribution": "রিসোর্স বিতরণ",

  "viewToggle.treemap": "ট্রিম্যাপ",
  "viewToggle.list": "তালিকা",

  "type.image": "ছবি",
  "type.font": "ফন্ট",
  "type.metadata": "মেটাডেটা",
  "type.text": "টেক্সট",
  "type.xml": "XML",
  "type.video": "ভিডিও",
  "type.audio": "অডিও",
  "type.archive": "আর্কাইভ",
  "type.binary": "বাইনারি",
  "type.other": "অন্যান্য",

  "resourceList.name": "নাম",
  "resourceList.type": "ধরন",
  "resourceList.size": "আকার",
  "resourceList.percent": "শতাংশ",

  "actionBar.compress": "কম্প্রেস",
  "actionBar.levelLow": "কম",
  "actionBar.levelMed": "মাঝারি",
  "actionBar.levelHigh": "বেশি",
  "actionBar.selected": "{count}টি নির্বাচিত",
  "actionBar.compressSelected": "নির্বাচিত কম্প্রেস করুন",
  "actionBar.compressing": "কম্প্রেশন চলছে…",
  "actionBar.compressAll": "সব কম্প্রেস করুন",
  "actionBar.download": "ডাউনলোড",
  "actionBar.xml": "XML",
  "actionBar.fonts": "ফন্ট",

  "result.reduced": "{ratio}% কমেছে",
  "result.saved": "{size} সাশ্রয়",
  "result.downloadCompressed": "কম্প্রেসড ডাউনলোড করুন",

  "treemap.loading": "লোড হচ্ছে…",

  "formats.more": "+{count}টি ফরম্যাট",

  "error.parseFailed": "ফাইল বিশ্লেষণ ব্যর্থ",
  "error.compressFailed": "কম্প্রেশন ব্যর্থ",
} as const;

export default bn;
