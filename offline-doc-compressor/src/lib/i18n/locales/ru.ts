/** Русский */
import type { Locale } from "./en";

const ru: Locale = {
  "landing.badge": "100% Офлайн · Нулевая утечка данных",
  "landing.title": "Сжатие Документов",
  "landing.subtitle": "Визуальный анализ · Умное сжатие · Файлы никогда не покидают ваше устройство",

  "upload.dragActive": "Отпустите для загрузки",
  "upload.dragIdle": "Перетащите файл сюда",
  "upload.orText": "или",
  "upload.selectFile": "нажмите для выбора файла",
  "upload.unsupportedFormat": "Неподдерживаемый формат: .{ext}",
  "upload.fileTooLarge": "Файл слишком большой: {size}",

  "analyzing.title": "Анализ",

  "workspace.back": "Назад",
  "workspace.items": "{count} элементов",

  "resourceDistribution": "Распределение ресурсов",

  "viewToggle.treemap": "Карта",
  "viewToggle.list": "Список",

  "type.image": "Изображение",
  "type.font": "Шрифт",
  "type.metadata": "Метаданные",
  "type.text": "Текст",
  "type.xml": "XML",
  "type.video": "Видео",
  "type.audio": "Аудио",
  "type.archive": "Архив",
  "type.binary": "Двоичный",
  "type.other": "Другое",

  "resourceList.name": "Имя",
  "resourceList.type": "Тип",
  "resourceList.size": "Размер",
  "resourceList.percent": "Процент",

  "actionBar.compress": "Сжатие",
  "actionBar.levelLow": "Низкое",
  "actionBar.levelMed": "Среднее",
  "actionBar.levelHigh": "Высокое",
  "actionBar.selected": "{count} выбрано",
  "actionBar.compressSelected": "Сжать выбранное",
  "actionBar.compressing": "Сжатие…",
  "actionBar.compressAll": "Сжать всё",
  "actionBar.download": "Скачать",
  "actionBar.xml": "XML",
  "actionBar.fonts": "Шрифты",

  "result.reduced": "Уменьшено на {ratio}%",
  "result.saved": "Сэкономлено {size}",
  "result.downloadCompressed": "Скачать сжатый файл",

  "treemap.loading": "Загрузка…",

  "formats.more": "+{count} форматов",

  "error.parseFailed": "Ошибка анализа файла",
  "error.compressFailed": "Ошибка сжатия",
} as const;

export default ru;
