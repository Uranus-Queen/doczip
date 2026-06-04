# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Offline document compression web app (离线文档压缩网站). Users compress office documents (PDF, DOCX, PPTX, XLSX, JPG/PNG) **entirely in the browser with zero server requests**. Key differentiator: WizTree-style treemap visualization showing internal document resource breakdown (images, fonts, metadata, text streams) with selective compression.

## Commands

```bash
cd offline-doc-compressor
pnpm dev          # Start dev server (http://localhost:3000)
pnpm build        # Production build + static export to out/
pnpm lint         # ESLint check
```

## Tech Stack

- **Framework:** Next.js 16 + TypeScript + App Router
- **Styling:** Tailwind CSS v4 + shadcn/ui (New York style, Slate base)
- **Visualization:** D3.js treemap (SVG, bundled locally, fully offline)
- **Document processing:** JSZip (DOCX/PPTX/XLSX), pdf-lib (PDF), Canvas/OffscreenCanvas (JPG/PNG/WebP)
- **Worker:** Web Worker for non-blocking parse/compress/preview (native postMessage)
- **Caching:** Service Worker for offline-first static asset caching
- **Icons:** lucide-react
- **Fonts:** System font stack (no external font fetches)
- **Deployment:** Cloudflare Pages (static export via `output: "export"` in next.config.ts)

## Architecture

Pure client-side SPA. Heavy processing runs in a Web Worker with automatic main-thread fallback. Service Worker caches static assets for offline use.

```text
src/
├── workers/
│   └── doc.worker.ts       # Web Worker: parse + compress + image preview extraction
├── app/
│   ├── layout.tsx           # Root layout (system fonts, ServiceWorkerRegister)
│   ├── page.tsx             # Main page: state machine (upload → analyze → compress → download)
│   └── globals.css          # Tailwind v4 + shadcn theme + custom animations
├── components/
│   ├── file-upload.tsx      # Drag-and-drop + click file picker
│   ├── treemap.tsx          # D3 treemap (SVG, DOM-direct tooltip, image preview via Worker)
│   ├── resource-list.tsx    # Table view (sortable by name/type/size/percent)
│   ├── view-toggle.tsx      # Treemap/List tab switch
│   ├── action-bar.tsx       # Compression slider + Office options (XML compress / font strip)
│   ├── result-panel.tsx     # Compression result + download button
│   ├── sw-register.tsx      # Service Worker registration
│   └── ui/                  # shadcn/ui components
└── lib/
    ├── types.ts             # Core types: ResourceNode, CompressionLevel, CompressionOptions
    ├── format.ts            # formatBytes(), compressionRatio()
    ├── utils.ts             # cn() utility (shadcn)
    ├── worker-client.ts     # Worker communication (postMessage + main-thread fallback + buffer cache)
    └── parsers/
        ├── index.ts         # Parser factory: detectFormat() → getParser()
        ├── office-parser.ts # DOCX/PPTX/XLSX via JSZip (image resize + XML minify + font strip)
        ├── pdf-parser.ts    # PDF via pdf-lib (metadata + object streams)
        └── image-parser.ts  # JPG/PNG via Canvas API (resize + quality)
```

## Data Flow

```text
File dropped → worker-client.parseInWorker(file)
  → [Worker] doc.worker.ts: parse → ResourceNode[]
  → page.tsx state → Treemap / ResourceList render (lazy loaded via next/dynamic)
  → user selects resources, picks options
  → worker-client.compressInWorker(file, resources, level, options)
  → [Worker] doc.worker.ts: compress → Blob
  → ResultPanel → download link

Image hover → worker-client.extractPreviewInWorker(file, path)
  → [Worker] uses cached ZIP → extracts image → returns blob URL
  → treemap.tsx shows preview in DOM-direct tooltip
```

## Performance Optimizations

- **Worker data flow:** ArrayBuffer cached on main thread (parse/compress share same buffer); ZIP cached in Worker by filename+size (preview reuses parsed ZIP)
- **Dynamic imports:** Treemap and ResourceList loaded via `next/dynamic` (D3 not in main bundle)
- **DOM-direct tooltip:** Treemap tooltip uses refs + direct DOM manipulation, not React state (no SVG re-render on hover)
- **ResizeObserver debounce:** 100ms debounce prevents excessive D3 re-renders
- **Service Worker:** Cache-first for `/_next/static/` (hashed assets), stale-while-revalidate for others
- **System fonts:** No Google Fonts fetch (offline-safe, no FOUT)
- **WebP output:** Standalone image compression uses WebP (25-35% smaller than JPEG)

## Compression Strategies

- **Images (Office):** Canvas re-encode + resize if >2000px. Keep JPEG/PNG format for compatibility. Quality: 0.85 / 0.6 / 0.35
- **Images (standalone):** Canvas re-encode + resize + WebP output
- **XML files (Office):** Remove comments, collapse whitespace between tags
- **Embedded fonts (Office):** Optional strip via ActionBar checkbox
- **PDF:** Object streams compression (pdf-lib limitation: no image extraction)

## Key Design Decisions

- **Web Worker** keeps UI responsive during heavy operations (20MB+ PPTX parsing)
- **JSZip** handles all Office formats (DOCX/PPTX/XLSX are ZIP archives)
- **pdf-lib** cannot extract embedded images from PDFs — basic object-streams compression only
- **D3 treemap** renders to SVG for native DOM event handling
- **Tooltip overflow:** Card has no `overflow-hidden` so tooltip can extend beyond card boundaries
- `suppressHydrationWarning` on `<html>` and `<body>` for Dark Reader browser extension
- Resource selection is bidirectional: treemap clicks and list checkboxes toggle the same state
- `output: "export"` in next.config.ts for static deployment on Cloudflare Pages

## Reference Docs

- `PRD.md` — full product requirements in Chinese
- `tech-stack.md` — brief tech stack note in Chinese
