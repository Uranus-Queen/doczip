import type { DocumentParser, SupportedFormat, FORMAT_EXTENSIONS } from "@/lib/types";
import { OfficeParser } from "./office-parser";
import { PdfParser } from "./pdf-parser";
import { ImageParser } from "./image-parser";

// Extension → format mapping
const EXT_MAP: Record<string, SupportedFormat> = {
  pdf: "pdf", docx: "docx", pptx: "pptx", xlsx: "xlsx",
  jpg: "jpg", jpeg: "jpeg", png: "png", gif: "gif", bmp: "bmp",
  tiff: "tiff", tif: "tiff", webp: "webp", ico: "ico", svg: "svg",
  mp3: "mp3", wav: "wav", ogg: "ogg", flac: "flac",
  mp4: "mp4", avi: "avi", mov: "mov", mkv: "mkv", webm: "webm",
  zip: "zip",
  ttf: "ttf", otf: "otf", woff: "woff", woff2: "woff2",
  txt: "txt", csv: "csv", json: "json", xml: "xml",
};

export function detectFormat(file: File): SupportedFormat {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const fmt = EXT_MAP[ext];
  if (!fmt) throw new Error(`Unsupported file format: .${ext}`);
  return fmt;
}

const IMAGE_FORMATS = new Set(["jpg", "jpeg", "png", "gif", "bmp", "tiff", "webp", "ico", "svg"]);
const OFFICE_FORMATS = new Set(["docx", "pptx", "xlsx"]);

export function getParser(format: SupportedFormat): DocumentParser {
  if (OFFICE_FORMATS.has(format)) return new OfficeParser(format as "docx" | "pptx" | "xlsx");
  if (format === "pdf") return new PdfParser();
  if (IMAGE_FORMATS.has(format)) return new ImageParser(format);
  // For other formats (video, audio, archive, font, text),
  // the Worker handles them directly. Main-thread fallback is a no-op parser.
  return new GenericParser();
}

/** Generic parser for formats that only the Worker supports. */
class GenericParser implements DocumentParser {
  async parse(file: File): Promise<import("@/lib/types").ResourceNode[]> {
    return [{
      id: "generic-0",
      name: file.name,
      path: file.name,
      type: "other",
      size: file.size,
      selected: false,
    }];
  }
  async compress(file: File): Promise<Blob> {
    return new Blob([await file.arrayBuffer()]);
  }
}

// Re-export for convenience
export { ImageParser } from "./image-parser";

export const ACCEPTED_EXTENSIONS = Object.keys(EXT_MAP).map(e => `.${e}`).join(",");
export const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
