import type { DocumentParser, ResourceNode, CompressionLevel, SupportedFormat } from "@/lib/types";

const MAX_DIM = 2000;

function getQuality(level: CompressionLevel): number {
  return level === "low" ? 0.85 : level === "medium" ? 0.6 : 0.35;
}

// Formats that Canvas API can decode
const CANVAS_FORMATS = new Set(["jpg", "jpeg", "png", "gif", "bmp", "webp", "ico"]);
// SVG is text-based, needs special handling
const SVG_FORMATS = new Set(["svg"]);
// TIFF may not be supported by all browsers' Canvas
const TIFF_FORMATS = new Set(["tiff"]);

export class ImageParser implements DocumentParser {
  private format: SupportedFormat;

  constructor(format: SupportedFormat) {
    this.format = format;
  }

  async parse(file: File): Promise<ResourceNode[]> {
    const size = file.size;
    const isSvg = SVG_FORMATS.has(this.format);

    let width = 0, height = 0;
    if (!isSvg) {
      try {
        const bmp = await createImageBitmap(file);
        width = bmp.width; height = bmp.height;
        bmp.close();
      } catch { /* TIFF or unsupported */ }
    }

    const children: ResourceNode[] = [];

    if (isSvg) {
      // SVG: analyze text content
      const text = await file.text();
      const hasMetadata = text.includes("<metadata") || text.includes("<title");
      children.push(
        { id: "svg-content", name: "SVG Content", path: "content", type: "text", size: Math.round(size * 0.85), selected: false },
        { id: "svg-meta", name: "SVG Metadata", path: "metadata", type: "metadata", size: hasMetadata ? Math.round(size * 0.15) : 0, selected: false },
      );
    } else {
      children.push(
        { id: "img-pixels", name: `Pixel Data (${width}×${height})`, path: "pixels", type: "image", size: Math.round(size * 0.9), selected: false },
        { id: "img-header", name: "File Header & Metadata", path: "header", type: "metadata", size: Math.round(size * 0.1), selected: false },
      );
    }

    return [{
      id: "image-0",
      name: file.name,
      path: file.name,
      type: "image",
      size,
      selected: false,
      children,
    }];
  }

  async compress(file: File, _resources?: ResourceNode[], level?: CompressionLevel): Promise<Blob> {
    const quality = getQuality(level ?? "medium");

    // SVG: text compression (strip comments, metadata, whitespace)
    if (SVG_FORMATS.has(this.format)) {
      const text = await file.text();
      const compressed = text
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/<metadata[\s\S]*?<\/metadata>/gi, "")
        .replace(/<sodipodi:[\s\S]*?\/>/gi, "")
        .replace(/xmlns:sodipodi="[^"]*"/gi, "")
        .replace(/xmlns:inkscape="[^"]*"/gi, "")
        .replace(/\s{2,}/g, " ")
        .replace(/>\s+</g, "><")
        .trim();
      return new Blob([compressed], { type: "image/svg+xml" });
    }

    // TIFF: may not work with Canvas, return as-is
    if (TIFF_FORMATS.has(this.format)) {
      try {
        const bmp = await createImageBitmap(file);
        return this.canvasEncode(bmp, quality, level === "high" ? "image/webp" : "image/png");
      } catch {
        return new Blob([await file.arrayBuffer()]);
      }
    }

    // BMP/GIF/WEBP/ICO: convert via Canvas
    try {
      const bmp = await createImageBitmap(file);
      const outputType = level === "high" ? "image/webp" : "image/png";
      return this.canvasEncode(bmp, quality, outputType);
    } catch {
      return new Blob([await file.arrayBuffer()]);
    }
  }

  private async canvasEncode(bmp: ImageBitmap, quality: number, outputType: string): Promise<Blob> {
    let w = bmp.width, h = bmp.height;
    if (w > MAX_DIM || h > MAX_DIM) {
      const r = Math.min(MAX_DIM / w, MAX_DIM / h);
      w = Math.round(w * r); h = Math.round(h * r);
    }
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close();
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(b => b ? resolve(b) : reject(new Error("toBlob failed")), outputType, quality);
    });
  }
}
