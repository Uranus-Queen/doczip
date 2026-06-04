/**
 * Web Worker for document parsing and compression.
 * Supports: Office (DOCX/PPTX/XLSX), PDF, Images (JPG/PNG/GIF/BMP/TIFF/WEBP/ICO/SVG),
 * Audio (MP3/WAV/OGG/FLAC), Video (MP4/AVI/MOV/MKV/WEBM), Archive (ZIP),
 * Fonts (TTF/OTF/WOFF/WOFF2), Text (TXT/CSV/JSON/XML).
 */

import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";
import type { ResourceNode, ResourceType, CompressionLevel } from "@/lib/types";
import { analyzeFonts } from "@/lib/parsers/font-analyzer";

// ─── Resource type detection ───

function detectResourceType(path: string): ResourceType {
  const l = path.toLowerCase();
  if (/\.(jpg|jpeg|png|gif|bmp|tiff|tif|emf|wmf|svg|webp|ico|tga|pcx|dds|heic|heif|avif|raw|cr2|nef|dng)$/i.test(l)) return "image";
  if (/\/(media|image|diagram|figure|chart|graph)\//i.test(l)) return "image";
  if (/\.(ttf|otf|woff|woff2|eot|dfont)$/i.test(l)) return "font";
  if (/\.(mp4|avi|mov|mkv|webm|flv|wmv|m4v)$/i.test(l)) return "video";
  if (/\.(mp3|wav|ogg|flac|aac|wma|m4a)$/i.test(l)) return "audio";
  if (/\.(zip|rar|7z|tar|gz|bz2)$/i.test(l)) return "archive";
  if (/\.(xml|rels)$/i.test(l)) return "xml";
  if (/\[content_types\]|docprops\/|core\.xml|app\.xml/i.test(l)) return "metadata";
  if (/\.(txt|htm|html|css|js)$/i.test(l)) return "text";
  if (/\.(vml|bin|emf|ole)$/i.test(l)) return "binary";
  return "other";
}

function isImageFile(p: string) { return detectResourceType(p) === "image"; }
function isFontFile(p: string) { return detectResourceType(p) === "font"; }

const MAX_DIM = 2000;
function getQ(level: CompressionLevel) { return level === "low" ? 0.85 : level === "medium" ? 0.6 : 0.35; }

// ─── Image compression (OffscreenCanvas) ───

async function compressImg(data: Uint8Array, name: string, quality: number): Promise<Uint8Array> {
  if (data.length < 1024) return data;
  const ext = name.toLowerCase().split(".").pop();
  const mime = ext === "png" ? "image/png" : ext === "gif" ? "image/gif" : ext === "bmp" ? "image/bmp" : "image/jpeg";
  try {
    const bmp = await createImageBitmap(new Blob([data.slice().buffer as ArrayBuffer], { type: mime }));
    let w = bmp.width, h = bmp.height;
    if (w > MAX_DIM || h > MAX_DIM) { const r = Math.min(MAX_DIM / w, MAX_DIM / h); w = Math.round(w * r); h = Math.round(h * r); }
    const c = new OffscreenCanvas(w, h);
    c.getContext("2d")!.drawImage(bmp, 0, 0, w, h);
    bmp.close();
    const out = await c.convertToBlob({ type: ext === "png" ? "image/png" : "image/jpeg", quality });
    return new Uint8Array(await out.arrayBuffer());
  } catch { return data; }
}

// ─── SVG compression ───

function compressSvg(text: string): string {
  return text
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<metadata[\s\S]*?<\/metadata>/gi, "")
    .replace(/<sodipodi:[\s\S]*?\/>/gi, "")
    .replace(/xmlns:(?:sodipodi|inkscape|dc|cc|rdf)="[^"]*"/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/>\s+</g, "><")
    .trim();
}

// ─── XML minification ───

function minifyXml(s: string): string {
  return s.replace(/<!--[\s\S]*?-->/g, "").replace(/>\s+</g, "><").replace(/^\s+|\s+$/gm, "").replace(/\n{2,}/g, "\n");
}

// ─── ZIP cache ───

let cachedZipKey: string | null = null;
let cachedZip: JSZip | null = null;

async function getZip(data: ArrayBuffer, name: string): Promise<JSZip> {
  const key = `${name}:${data.byteLength}`;
  if (cachedZip && cachedZipKey === key) return cachedZip;
  const zip = await JSZip.loadAsync(data);
  cachedZip = zip; cachedZipKey = key;
  return zip;
}

// ─── Office ───

