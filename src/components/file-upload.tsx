"use client";

import { useCallback, useState, useRef } from "react";
import { Upload, FileText, Image, Film, Music, Archive } from "lucide-react";
import { cn } from "@/lib/utils";
import { ACCEPTED_EXTENSIONS, MAX_FILE_SIZE } from "@/lib/parsers";
import { formatBytes } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

interface FileUploadProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

export function FileUpload({ onFileSelected, disabled }: FileUploadProps) {
  const { t } = useI18n();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSelect = useCallback((file: File) => {
    setError(null);
    const ext = file.name.split(".").pop()?.toLowerCase();
    const allowed = ACCEPTED_EXTENSIONS.replace(/\./g, "").split(",");
    if (!ext || !allowed.includes(ext)) { setError(t("upload.unsupportedFormat", { ext: ext ?? "" })); return; }
    if (file.size > MAX_FILE_SIZE) { setError(t("upload.fileTooLarge", { size: formatBytes(file.size) })); return; }
    onFileSelected(file);
  }, [onFileSelected, t]);

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (!disabled && e.dataTransfer.files[0]) validateAndSelect(e.dataTransfer.files[0]); }}
        className={cn(
          "group relative flex flex-col items-center justify-center gap-5 rounded-2xl p-8 transition-all duration-300 cursor-pointer",
          isDragging
            ? "bg-primary/5 scale-[1.01] border-primary/50"
            : "bg-transparent hover:bg-muted/30 border-foreground/20 hover:border-foreground/35",
          disabled && "opacity-40 cursor-not-allowed",
          "border-2 border-dashed"
        )}
      >
        {/* Icon ring */}
        <div className={cn(
          "flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300",
          isDragging ? "bg-primary/10" : "bg-muted/60 group-hover:bg-muted"
        )}>
          <Upload className={cn("h-6 w-6 transition-colors duration-200", isDragging ? "text-primary" : "text-muted-foreground/60 group-hover:text-muted-foreground")} />
        </div>

        <div className="text-center space-y-1.5">
          <p className="text-[14px] font-medium">
            {isDragging ? t("upload.dragActive") : t("upload.dragIdle")}
          </p>
          <p className="text-[13px] text-muted-foreground">
            {t("upload.orText")} <span className="text-primary font-medium">{t("upload.selectFile")}</span>
          </p>
        </div>

        {/* Supported format icons */}
        <div className="flex items-center gap-3 text-muted-foreground/35">
          <FileText className="h-4 w-4" />
          <Image className="h-4 w-4" />
          <Film className="h-4 w-4" />
          <Music className="h-4 w-4" />
          <Archive className="h-4 w-4" />
        </div>

        <input ref={inputRef} type="file" accept={ACCEPTED_EXTENSIONS} onChange={(e) => { if (e.target.files?.[0]) validateAndSelect(e.target.files[0]); e.target.value = ""; }} className="hidden" />
      </div>
      {error && <p className="mt-2.5 text-[12px] text-destructive text-center">{error}</p>}
    </div>
  );
}
