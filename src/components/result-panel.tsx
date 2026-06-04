"use client";

import { formatBytes, compressionRatio } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Download, ArrowDown, TrendingDown, Check } from "lucide-react";

interface ResultPanelProps {
  originalSize: number;
  compressedSize: number;
  compressedBlob: Blob | null;
  fileName: string;
}

export function ResultPanel({ originalSize, compressedSize, compressedBlob, fileName }: ResultPanelProps) {
  const { t } = useI18n();
  if (!compressedBlob) return null;

  const ratio = compressionRatio(originalSize, compressedSize);
  const saved = originalSize - compressedSize;

  const handleDownload = () => {
    const url = URL.createObjectURL(compressedBlob);
    const a = document.createElement("a");
    const dot = fileName.lastIndexOf(".");
    a.href = url;
    a.download = dot > 0
      ? `${fileName.slice(0, dot)}_compressed${fileName.slice(dot)}`
      : `${fileName}_compressed`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-xl overflow-hidden animate-slide-up glass-panel"
      style={{ borderColor: "rgba(16,185,129,0.2)" }}>
      <div className="flex items-center gap-5 px-5 py-3.5">
        {/* Left: stats */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
            <Check className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground tabular-nums line-through decoration-muted-foreground/40">{formatBytes(originalSize)}</span>
            <ArrowDown className="h-3.5 w-3.5 text-emerald-500 -rotate-90" />
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatBytes(compressedSize)}</span>
          </div>
        </div>

        {/* Center: ratio badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
          <TrendingDown className="h-3.5 w-3.5 text-emerald-500" />
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{t("result.reduced", { ratio })}</span>
          <span className="text-xs text-muted-foreground ml-1">{t("result.saved", { size: formatBytes(saved) })}</span>
        </div>

        {/* Right: download button */}
        <Button
          onClick={handleDownload}
          size="lg"
          className="ml-auto gap-2.5 rounded-xl px-7 py-2.5 h-auto text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 active:scale-[0.97] transition-all"
        >
          <Download className="h-5 w-5" />
          {t("result.downloadCompressed")}
        </Button>
      </div>
    </div>
  );
}
