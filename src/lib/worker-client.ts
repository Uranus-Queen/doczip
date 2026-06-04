"use client";

import type { ResourceNode, CompressionLevel, CompressionOptions } from "@/lib/types";
import { detectFormat, getParser } from "@/lib/parsers";

// === Cached file data (avoid re-reading between parse and compress) ===

let cachedFileName: string | null = null;
let cachedBuffer: ArrayBuffer | null = null;

async function getFileBuffer(file: File): Promise<ArrayBuffer> {
  if (cachedFileName === file.name && cachedBuffer) return cachedBuffer;
  const buf = await file.arrayBuffer();
  cachedFileName = file.name;
  cachedBuffer = buf;
  return buf;
}

export function clearFileCache() {
  cachedFileName = null;
  cachedBuffer = null;
}

// === Request/Response types ===

interface WorkerRequest {
  id: string;
  type: "parse" | "compress" | "preview";
  fileData: ArrayBuffer;
  fileName: string;
  resources?: ResourceNode[];
  level?: CompressionLevel;
  options?: CompressionOptions;
  internalPath?: string;
}

interface WorkerResponse {
  id: string;
  success: boolean;
  data?: unknown;
  error?: string;
  mimeType?: string;
}

// === Worker singleton ===

let worker: Worker | null = null;
let workerFailed = false;
const pending = new Map<string, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();

function getWorker(): Worker | null {
  if (workerFailed) return null;
  if (!worker) {
    try {
      worker = new Worker(new URL("../workers/doc.worker.ts", import.meta.url), { type: "module" });
      worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
        const { id, success, data, error, mimeType } = e.data;
        const p = pending.get(id);
        if (!p) return;
        pending.delete(id);
        if (success) {
          // For preview: convert ArrayBuffer back to Blob URL
          if (data instanceof ArrayBuffer && mimeType) {
            const blob = new Blob([data], { type: mimeType });
            p.resolve(URL.createObjectURL(blob));
          } else {
            p.resolve(data);
          }
        } else {
          p.reject(new Error(error ?? "Worker error"));
        }
      };
      worker.onerror = (e) => {
        console.error("Worker failed:", e);
        workerFailed = true;
        for (const [id, p] of pending) { p.reject(new Error("Worker failed")); pending.delete(id); }
      };
    } catch (e) {
      console.error("Worker creation failed:", e);
      workerFailed = true;
    }
  }
  return worker;
}

let requestId = 0;

function sendToWorker<T>(req: Omit<WorkerRequest, "id">): Promise<T> {
  const w = getWorker();
  if (!w) return runOnMainThread<T>(req);

  const id = `req-${++requestId}`;
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      pending.delete(id);
      console.warn("Worker timeout, falling back");
      runOnMainThread<T>(req).then(resolve).catch(reject);
    }, 30000);

    pending.set(id, {
      resolve: (v: unknown) => { clearTimeout(timeout); resolve(v as T); },
      reject: (e: Error) => { clearTimeout(timeout); reject(e); },
    });

    w.postMessage({ id, ...req });
  });
}

async function runOnMainThread<T>(req: Omit<WorkerRequest, "id">): Promise<T> {
  const blob = new Blob([req.fileData]);
  const file = new File([blob], req.fileName);
  const format = detectFormat(file);
  const parser = getParser(format);
  if (req.type === "parse") return (await parser.parse(file)) as T;
  return (await parser.compress(file, req.resources ?? [], req.level ?? "medium", req.options)) as T;
}

// === Public API ===

export async function parseInWorker(file: File): Promise<ResourceNode[]> {
  const buffer = await getFileBuffer(file);
  return sendToWorker<ResourceNode[]>({ type: "parse", fileData: buffer, fileName: file.name });
}

export async function compressInWorker(
  file: File, resources: ResourceNode[], level: CompressionLevel, options: CompressionOptions = {}
): Promise<Blob> {
  const buffer = await getFileBuffer(file);
  return sendToWorker<Blob>({ type: "compress", fileData: buffer, fileName: file.name, resources, level, options });
}

/** Extract image preview from a ZIP-based document via Worker. Returns a blob URL. */
export async function extractPreviewInWorker(file: File, internalPath: string): Promise<string | null> {
  const buffer = await getFileBuffer(file);
  try {
    return await sendToWorker<string>({ type: "preview", fileData: buffer, fileName: file.name, internalPath });
  } catch { return null; }
}
