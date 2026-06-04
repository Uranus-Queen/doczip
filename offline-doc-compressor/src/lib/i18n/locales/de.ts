/** Deutsch */
import type { Locale } from "./en";

const de: Locale = {
  "landing.badge": "100% Offline · Keine Datenweitergabe",
  "landing.title": "Dokumentkompression",
  "landing.subtitle": "Visuelle Analyse · Intelligente Kompression · Dateien verlassen Ihr Gerät nie",

  "upload.dragActive": "Loslassen zum Hochladen",
  "upload.dragIdle": "Datei hierher ziehen",
  "upload.orText": "oder",
  "upload.selectFile": "klicken zum Auswählen",
  "upload.unsupportedFormat": "Nicht unterstütztes Format: .{ext}",
  "upload.fileTooLarge": "Datei zu groß: {size}",

  "analyzing.title": "Wird analysiert",

  "workspace.back": "Zurück",
  "workspace.items": "{count} Elemente",

  "resourceDistribution": "Ressourcenverteilung",

  "viewToggle.treemap": "Baumkarte",
  "viewToggle.list": "Liste",

  "type.image": "Bild",
  "type.font": "Schriftart",
  "type.metadata": "Metadaten",
  "type.text": "Text",
  "type.xml": "XML",
  "type.video": "Video",
  "type.audio": "Audio",
  "type.archive": "Archiv",
  "type.binary": "Binär",
  "type.other": "Sonstige",

  "resourceList.name": "Name",
  "resourceList.type": "Typ",
  "resourceList.size": "Größe",
  "resourceList.percent": "Prozent",

  "actionBar.compress": "Komprimierung",
  "actionBar.levelLow": "Niedrig",
  "actionBar.levelMed": "Mittel",
  "actionBar.levelHigh": "Hoch",
  "actionBar.selected": "{count} ausgewählt",
  "actionBar.compressSelected": "Auswahl komprimieren",
  "actionBar.compressing": "Komprimierung…",
  "actionBar.compressAll": "Alle komprimieren",
  "actionBar.download": "Herunterladen",
  "actionBar.xml": "XML",
  "actionBar.fonts": "Schriftarten",

  "result.reduced": "Reduziert um {ratio}%",
  "result.saved": "{size} gespart",
  "result.downloadCompressed": "Komprimierte Datei herunterladen",

  "treemap.loading": "Wird geladen…",

  "formats.more": "+{count} Formate",

  "error.parseFailed": "Dateianalyse fehlgeschlagen",
  "error.compressFailed": "Komprimierung fehlgeschlagen",
} as const;

export default de;