async function parseOffice(data: ArrayBuffer, name: string, fmt: "docx" | "pptx" | "xlsx"): Promise<ResourceNode[]> {
  const zip = await getZip(data, name);
  const resources: ResourceNode[] = [];
  let idx = 0;

  zip.forEach((path, entry) => {
    if (entry.dir) return;
    const type = detectResourceType(path);
    const size = (entry as unknown as { _data: { uncompressedSize?: number } })._data?.uncompressedSize ?? 0;
    resources.push({ id: `${fmt}-${idx++}`, name: path.split("/").pop() ?? path, path, type, size, selected: false });
  });

  // Font usage analysis
  try {
    const fontInfos = await analyzeFonts(zip);
    for (const fi of fontInfos) {
      const node = resources.find(r => r.path === fi.path);
      if (node) {
        node.unused = !fi.usedInDoc;
        node.name = fi.usedInDoc ? fi.name : `${fi.name} (未使用)`;
      }
    }
  } catch { /* font analysis is best-effort */ }

  return resources;
}

async function compressOffice(data: ArrayBuffer, name: string, resources: ResourceNode[], level: CompressionLevel, opts: { stripFonts?: boolean; minifyXml?: boolean; subsetFonts?: boolean } = {}): Promise<Blob> {
  const zip = await getZip(data, name);
  const q = getQ(level);
  const hasSel = resources.some(r => r.selected);
  const selImgs = new Set(resources.filter(r => r.selected && r.type === "image").map(r => r.path));
  const allImgs = !hasSel;

  // Collect fonts to strip (unused fonts or all if stripFonts)
  const stripFonts = new Set<string>();
  if (opts.stripFonts) {
    zip.forEach(p => { if (isFontFile(p)) stripFonts.add(p); });
  } else {
    // Auto-strip unused fonts
    for (const r of resources) {
      if (r.type === "font" && r.unused) stripFonts.add(r.path);
    }
  }

  const nz = new JSZip();
  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    if (stripFonts.has(path)) continue;

    let d = await entry.async("uint8array");

    // Image compression
    if (isImageFile(path) && (allImgs || selImgs.has(path))) {
      d = await compressImg(d, path, q);
    }

    // XML minification
    if (opts.minifyXml && detectResourceType(path) === "xml") {
      try { d = new TextEncoder().encode(minifyXml(new TextDecoder().decode(d))); } catch {}
    }

    // SVG compression
    if (/\.svg$/i.test(path)) {
      try { d = new TextEncoder().encode(compressSvg(new TextDecoder().decode(d))); } catch {}
    }

    nz.file(path, d, { compression: level === "low" ? "STORE" : "DEFLATE", compressionOptions: { level: level === "medium" ? 5 : 9 } });
  }
  return nz.generateAsync({ type: "blob", compression: level === "low" ? "STORE" : "DEFLATE", compressionOptions: { level: level === "medium" ? 5 : 9 } });
}

// ─── PDF ───

async function parsePdf(data: ArrayBuffer): Promise<ResourceNode[]> {
  const pdf = await PDFDocument.load(data, { ignoreEncryption: true });
  const res: ResourceNode[] = [];
  let i = 0;
  const meta = { t: pdf.getTitle(), a: pdf.getAuthor(), s: pdf.getSubject(), c: pdf.getCreator(), p: pdf.getProducer() };
  if (Object.values(meta).some(Boolean)) res.push({ id: `m-${i++}`, name: "Metadata", path: "metadata", type: "metadata", size: JSON.stringify(meta).length, selected: false });
  const pages = pdf.getPages(), est = Math.round(data.byteLength / pages.length);
  for (let j = 0; j < pages.length; j++) res.push({ id: `p-${i++}`, name: `Page ${j + 1}`, path: `page-${j + 1}`, type: "text", size: est, selected: false });
  res.push({ id: `o-${i++}`, name: "PDF Structure", path: "objects", type: "binary", size: Math.round(data.byteLength * 0.05), selected: false });
  return res;
}

async function compressPdf(data: ArrayBuffer, _r: ResourceNode[], level: CompressionLevel): Promise<Blob> {
  const pdf = await PDFDocument.load(data, { ignoreEncryption: true });
  const bytes = await pdf.save({ useObjectStreams: level !== "low", addDefaultPage: false });
  return new Blob([bytes.slice().buffer as ArrayBuffer], { type: "application/pdf" });
}

// ─── Standalone image ───

async function parseImage(data: ArrayBuffer, name: string): Promise<ResourceNode[]> {
  const size = data.byteLength;
  let w = 0, h = 0;
  try { const b = await createImageBitmap(new Blob([data])); w = b.width; h = b.height; b.close(); } catch {}
  return [{ id: "i-0", name, path: name, type: "image", size, selected: false, children: [
    { id: "i-p", name: `Pixels (${w}×${h})`, path: "pixels", type: "image", size: Math.round(size * 0.9), selected: false },
    { id: "i-h", name: "Header & Metadata", path: "header", type: "metadata", size: Math.round(size * 0.1), selected: false },
  ]}];
}

