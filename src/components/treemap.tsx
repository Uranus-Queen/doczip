"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { ResourceNode, ResourceType } from "@/lib/types";
import { formatBytes } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

interface TreemapProps {
  resources: ResourceNode[];
  onToggleSelect: (id: string) => void;
  sourceFile?: File | null;
  height?: number;
}

const TYPE_COLORS: Record<ResourceType, string> = {
  image: "#818cf8",
  font: "#34d399",
  metadata: "#fbbf24",
  text: "#a78bfa",
  xml: "#fb923c",
  video: "#f472b6",
  audio: "#2dd4bf",
  archive: "#94a3b8",
  binary: "#60a5fa",
  other: "#cbd5e1",
};

const TYPE_LABEL_KEYS: Record<ResourceType, string> = {
  image: "type.image", font: "type.font", metadata: "type.metadata",
  text: "type.text", xml: "type.xml", video: "type.video", audio: "type.audio",
  archive: "type.archive", binary: "type.binary", other: "type.other",
};

const MAX_PREVIEW = 300;

interface TooltipData {
  x: number; y: number;
  name: string; type: ResourceType;
  size: number; percent: string; path: string;
}

function toHierarchyData(resources: ResourceNode[]) {
  const children: Array<{ name: string; value: number; id: string; type: ResourceType; selected: boolean; path: string }> = [];
  for (const r of resources) {
    if (r.children?.length) {
      for (const c of r.children) children.push({ name: c.name, value: Math.max(c.size, 1), id: c.id, type: c.type, selected: c.selected, path: c.path });
    } else {
      children.push({ name: r.name, value: Math.max(r.size, 1), id: r.id, type: r.type, selected: r.selected, path: r.path });
    }
  }
  return { name: "root", children };
}

// Main-thread image extraction (dynamic import JSZip only when needed)
const imgCache = new Map<string, string>();

async function getImageUrl(file: File, path: string): Promise<string | null> {
  const key = `${file.name}:${path}`;
  const cached = imgCache.get(key);
  if (cached) return cached;
  try {
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const entry = zip.file(path);
    if (!entry) return null;
    const blob = await entry.async("blob");
    const url = URL.createObjectURL(blob);
    imgCache.set(key, url);
    return url;
  } catch { return null; }
}

