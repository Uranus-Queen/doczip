import { PDFDocument } from "pdf-lib";
import type {
  DocumentParser,
  ResourceNode,
  CompressionLevel,
} from "@/lib/types";

export class PdfParser implements DocumentParser {
  async parse(file: File): Promise<ResourceNode[]> {
    const buffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const resources: ResourceNode[] = [];
    let idx = 0;

    // Metadata
    const title = pdfDoc.getTitle();
    const author = pdfDoc.getAuthor();
    const subject = pdfDoc.getSubject();
    const creator = pdfDoc.getCreator();
    const producer = pdfDoc.getProducer();

    if (title || author || subject || creator || producer) {
      resources.push({
        id: `pdf-meta-${idx++}`,
        name: "Metadata",
        path: "metadata",
        type: "metadata",
        size: JSON.stringify({
          title,
          author,
          subject,
          creator,
          producer,
        }).length,
        selected: false,
      });
    }

    // Pages
    const pages = pdfDoc.getPages();
    const estimatedPageSize = Math.round(buffer.byteLength / pages.length);

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();
      resources.push({
        id: `pdf-page-${idx++}`,
        name: `Page ${i + 1}`,
        path: `page-${i + 1}`,
        type: "text",
        size: estimatedPageSize,
        selected: false,
      });
    }

    // Embedded objects (PDF objects count as a rough measure)
    // pdf-lib doesn't expose object-level breakdown, so we add a summary
    resources.push({
      id: `pdf-objects-${idx++}`,
      name: "PDF Objects & Structure",
      path: "objects",
      type: "binary",
      size: Math.round(buffer.byteLength * 0.05), // ~5% overhead for PDF structure
      selected: false,
    });

    return resources;
  }

  async compress(
    file: File,
    _resources: ResourceNode[],
    level: CompressionLevel
  ): Promise<Blob> {
    const buffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });

    // pdf-lib compression: object streams
    const useObjectStreams = level !== "low";

    const compressedBytes = await pdfDoc.save({
      useObjectStreams,
      addDefaultPage: false,
    });

    return new Blob([compressedBytes.slice()], { type: "application/pdf" });
  }
}