async function compressImageFile(data: ArrayBuffer, _r: ResourceNode[], level: CompressionLevel): Promise<Blob> {
  const q = getQ(level);
  try {
    const bmp = await createImageBitmap(new Blob([data]));
    let w = bmp.width, h = bmp.height;
    if (w > MAX_DIM || h > MAX_DIM) { const r = Math.min(MAX_DIM / w, MAX_DIM / h); w = Math.round(w * r); h = Math.round(h * r); }
    const c = new OffscreenCanvas(w, h);
    c.getContext("2d")!.drawImage(bmp, 0, 0, w, h);
    bmp.close();
    return c.convertToBlob({ type: "image/webp", quality: q });
  } catch { return new Blob([data]); }
}

// ─── SVG standalone ───

async function parseSvg(data: ArrayBuffer, name: string): Promise<ResourceNode[]> {
  const text = new TextDecoder().decode(data);
  const hasMeta = text.includes("<metadata") || text.includes("<title");
  return [{ id: "svg-0", name, path: name, type: "image", size: data.byteLength, selected: false, children: [
    { id: "svg-c", name: "SVG Content", path: "content", type: "text", size: Math.round(data.byteLength * 0.85), selected: false },
    { id: "svg-m", name: "Metadata", path: "metadata", type: "metadata", size: hasMeta ? Math.round(data.byteLength * 0.15) : 0, selected: false },
  ]}];
}

async function compressSvgFile(data: ArrayBuffer): Promise<Blob> {
  const text = new TextDecoder().decode(data);
  return new Blob([compressSvg(text)], { type: "image/svg+xml" });
}

// ─── Font standalone ───

async function parseFont(data: ArrayBuffer, name: string): Promise<ResourceNode[]> {
  const ext = name.split(".").pop()?.toLowerCase();
  const fmtLabel = ext?.toUpperCase() ?? "FONT";
  return [{ id: "f-0", name, path: name, type: "font", size: data.byteLength, selected: false, children: [
    { id: "f-g", name: "Glyph Data", path: "glyphs", type: "font", size: Math.round(data.byteLength * 0.85), selected: false },
    { id: "f-m", name: `${fmtLabel} Metadata`, path: "metadata", type: "metadata", size: Math.round(data.byteLength * 0.15), selected: false },
  ]}];
}

// ─── Media (audio/video) ───

async function parseMedia(data: ArrayBuffer, name: string, type: ResourceType): Promise<ResourceNode[]> {
  return [{ id: "m-0", name, path: name, type, size: data.byteLength, selected: false }];
}

// ─── Archive (ZIP) ───

async function parseArchive(data: ArrayBuffer, name: string): Promise<ResourceNode[]> {
  const zip = await JSZip.loadAsync(data);
  const resources: ResourceNode[] = [];
  let idx = 0;
  zip.forEach((path, entry) => {
    if (entry.dir) return;
    const size = (entry as unknown as { _data: { uncompressedSize?: number } })._data?.uncompressedSize ?? 0;
    const ext = path.split(".").pop()?.toLowerCase();
    let type: ResourceType = "other";
    if (/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(path)) type = "image";
    else if (/\.(xml|json|txt|csv|html|css|js)$/i.test(path)) type = "text";
    else if (/\.(ttf|otf|woff|woff2)$/i.test(path)) type = "font";
    else if (/\.(mp3|wav|ogg|flac)$/i.test(path)) type = "audio";
    else if (/\.(mp4|avi|mov|mkv)$/i.test(path)) type = "video";
    resources.push({ id: `z-${idx++}`, name: path.split("/").pop() ?? path, path, type, size, selected: false });
  });
  return [{ id: "z-root", name, path: name, type: "archive", size: data.byteLength, selected: false, children: resources }];
}

async function compressArchive(data: ArrayBuffer, _r: ResourceNode[], level: CompressionLevel): Promise<Blob> {
  const zip = await JSZip.loadAsync(data);
  const nz = new JSZip();
  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    const d = await entry.async("uint8array");
    nz.file(path, d, { compression: level === "low" ? "STORE" : "DEFLATE", compressionOptions: { level: level === "medium" ? 5 : 9 } });
  }
  return nz.generateAsync({ type: "blob" });
}

// ─── Text ───

async function parseText(data: ArrayBuffer, name: string): Promise<ResourceNode[]> {
  const text = new TextDecoder().decode(data);
  const lines = text.split("\n").length;
  const ext = name.split(".").pop()?.toLowerCase();
  const label = ext === "json" ? "JSON" : ext === "csv" ? "CSV" : ext === "xml" ? "XML" : "Text";
  return [{ id: "t-0", name, path: name, type: "text", size: data.byteLength, selected: false, children: [
    { id: "t-c", name: `${label} Content (${lines} lines)`, path: "content", type: "text", size: Math.round(data.byteLength * 0.95), selected: false },
    { id: "t-h", name: "File Overhead", path: "header", type: "metadata", size: Math.round(data.byteLength * 0.05), selected: false },
  ]}];
}

