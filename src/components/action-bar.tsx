"use client";

import type { CompressionLevel, ResourceNode } from "@/lib/types";
import { formatBytes, compressionRatio } from "@/lib/format";
import { useI18n, type LocaleCode } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Zap, FileDown, Download, TrendingDown, ArrowRight, Check } from "lucide-react";

interface ActionBarProps {
  compressionLevel: CompressionLevel;
  onLevelChange: (level: CompressionLevel) => void;
  onCompressSelected: () => void;
  onCompressAll: () => void;
  resources: ResourceNode[];
  isCompressing: boolean;
  isOffice?: boolean;
  stripFonts?: boolean;
  onStripFontsChange?: (v: boolean) => void;
  minifyXml?: boolean;
  onMinifyXmlChange?: (v: boolean) => void;
  compressedBlob?: Blob | null;
  compressedSize?: number;
  originalSize?: number;
  fileName?: string;
}

const LEVELS: CompressionLevel[] = ["low", "medium", "high"];
const LEVEL_KEY: Record<CompressionLevel, "actionBar.levelLow" | "actionBar.levelMed" | "actionBar.levelHigh"> = {
  low: "actionBar.levelLow",
  medium: "actionBar.levelMed",
  high: "actionBar.levelHigh",
};

export function ActionBar({
  compressionLevel, onLevelChange, onCompressSelected, onCompressAll,
  resources, isCompressing, isOffice, stripFonts, onStripFontsChange, minifyXml, onMinifyXmlChange,
  compressedBlob, compressedSize = 0, originalSize = 0, fileName,
}: ActionBarProps) {
  const { t } = useI18n();
  const sel = countSelected(resources);
  const li = LEVELS.indexOf(compressionLevel);
  const done = !!compressedBlob;

  const download = () => {
    if (!compressedBlob || !fileName) return;
    const url = URL.createObjectURL(compressedBlob);
    const a = document.createElement("a");
    const dot = fileName.lastIndexOf(".");
    a.href = url;
    a.download = dot > 0 ? `${fileName.slice(0, dot)}_compressed${fileName.slice(dot)}` : `${fileName}_compressed`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-2xl overflow-hidden glass-panel" style={{ borderColor: done ? "rgba(52,199,89,0.2)" : undefined }}>
      <div className="flex items-center gap-3.5 px-4 py-2.5">
        {done ? (
          <>
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#34C759]/10">
              <Check className="h-3.5 w-3.5 text-[#34C759]" />
            </div>
            <span className="text-[13px] text-muted-foreground line-through decoration-muted-foreground/30 tabular-nums">{formatBytes(originalSize!)}</span>
            <ArrowRight className="h-3 w-3 text-[#34C759]" />
            <span className="text-[13px] font-semibold text-[#34C759] tabular-nums">{formatBytes(compressedSize)}</span>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#34C759]/8">
              <TrendingDown className="h-3 w-3 text-[#34C759]" />
              <span className="text-[12px] font-semibold text-[#34C759]">-{compressionRatio(originalSize!, compressedSize)}%</span>
            </div>
            <Button onClick={download} className="ml-auto gap-2 rounded-xl px-5 h-9 text-[13px] font-semibold bg-[#34C759] hover:bg-[#30B350] text-white shadow-sm active:scale-[0.97] transition-all duration-150">
              <Download className="h-4 w-4" /> {t("actionBar.download")}
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 min-w-44">
              <span className="text-[12px] text-muted-foreground font-medium">{t("actionBar.compress")}</span>
              <div className="flex-1"><Slider value={[li]} onValueChange={(v) => onLevelChange(LEVELS[Array.isArray(v) ? v[0] : v as number])} max={2} step={1} /></div>
              <span className="text-[12px] font-semibold text-primary w-5 text-center">{t(LEVEL_KEY[compressionLevel])}</span>
            </div>

            <div className="w-px h-4 bg-border/60 shrink-0" />

            {sel > 0 && (
              <>
                <span className="text-[11px] text-muted-foreground shrink-0">
                  {t("actionBar.selected", { count: sel })}
                </span>
                <Button variant="ghost" size="sm" onClick={onCompressSelected} disabled={isCompressing} className="gap-1 rounded-lg text-[11px] h-7 px-2.5 text-primary hover:text-primary hover:bg-primary/5 shrink-0">
                  <Zap className="h-3 w-3" /> {t("actionBar.compressSelected")}
                </Button>
                <div className="w-px h-4 bg-border/60 shrink-0" />
              </>
            )}

            {isOffice && (
              <>
                <label className="flex items-center gap-1.5 cursor-pointer select-none shrink-0">
                  <Checkbox checked={minifyXml} onCheckedChange={(v) => onMinifyXmlChange?.(v === true)} className="h-3.5 w-3.5" />
                  <span className="text-[11px] text-muted-foreground">{t("actionBar.xml")}</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer select-none shrink-0">
                  <Checkbox checked={stripFonts} onCheckedChange={(v) => onStripFontsChange?.(v === true)} className="h-3.5 w-3.5" />
                  <span className="text-[11px] text-muted-foreground">{t("actionBar.fonts")}</span>
                </label>
                <div className="w-px h-4 bg-border/60 shrink-0" />
              </>
            )}

            <Button onClick={onCompressAll} disabled={isCompressing}
              className="ml-auto gap-2 rounded-xl px-4.5 h-9 text-[13px] font-semibold shadow-sm active:scale-[0.97] transition-all duration-150 shrink-0">
              {isCompressing ? (
                <><span className="h-3.5 w-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> {t("actionBar.compressing")}
                </>
              ) : (
                <><FileDown className="h-4 w-4" /> {t("actionBar.compressAll")}
                </>
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function countSelected(r: ResourceNode[]): number {
  let n = 0; for (const x of r) { if (x.selected) n++; if (x.children) for (const c of x.children) if (c.selected) n++; } return n;
}