export function Treemap({ resources, onToggleSelect, sourceFile, height = 400 }: TreemapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);
  const { t } = useI18n();

  // Tooltip DOM refs
  const tipRef = useRef<HTMLDivElement>(null);
  const dataRef = useRef<TooltipData | null>(null);
  const imgUrlRef = useRef<string | null>(null);
  const imgSizeRef = useRef<{ w: number; h: number } | null>(null);
  const hoverRef = useRef(false);
  const pathRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let tm: ReturnType<typeof setTimeout> | null = null;
    const obs = new ResizeObserver((entries) => {
      if (tm) clearTimeout(tm);
      tm = setTimeout(() => { const e = entries[0]; if (e) setWidth(Math.floor(e.contentRect.width)); }, 100);
    });
    obs.observe(el);
    return () => { if (tm) clearTimeout(tm); obs.disconnect(); };
  }, []);

  // Build type labels from current locale
  const typeLabels = useRef<Record<ResourceType, string>>({} as Record<ResourceType, string>);
  useEffect(() => {
    for (const key of Object.keys(TYPE_LABEL_KEYS) as ResourceType[]) {
      typeLabels.current[key] = t(TYPE_LABEL_KEYS[key] as Parameters<typeof t>[0]);
    }
  }, [t]);

  // ─── Sync tooltip DOM ───
  const sync = () => {
    const el = tipRef.current;
    const d = dataRef.current;
    if (!el) return;
    if (!d || !hoverRef.current) { el.style.display = "none"; return; }

    el.style.display = "block";
    const isImg = d.type === "image" && !!sourceFile;
    const ew = isImg ? (imgSizeRef.current?.w ?? 200) + 24 : 220;
    const eh = isImg ? (imgSizeRef.current?.h ?? 120) + 24 : 70;

    let l = d.x + 16;
    if (l + ew > width) l = d.x - ew - 8;
    if (l < 8) l = 8;
    let tp = d.y + 16;
    if (tp + eh > height) tp = d.y - eh - 8;
    if (tp < 8) tp = 8;

    el.style.left = `${l}px`;
    el.style.top = `${tp}px`;

    const imgBox = el.querySelector("#tb-ibox") as HTMLElement;
    const img = el.querySelector("#tb-img") as HTMLImageElement;
    const spin = el.querySelector("#tb-spin") as HTMLElement;
    const txtBox = el.querySelector("#tb-txt") as HTMLElement;
    const name = el.querySelector("#tb-name") as HTMLElement;
    const meta = el.querySelector("#tb-meta") as HTMLElement;
    const dot = el.querySelector("#tb-dot") as HTMLElement;

    if (name) name.textContent = d.name;
    if (meta) meta.textContent = `${typeLabels.current[d.type]} · ${formatBytes(d.size)} · ${d.percent}%`;
    if (dot) dot.style.backgroundColor = TYPE_COLORS[d.type];

    if (isImg) {
      if (imgBox) imgBox.style.display = "block";
      if (txtBox) txtBox.style.display = "none";
      if (imgUrlRef.current) {
        if (img) { img.src = imgUrlRef.current; img.style.display = "block"; }
        if (spin) spin.style.display = "none";
      } else {
        if (img) img.style.display = "none";
        if (spin) spin.style.display = "flex";
      }
    } else {
      if (imgBox) imgBox.style.display = "none";
      if (txtBox) txtBox.style.display = "block";
    }
  };

  // ─── D3 render ───
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !resources.length) return;

    const data = toHierarchyData(resources);
    const total = data.children.reduce((s, c) => s + c.value, 0);

    const root = d3.treemap<typeof data>().size([width, height]).padding(4).round(true)(
      d3.hierarchy(data).sum((d) => (d as unknown as { value: number }).value || 0).sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
    );

    const el = d3.select(svg);
    el.selectAll("*").remove();
    const leaves = root.leaves();

    // Gradients
    const defs = el.append("defs");
    leaves.forEach((d, i) => {
      const color = TYPE_COLORS[(d.data as unknown as { type: ResourceType }).type] || TYPE_COLORS.other;
      const g = defs.append("linearGradient").attr("id", `g${i}`).attr("x1", "0%").attr("y1", "0%").attr("x2", "100%").attr("y2", "100%");
      g.append("stop").attr("offset", "0%").attr("stop-color", color).attr("stop-opacity", 0.95);
      g.append("stop").attr("offset", "100%").attr("stop-color", color).attr("stop-opacity", 0.7);
    });

    const groups = el.selectAll("g.c").data(leaves).join("g").attr("class", "c").attr("transform", (d) => `translate(${d.x0},${d.y0})`);

    groups.append("rect")
      .attr("width", (d) => Math.max(0, d.x1 - d.x0))
      .attr("height", (d) => Math.max(0, d.y1 - d.y0))
      .attr("rx", 10)
      .attr("fill", (_, i) => `url(#g${i})`)
      .attr("opacity", (d) => (d.data as unknown as { selected: boolean }).selected ? 1 : 0.45)
      .attr("stroke", (d) => (d.data as unknown as { selected: boolean }).selected ? "rgba(255,255,255,0.8)" : "transparent")
      .attr("stroke-width", (d) => (d.data as unknown as { selected: boolean }).selected ? 2.5 : 0)
      .style("cursor", "pointer")
      .style("transition", "opacity 0.25s ease")
      .on("click", (_, d) => onToggleSelect((d.data as unknown as { id: string }).id))
      .on("mouseenter", (ev, d) => {
        hoverRef.current = true;
        const dd = d.data as unknown as { name: string; type: ResourceType; value: number; path: string; id: string };
        const r = svgRef.current?.getBoundingClientRect();
        if (r) dataRef.current = { x: ev.clientX - r.left, y: ev.clientY - r.top, name: dd.name, type: dd.type, size: dd.value, path: dd.path, percent: total > 0 ? ((dd.value / total) * 100).toFixed(1) : "0" };
        d3.select(ev.currentTarget as SVGRectElement).attr("opacity", 1);
        pathRef.current = dd.path;
        const key = `${sourceFile?.name}:${dd.path}`;
        imgUrlRef.current = imgCache.get(key) ?? null;
        imgSizeRef.current = null;
        sync();
        if (dd.type === "image" && sourceFile && !imgUrlRef.current) {
          timerRef.current = setTimeout(async () => {
            const url = await getImageUrl(sourceFile, dd.path);
            if (url && pathRef.current === dd.path) {
              imgUrlRef.current = url;
              sync();
            }
          }, 150);
        }
      })
      .on("mousemove", (ev) => {
        if (!dataRef.current) return;
        const r = svgRef.current?.getBoundingClientRect();
        if (r) { dataRef.current.x = ev.clientX - r.left; dataRef.current.y = ev.clientY - r.top; sync(); }
      })
      .on("mouseleave", (ev, d) => {
        hoverRef.current = false; dataRef.current = null; imgUrlRef.current = null; imgSizeRef.current = null; pathRef.current = null;
        if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
        sync();
        d3.select(ev.currentTarget as SVGRectElement).attr("opacity", (d.data as unknown as { selected: boolean }).selected ? 1 : 0.45);
      });

    // Labels
    groups.append("text").attr("x", 10).attr("y", 22).attr("fill", "white").attr("font-size", "12px").attr("font-weight", "600")
      .attr("pointer-events", "none").attr("opacity", 0.95)
      .text((d) => { const w = d.x1 - d.x0; const n = (d.data as unknown as { name: string }).name; return w < 70 ? "" : n.length > w / 8 ? n.slice(0, Math.floor(w / 8)) + "…" : n; });

    groups.append("text").attr("x", 10).attr("y", 38).attr("fill", "white").attr("font-size", "11px")
      .attr("pointer-events", "none").attr("opacity", 0.6)
      .text((d) => { const w = d.x1 - d.x0; const h = d.y1 - d.y0; return (w < 70 || h < 45) ? "" : formatBytes((d.data as unknown as { value: number }).value); });
  }, [resources, width, onToggleSelect, sourceFile]);

  // Cleanup
  useEffect(() => () => { imgCache.forEach((u) => URL.revokeObjectURL(u)); imgCache.clear(); }, []);

  const onImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    let w = img.naturalWidth, h = img.naturalHeight;
    if (w > MAX_PREVIEW || h > MAX_PREVIEW) { const r = Math.min(MAX_PREVIEW / w, MAX_PREVIEW / h); w = Math.round(w * r); h = Math.round(h * r); }
    imgSizeRef.current = { w, h };
    img.style.width = `${w}px`;
    img.style.height = `${h}px`;
    sync();
  };

  return (
    <div ref={containerRef} className="relative w-full" style={{ height: height }}>
      <svg ref={svgRef} width={width} height={height} className="rounded-xl overflow-hidden" />

      {/* Tooltip — glassmorphism */}
      <div ref={tipRef} className="absolute pointer-events-none z-50" style={{ display: "none" }}>
        <div className="rounded-xl overflow-hidden glass-tooltip">
          {/* Image */}
          <div id="tb-ibox" style={{ display: "none" }}>
            <img id="tb-img" alt="" className="block object-contain" style={{ display: "none", maxWidth: MAX_PREVIEW, maxHeight: MAX_PREVIEW }} onLoad={onImgLoad} />
            <div id="tb-spin" className="flex items-center justify-center gap-2 px-6 py-5" style={{ display: "none" }}>
              <span className="inline-block w-4 h-4 border-2 border-muted-foreground/20 border-t-muted-foreground/60 rounded-full animate-spin" />
              <span className="text-xs text-muted-foreground">{t("treemap.loading")}</span>
            </div>
          </div>
          {/* Text */}
          <div id="tb-txt" className="px-4 py-3 space-y-1.5" style={{ display: "none" }}>
            <p id="tb-name" className="font-semibold text-sm text-foreground truncate max-w-55"></p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span id="tb-dot" className="w-2 h-2 rounded-full shrink-0" />
              <span id="tb-meta"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TreemapLegend() {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-2">
      {Object.entries(TYPE_LABEL_KEYS).map(([type, key]) => (
        <div key={type} className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: TYPE_COLORS[type as ResourceType] }} />
          <span>{t(key as Parameters<typeof t>[0])}</span>
        </div>
      ))}
    </div>
  );
}
