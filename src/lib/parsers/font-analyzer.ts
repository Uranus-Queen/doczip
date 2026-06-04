/**
 * Font analysis for Office documents (DOCX/PPTX/XLSX).
 * - Detects which fonts are actually referenced in document XML
 * - Identifies unused embedded fonts
 * - Reports font details for subsetting
 */

import type JSZip from "jszip";

export interface FontInfo {
  path: string;
  name: string;
  size: number;
  usedInDoc: boolean;
  referencedBy: string[]; // which XML files reference this font
}

/**
 * Extract all font names referenced in Office XML files.
 */
function extractReferencedFonts(zip: JSZip): Set<string> {
  const fonts = new Set<string>();
  const fontRegex = /(?:w:ascii|w:hAnsi|w:eastAsia|w:cs|w:asciiTheme|w:hAnsiTheme|a:latin|a:ea|a:cs|typeface)=["']([^"']+)["']/gi;
  const themeFontRegex = /<a:font\s+[^>]*script=["'][^"']*["'][^>]*typeface=["']([^"']+)["']/gi;

  zip.forEach((path, entry) => {
    if (entry.dir) return;
    if (!/\.(xml|rels)$/i.test(path)) return;
    // Skip binary-like XML
    if (/\.(jpg|jpeg|png|gif|bmp|tiff|emf|wmf|svg|webp)$/i.test(path)) return;

    entry.async("string").then(text => {
      let match;
      while ((match = fontRegex.exec(text)) !== null) {
        fonts.add(match[1].toLowerCase());
      }
      while ((match = themeFontRegex.exec(text)) !== null) {
        fonts.add(match[1].toLowerCase());
      }
    }).catch(() => {});
  });

  return fonts;
}

/**
 * Analyze embedded fonts in an Office document ZIP.
 * Returns font info with usage status.
 */
export async function analyzeFonts(zip: JSZip): Promise<FontInfo[]> {
  // Collect all font files
  const fontFiles: Array<{ path: string; name: string; size: number }> = [];
  zip.forEach((path, entry) => {
    if (entry.dir) return;
    if (/\.(ttf|otf|woff|woff2|eot|dfont)$/i.test(path)) {
      const name = path.split("/").pop() ?? path;
      const size = (entry as unknown as { _data: { uncompressedSize?: number } })._data?.uncompressedSize ?? 0;
      fontFiles.push({ path, name, size });
    }
  });

  if (fontFiles.length === 0) return [];

  // Extract referenced font names from all XML files
  const referencedFonts = extractReferencedFonts(zip);

  // Match font files to referenced names
  return fontFiles.map(f => {
    const fontNameLower = f.name.replace(/\.(ttf|otf|woff|woff2|eot|dfont)$/i, "").toLowerCase();
    // Check if any referenced font name partially matches this file name
    const used = Array.from(referencedFonts).some(ref =>
      fontNameLower.includes(ref) || ref.includes(fontNameLower) ||
      fontNameLower.replace(/[-_\s]/g, "").includes(ref.replace(/[-_\s]/g, ""))
    );
    return {
      path: f.path,
      name: f.name,
      size: f.size,
      usedInDoc: used,
      referencedBy: [],
    };
  });
}