async function compressTextFile(data: ArrayBuffer, _r: ResourceNode[], level: CompressionLevel): Promise<Blob> {
  let text = new TextDecoder().decode(data);
  if (level !== "low") {
    text = text.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s+|\s+$/gm, "").replace(/\n{3,}/g, "\n\n");
  }
  return new Blob([text]);
}

// ─── Image preview (from cached ZIP) ───

async function extractPreview(data: ArrayBuffer, name: string, path: string): Promise<Blob | null> {
  const zip = await getZip(data, name);
  const entry = zip.file(path);
  if (!entry) return null;
  return entry.async("blob");
}

// ─── Format detection ───

const FMT: Record<string, string> = {
  pdf: "pdf", docx: "docx", pptx: "pptx", xlsx: "xlsx",
  jpg: "jpg", jpeg: "jpeg", png: "png", gif: "gif", bmp: "bmp",
  tiff: "tiff", tif: "tiff", webp: "webp", ico: "ico", svg: "svg",
  mp3: "mp3", wav: "wav", ogg: "ogg", flac: "flac",
  mp4: "mp4", avi: "avi", mov: "mov", mkv: "mkv", webm: "webm",
  zip: "zip",
  ttf: "ttf", otf: "otf", woff: "woff", woff2: "woff2",
  txt: "txt", csv: "csv", json: "json", xml: "xml",
};

const IMG_SET = new Set(["jpg", "jpeg", "png", "gif", "bmp", "tiff", "tif", "webp", "ico"]);
const SVG_SET = new Set(["svg"]);
const FONT_SET = new Set(["ttf", "otf", "woff", "woff2"]);
const AUDIO_SET = new Set(["mp3", "wav", "ogg", "flac"]);
const VIDEO_SET = new Set(["mp4", "avi", "mov", "mkv", "webm"]);
const TEXT_SET = new Set(["txt", "csv", "json", "xml"]);

function fmt(name: string): string { return FMT[name.split(".").pop()?.toLowerCase() ?? ""] ?? "unknown"; }

// ─── Message handler ───

self.onmessage = async (e: MessageEvent<{
  id: string; type: "parse" | "compress" | "preview";
  fileData: ArrayBuffer; fileName: string;
  resources?: ResourceNode[]; level?: CompressionLevel;
  options?: { stripFonts?: boolean; minifyXml?: boolean; subsetFonts?: boolean };
  internalPath?: string;
}>) => {
  const { id, type, fileData, fileName } = e.data;
  try {
    const f = fmt(fileName);
    let result: unknown;

    if (type === "parse") {
      if (["docx", "pptx", "xlsx"].includes(f)) result = await parseOffice(fileData, fileName, f as "docx" | "pptx" | "xlsx");
      else if (f === "pdf") result = await parsePdf(fileData);
      else if (IMG_SET.has(f)) result = await parseImage(fileData, fileName);
      else if (SVG_SET.has(f)) result = await parseSvg(fileData, fileName);
      else if (FONT_SET.has(f)) result = await parseFont(fileData, fileName);
      else if (AUDIO_SET.has(f)) result = await parseMedia(fileData, fileName, "audio");
      else if (VIDEO_SET.has(f)) result = await parseMedia(fileData, fileName, "video");
      else if (f === "zip") result = await parseArchive(fileData, fileName);
      else if (TEXT_SET.has(f)) result = await parseText(fileData, fileName);
      else throw new Error(`Unsupported: .${f}`);

    } else if (type === "compress") {
      const r = e.data.resources ?? [], l = e.data.level ?? "medium", o = e.data.options ?? {};
      if (["docx", "pptx", "xlsx"].includes(f)) result = await compressOffice(fileData, fileName, r, l, o);
      else if (f === "pdf") result = await compressPdf(fileData, r, l);
      else if (IMG_SET.has(f)) result = await compressImageFile(fileData, r, l);
      else if (SVG_SET.has(f)) result = await compressSvgFile(fileData);
      else if (f === "zip") result = await compressArchive(fileData, r, l);
      else if (TEXT_SET.has(f)) result = await compressTextFile(fileData, r, l);
      else { result = new Blob([fileData]); } // pass-through for media/fonts

    } else if (type === "preview") {
      const blob = await extractPreview(fileData, fileName, e.data.internalPath!);
      if (blob) {
        const buf = await blob.arrayBuffer();
        self.postMessage({ id, success: true, data: buf, mimeType: blob.type });
        return;
      }
      result = null;
    }

    self.postMessage({ id, success: true, data: result });
  } catch (err) {
    self.postMessage({ id, success: false, error: err instanceof Error ? err.message : String(err) });
  }
};
