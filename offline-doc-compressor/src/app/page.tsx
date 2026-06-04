"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import type { ResourceNode, CompressionLevel, SupportedFormat } from "@/lib/types";
import { detectFormat } from "@/lib/parsers";
import { parseInWorker, compressInWorker, clearFileCache } from "@/lib/worker-client";
import { formatBytes } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { FileUpload } from "@/components/file-upload";
import { ViewToggle } from "@/components/view-toggle";
import { ActionBar } from "@/components/action-bar";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Shield, ArrowLeft } from "lucide-react";

const Treemap = dynamic(() => import("@/components/treemap").then(m => m.Treemap), { ssr: false });
const TreemapLegend = dynamic(() => import("@/components/treemap").then(m => m.TreemapLegend), { ssr: false });
const ResourceList = dynamic(() => import("@/components/resource-list").then(m => m.ResourceList), { ssr: false });

export default function Home() {
  const { t } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<SupportedFormat | null>(null);
  const [resources, setResources] = useState<ResourceNode[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>("medium");
  const [viewMode, setViewMode] = useState<"treemap" | "list">("treemap");
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [stripFonts, setStripFonts] = useState(false);
  const [minifyXml, setMinifyXml] = useState(true);

  const mainRef = useRef<HTMLDivElement>(null);
  const [treemapH, setTreemapH] = useState(400);
  const isOffice = format === "docx" || format === "pptx" || format === "xlsx";

  useEffect(() => {
    const calc = () => {
      const vh = window.innerHeight;
      setTreemapH(Math.max(240, Math.min(vh - 340, 520)));
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, [compressedBlob]);

  const handleFileSelected = useCallback(async (f: File) => {
    setError(null); setCompressedBlob(null); setCompressedSize(0);
    try {
      setFile(f); setFormat(detectFormat(f)); setIsAnalyzing(true);
      setResources(await parseInWorker(f));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error.parseFailed"));
      setFile(null); setFormat(null); setResources([]);
    } finally { setIsAnalyzing(false); }
  }, [t]);

  const handleToggleSelect = useCallback((id: string) => {
    setResources(prev => prev.map(r => {
      if (r.id === id) return { ...r, selected: !r.selected };
      if (r.children) {
        const nc = r.children.map(c => c.id === id ? { ...c, selected: !c.selected } : c);
        if (nc !== r.children) return { ...r, children: nc };
      }
      return r;
    }));
  }, []);

  const doCompress = async (f: File, res: ResourceNode[], lvl: CompressionLevel) => {
    setIsCompressing(true); setError(null);
    try {
      const blob = await compressInWorker(f, res, lvl, {
        stripFonts: isOffice ? stripFonts : false,
        minifyXml: isOffice ? minifyXml : false,
      });
      setCompressedBlob(blob); setCompressedSize(blob.size);
    } catch (err) { setError(err instanceof Error ? err.message : t("error.compressFailed")); }
    finally { setIsCompressing(false); }
  };

  const handleCompressSelected = useCallback(async () => {
    if (file) await doCompress(file, resources, compressionLevel);
  }, [file, resources, compressionLevel]);

  const handleCompressAll = useCallback(async () => {
    if (!file) return;
    const all = resources.map(r => ({ ...r, selected: true, children: r.children?.map(c => ({ ...c, selected: true })) }));
    setResources(all);
    await doCompress(file, all, compressionLevel);
  }, [file, resources, compressionLevel]);

  const handleReset = () => {
    setFile(null); setFormat(null); setResources([]);
    setCompressedBlob(null); setCompressedSize(0); setError(null);
    clearFileCache();
  };

  // ─── Landing ───
  if (!file) {
    return (
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-12 shrink-0 flex items-center justify-between px-6 border-b border-border/30 glass-header">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="font-semibold text-[13px] tracking-tight">DocCompress</span>
          </div>
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-6 relative">
          {/* Background decoration — subtle radial gradient */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 50% at 50% 45%, rgba(99,102,241,0.04) 0%, transparent 100%)" }} />

          <div className="relative text-center space-y-8 max-w-lg animate-fade-in">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-primary/70 bg-primary/[0.05] rounded-full px-3 py-1 border border-primary/[0.08]">
              <Shield className="h-3 w-3" /> {t("landing.badge")}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h1 className="text-[3rem] font-bold tracking-[-0.03em] leading-[1.05] bg-linear-to-b from-foreground to-foreground/60 bg-clip-text text-transparent">
                {t("landing.title")}
              </h1>
              <p className="text-[15px] text-muted-foreground/80 leading-relaxed">
                {t("landing.subtitle")}
              </p>
            </div>

            {/* Divider line */}
            <div className="w-8 h-px bg-border mx-auto" />

            {/* Upload area — the hero CTA */}
            <FileUpload onFileSelected={handleFileSelected} disabled={isAnalyzing} />
            {error && <p className="text-[13px] text-destructive animate-fade-in">{error}</p>}

            {/* Format chips */}
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {["PDF", "DOCX", "PPTX", "XLSX", "JPG", "PNG", "GIF", "SVG", "MP4", "MP3", "ZIP", "TTF"].map(f => (
                <span key={f} className="text-[10px] text-muted-foreground/50 bg-muted/40 rounded-md px-2 py-0.5 border border-border/30">
                  {f}
                </span>
              ))}
              <span className="text-[10px] text-muted-foreground/40">{t("formats.more", { count: 20 })}</span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ─── Analyzing ───
  if (isAnalyzing) {
    return (
      <div className="h-screen bg-background flex flex-col">
        <header className="h-12 flex items-center justify-between px-6 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="font-semibold text-[13px] tracking-tight">DocCompress</span>
          </div>
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 animate-fade-in">
            <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-[15px] font-medium text-foreground">{t("analyzing.title")}</p>
              <p className="text-[13px] text-muted-foreground mt-0.5">{file.name}</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ─── Workspace ───
  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-11 shrink-0 flex items-center justify-between px-5 border-b border-border/40 glass-header">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
            <FileText className="h-3 w-3 text-primary" />
          </div>
          <span className="font-semibold text-[12px] tracking-tight text-foreground/80">DocCompress</span>
        </div>
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
          <button onClick={handleReset} className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground transition-colors duration-200 rounded-md px-2 py-1 hover:bg-muted/60">
            <ArrowLeft className="h-3 w-3" /> {t("workspace.back")}
          </button>
        </div>
      </header>

      {/* Content */}
      <main ref={mainRef} className="flex-1 mx-auto max-w-5xl w-full px-5 pt-4 pb-3 flex flex-col gap-3 animate-slide-up overflow-hidden">
        {/* File info */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted rounded-md px-2 py-0.5">{format?.toUpperCase()}</span>
          <span className="text-[13px] font-medium truncate">{file.name}</span>
          <span className="text-[12px] text-muted-foreground">{formatBytes(file.size)} · {t("workspace.items", { count: resources.length })}</span>
        </div>

        {/* Visualization */}
        <div className="flex-1 flex flex-col min-h-0 rounded-2xl overflow-hidden glass-panel">
          <div className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0">
            <h2 className="text-[14px] font-semibold tracking-tight">{t("resourceDistribution")}</h2>
            <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
          </div>
          <div className="flex-1 min-h-0 px-5 pb-4 overflow-hidden">
            {viewMode === "treemap" ? (
              <div className="h-full flex flex-col">
                <div className="flex-1 min-h-0">
                  <Treemap resources={resources} onToggleSelect={handleToggleSelect} sourceFile={file} height={treemapH} />
                </div>
                <TreemapLegend />
              </div>
            ) : (
              <div className="h-full overflow-y-auto -mx-1 px-1">
                <ResourceList resources={resources} onToggleSelect={handleToggleSelect} />
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="shrink-0">
          <ActionBar
            compressionLevel={compressionLevel} onLevelChange={setCompressionLevel}
            onCompressSelected={handleCompressSelected} onCompressAll={handleCompressAll}
            resources={resources} isCompressing={isCompressing} isOffice={isOffice}
            stripFonts={stripFonts} onStripFontsChange={setStripFonts}
            minifyXml={minifyXml} onMinifyXmlChange={setMinifyXml}
            compressedBlob={compressedBlob} compressedSize={compressedSize}
            originalSize={file.size} fileName={file.name}
          />
          {error && <p className="text-[12px] text-destructive text-center mt-2 animate-fade-in">{error}</p>}
        </div>
      </main>
    </div>
  );
}
