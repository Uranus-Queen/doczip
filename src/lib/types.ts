// === Resource Node (tree structure for document internal resources) ===

export type ResourceType =
  | "image"
  | "font"
  | "metadata"
  | "text"
  | "xml"
  | "video"
  | "audio"
  | "archive"
  | "binary"
  | "other";

export interface ResourceNode {
  id: string;
  name: string;
  path: string;
  type: ResourceType;
  size: number;
  compressedSize?: number;
  selected: boolean;
  unused?: boolean; // true if font is not referenced in document
  children?: ResourceNode[];
}

// === Supported file formats ===

export type SupportedFormat =
  | "pdf"
  | "docx" | "pptx" | "xlsx"
  | "jpg" | "jpeg" | "png" | "gif" | "bmp"
  | "tiff" | "webp" | "ico" | "svg"
  | "mp3" | "wav" | "ogg" | "flac"
  | "mp4" | "avi" | "mov" | "mkv" | "webm"
  | "zip"
  | "ttf" | "otf" | "woff" | "woff2"
  | "txt" | "csv" | "json" | "xml";

// === Compression ===

export type CompressionLevel = "low" | "medium" | "high";

export interface CompressionOptions {
  stripFonts?: boolean;
  minifyXml?: boolean;
  subsetFonts?: boolean; // font subsetting instead of full strip
}

// === Analysis result ===

export interface AnalysisResult {
  fileName: string;
  format: SupportedFormat;
  originalSize: number;
  resources: ResourceNode[];
  compressedBlob?: Blob;
  compressedSize?: number;
}

// === Parser interface ===

export interface DocumentParser {
  parse(file: File): Promise<ResourceNode[]>;
  compress(
    file: File,
    resources: ResourceNode[],
    level: CompressionLevel,
    options?: CompressionOptions
  ): Promise<Blob>;
}

// === Format categories ===

export type FormatCategory = "office" | "image" | "video" | "audio" | "archive" | "font" | "text" | "pdf";

export const FORMAT_EXTENSIONS: Record<string, SupportedFormat> = {
  pdf: "pdf", docx: "docx", pptx: "pptx", xlsx: "xlsx",
  jpg: "jpg", jpeg: "jpeg", png: "png", gif: "gif", bmp: "bmp",
  tiff: "tiff", tif: "tiff", webp: "webp", ico: "ico", svg: "svg",
  mp3: "mp3", wav: "wav", ogg: "ogg", flac: "flac",
  mp4: "mp4", avi: "avi", mov: "mov", mkv: "mkv", webm: "webm",
  zip: "zip",
  ttf: "ttf", otf: "otf", woff: "woff", woff2: "woff2",
  txt: "txt", csv: "csv", json: "json", xml: "xml",
};

export function getFormatCategory(fmt: SupportedFormat): FormatCategory {
  if (["docx", "pptx", "xlsx"].includes(fmt)) return "office";
  if (["jpg", "jpeg", "png", "gif", "bmp", "tiff", "webp", "ico", "svg"].includes(fmt)) return "image";
  if (["mp4", "avi", "mov", "mkv", "webm"].includes(fmt)) return "video";
  if (["mp3", "wav", "ogg", "flac"].includes(fmt)) return "audio";
  if (fmt === "zip") return "archive";
  if (["ttf", "otf", "woff", "woff2"].includes(fmt)) return "font";
  if (fmt === "pdf") return "pdf";
  return "text";
}
