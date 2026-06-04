# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Offline document compression web app (离线文档压缩网站). Users compress office documents (PDF, DOCX, PPTX, XLSX, JPG/PNG) **entirely in the browser with zero server requests**. Key differentiator: WizTree-style treemap visualization showing internal document resource breakdown (images, fonts, metadata, text streams) with selective compression.

## Tech Stack

- **Framework:** Next.js with TypeScript (latest versions)
- **Styling:** Tailwind CSS
- **Deployment:** Cloudflare (Pages or Workers)
- **Document processing:** WebAssembly-based, browser-side only — pdf-lib (PDF), docx-wasm (DOCX), JSZip (PPTX/XLSX), image compression libs (JPG/PNG)
- **Treemap visualization:** D3.js or ECharts (must work fully offline — no CDN, bundle locally)

## Architecture Principles

- **Pure client-side SPA** — zero backend requests, all processing in browser memory via WebAssembly
- **No file persistence** — nothing written to disk or cached; all data cleared on page close
- **Next.js static export** — the app must be deployable as static files (no SSR needed since all logic is client-side)
- **Offline-first** — the app must function completely without network access after initial load

## Data Flow

1. User drops/selects a document file (drag-and-drop or file picker)
2. Browser-side WASM parses the document structure into internal resources
3. Resource breakdown displayed as treemap (D3.js/ECharts) + sortable list view
4. User picks compression level (low/medium/high) or targets specific resources
5. Browser-side compression runs entirely in memory
6. Compressed file auto-downloads; no data persists

## Key Requirements

- Supported formats: PDF, DOCX, PPTX, XLSX, JPG, PNG
- Compression target: 50%+ size reduction on typical office documents
- Treemap and list views must stay synchronized after any compression/deletion action
- Treemap updates with animation when resources change
- Cross-browser: Chrome, Edge, Firefox, Safari (recent versions)
- Verify with: 20MB PPTX offline, treemap shows images >80%, compress to 50%+ reduction, output opens correctly

## Reference Docs

- `PRD.md` — full product requirements in Chinese
- `tech-stack.md` — brief tech stack note in Chinese
