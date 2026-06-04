/** Español */
import type { Locale } from "./en";

const es: Locale = {
  "landing.badge": "100% Sin conexión · Cero fuga de datos",
  "landing.title": "Comprimir Documentos",
  "landing.subtitle": "Análisis visual · Compresión inteligente · Los archivos nunca salen de tu dispositivo",

  "upload.dragActive": "Suelta para subir",
  "upload.dragIdle": "Arrastra el archivo aquí",
  "upload.orText": "o",
  "upload.selectFile": "haz clic para seleccionar",
  "upload.unsupportedFormat": "Formato no soportado: .{ext}",
  "upload.fileTooLarge": "Archivo demasiado grande: {size}",

  "analyzing.title": "Analizando",

  "workspace.back": "Volver",
  "workspace.items": "{count} elementos",

  "resourceDistribution": "Distribución de recursos",

  "viewToggle.treemap": "Mapa de árbol",
  "viewToggle.list": "Lista",

  "type.image": "Imagen",
  "type.font": "Fuente",
  "type.metadata": "Metadatos",
  "type.text": "Texto",
  "type.xml": "XML",
  "type.video": "Video",
  "type.audio": "Audio",
  "type.archive": "Archivo",
  "type.binary": "Binario",
  "type.other": "Otro",

  "resourceList.name": "Nombre",
  "resourceList.type": "Tipo",
  "resourceList.size": "Tamaño",
  "resourceList.percent": "Porcentaje",

  "actionBar.compress": "Comprimir",
  "actionBar.levelLow": "Bajo",
  "actionBar.levelMed": "Medio",
  "actionBar.levelHigh": "Alto",
  "actionBar.selected": "{count} seleccionados",
  "actionBar.compressSelected": "Comprimir seleccionados",
  "actionBar.compressing": "Comprimiendo…",
  "actionBar.compressAll": "Comprimir todo",
  "actionBar.recompress": "Recomprimir",
  "actionBar.download": "Descargar",
  "actionBar.xml": "XML",
  "actionBar.fonts": "Fuentes",

  "result.reduced": "Reducido {ratio}%",
  "result.saved": "Ahorrado {size}",
  "result.downloadCompressed": "Descargar comprimido",

  "treemap.loading": "Cargando…",

  "formats.more": "+{count} formatos",

  "error.parseFailed": "Error al analizar el archivo",
  "error.compressFailed": "Error en la compresión",
} as const;

export default es;
