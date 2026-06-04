import JSZip from "jszip";
import type {
  DocumentParser,
  ResourceNode,
  ResourceType,
  CompressionLevel,
  CompressionOptions,
} from "@/lib/types";

const MAX_IMAGE_DIMENSION = 2000;

function detectResourceType(path: string): ResourceType {
  const lower = path.toLowerCase();
  if (/\.(jpg|jpeg|png|gif|bmp|tiff|emf|wmf|svg|webp)$/i.test(lower))
    return "image";
  if (lower.includes("/media/") || lower.includes("/image")) return "image";
  if (/\.(ttf|otf|woff|woff2|eot)$/i.test(lower)) return "font";
  if (/\.(xml|rels)$/i.test(lower)) return "xml";
  if (
    lower.includes("[content_types]") ||
    lower.includes("docprops/") ||
    lower.includes("core.xml") ||
    lower.includes("app.xml")
  )
    return "metadata";
  if (/\.(txt|htm|html)$/i.test(lower)) return "text";
  return "other";
}

function isFontFile(path: string): boolean {
  return detectResourceType(path) === "font";
}

function isImageFile(path: string): boolean {
  return detectResourceType(path) === "image";
}

function getQuality(level: CompressionLevel): number {
  switch (level) {
    case "low":
      return 0.85;
    case "medium":
      return 0.6;
    case "high":
      return 0.35;
  }
}

/**
 * Compress image with Canvas API, including resize for oversized images.
 */
async function compressImageData(
  data: Uint8Array,
  fileName: string,
  quality: number
): Promise<Uint8Array> {
  const ext = fileName.toLowerCase().split(".").pop();
  const mimeType =
    ext === "png" ? "image/png" : ext === "gif" ? "image/gif" : "image/jpeg";

  if (data.length < 1024) return data;

  try {
    const blob = new Blob([data.slice().buffer as ArrayBuffer], {
      type: mimeType,
    });
    const bitmap = await createImageBitmap(blob);

    let targetWidth = bitmap.width;
    let targetHeight = bitmap.height;

    // Downscale oversized images
    if (
      targetWidth > MAX_IMAGE_DIMENSION ||
      targetHeight > MAX_IMAGE_DIMENSION
    ) {
      const ratio = Math.min(
        MAX_IMAGE_DIMENSION / targetWidth,
        MAX_IMAGE_DIMENSION / targetHeight
      );
      targetWidth = Math.round(targetWidth * ratio);
      targetHeight = Math.round(targetHeight * ratio);
    }

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return data;

    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
    bitmap.close();

    const outputType = ext === "png" ? "image/png" : "image/jpeg";
    const compressedBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Canvas toBlob failed"))),
        outputType,
        quality
      );
    });

    const buffer = await compressedBlob.arrayBuffer();
    return new Uint8Array(buffer);
  } catch {
    return data;
  }
}

/**
 * Conservative XML minification for Office XML internals.
 */
function minifyXml(xmlStr: string): string {
  return xmlStr
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/>\s+</g, "><")
    .replace(/^\s+|\s+$/gm, "")
    .replace(/\n{2,}/g, "\n");
}

export class OfficeParser implements DocumentParser {
  private format: "docx" | "pptx" | "xlsx";

  constructor(format: "docx" | "pptx" | "xlsx") {
    this.format = format;
  }

  async parse(file: File): Promise<ResourceNode[]> {
    const buffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(buffer);
    const resources: ResourceNode[] = [];
    let idx = 0;

    zip.forEach((relativePath, zipEntry) => {
      if (zipEntry.dir) return;

      const type = detectResourceType(relativePath);
      const size =
        (zipEntry as unknown as { _data: { uncompressedSize?: number } })._data
          ?.uncompressedSize ?? 0;

      resources.push({
        id: `${this.format}-${idx++}`,
        name: relativePath.split("/").pop() ?? relativePath,
        path: relativePath,
        type,
        size,
        selected: false,
      });
    });

    return resources;
  }

  async compress(
    file: File,
    resources: ResourceNode[],
    level: CompressionLevel,
    options: CompressionOptions = {}
  ): Promise<Blob> {
    const buffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(buffer);
    const quality = getQuality(level);

    const hasSelection = resources.some((r) => r.selected);
    const selectedImagePaths = new Set(
      resources.filter((r) => r.selected && r.type === "image").map((r) => r.path)
    );
    const compressAllImages = !hasSelection;

    // Collect font paths to strip
    const stripFontPaths = new Set<string>();
    if (options.stripFonts) {
      zip.forEach((path) => {
        if (isFontFile(path)) stripFontPaths.add(path);
      });
    }

    const newZip = new JSZip();

    for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
      if (zipEntry.dir) continue;
      if (stripFontPaths.has(relativePath)) continue;

      const data = await zipEntry.async("uint8array");
      let processedData = data;

      // Image compression with resize
      if (
        isImageFile(relativePath) &&
        (compressAllImages || selectedImagePaths.has(relativePath))
      ) {
        processedData = await compressImageData(data, relativePath, quality);
      }

      // XML minification
      if (options.minifyXml && detectResourceType(relativePath) === "xml") {
        try {
          const xmlText = new TextDecoder().decode(data);
          const minified = minifyXml(xmlText);
          processedData = new TextEncoder().encode(minified);
        } catch {
          // keep original
        }
      }

      newZip.file(relativePath, processedData, {
        compression: level === "low" ? "STORE" : "DEFLATE",
        compressionOptions: {
          level: level === "medium" ? 5 : level === "high" ? 9 : 0,
        },
      });
    }

    return newZip.generateAsync({
      type: "blob",
      compression: level === "low" ? "STORE" : "DEFLATE",
      compressionOptions: {
        level: level === "medium" ? 5 : level === "high" ? 9 : 9,
      },
    });
  }
}
