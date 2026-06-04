/** Français */
import type { Locale } from "./en";

const fr: Locale = {
  "landing.badge": "100% Hors ligne · Zéro fuite de données",
  "landing.title": "Compression de Documents",
  "landing.subtitle": "Analyse visuelle · Compression intelligente · Les fichiers ne quittent jamais votre appareil",

  "upload.dragActive": "Relâchez pour téléverser",
  "upload.dragIdle": "Glissez le fichier ici",
  "upload.orText": "ou",
  "upload.selectFile": "cliquez pour sélectionner",
  "upload.unsupportedFormat": "Format non pris en charge : .{ext}",
  "upload.fileTooLarge": "Fichier trop volumineux : {size}",

  "analyzing.title": "Analyse en cours",

  "workspace.back": "Retour",
  "workspace.items": "{count} éléments",

  "resourceDistribution": "Distribution des ressources",

  "viewToggle.treemap": "Carte arborescente",
  "viewToggle.list": "Liste",

  "type.image": "Image",
  "type.font": "Police",
  "type.metadata": "Métadonnées",
  "type.text": "Texte",
  "type.xml": "XML",
  "type.video": "Vidéo",
  "type.audio": "Audio",
  "type.archive": "Archive",
  "type.binary": "Binaire",
  "type.other": "Autre",

  "resourceList.name": "Nom",
  "resourceList.type": "Type",
  "resourceList.size": "Taille",
  "resourceList.percent": "Pourcentage",

  "actionBar.compress": "Compression",
  "actionBar.levelLow": "Faible",
  "actionBar.levelMed": "Moyen",
  "actionBar.levelHigh": "Élevé",
  "actionBar.selected": "{count} sélectionnés",
  "actionBar.compressSelected": "Compresser la sélection",
  "actionBar.compressing": "Compression…",
  "actionBar.compressAll": "Tout compresser",
  "actionBar.recompress": "Recompresser",
  "actionBar.download": "Télécharger",
  "actionBar.xml": "XML",
  "actionBar.fonts": "Polices",

  "result.reduced": "Réduit de {ratio}%",
  "result.saved": "{size} économisés",
  "result.downloadCompressed": "Télécharger le fichier compressé",

  "treemap.loading": "Chargement…",

  "formats.more": "+{count} formats",

  "error.parseFailed": "Échec de l'analyse du fichier",
  "error.compressFailed": "Échec de la compression",
} as const;

export default fr;
