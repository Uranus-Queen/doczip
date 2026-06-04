"use client";

import { useState, useMemo } from "react";
import type { ResourceNode, ResourceType } from "@/lib/types";
import { formatBytes } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface ResourceListProps {
  resources: ResourceNode[];
  onToggleSelect: (id: string) => void;
}

type SortKey = "name" | "type" | "size" | "percent";
type SortDir = "asc" | "desc";

const TYPE_COLORS: Record<ResourceType, string> = {
  image: "#818cf8", font: "#34d399", metadata: "#fbbf24",
  text: "#a78bfa", xml: "#fb923c", video: "#f472b6", audio: "#2dd4bf",
  archive: "#94a3b8", binary: "#60a5fa", other: "#cbd5e1",
};

const TYPE_LABEL_KEYS: Record<ResourceType, string> = {
  image: "type.image", font: "type.font", metadata: "type.metadata",
  text: "type.text", xml: "type.xml", video: "type.video", audio: "type.audio",
  archive: "type.archive", binary: "type.binary", other: "type.other",
};

const TYPE_ORDER: Record<ResourceType, number> = {
  image: 0, font: 1, video: 2, audio: 3, binary: 4, xml: 5, metadata: 6, text: 7, archive: 8, other: 9,
};

function flatten(resources: ResourceNode[]): ResourceNode[] {
  const r: ResourceNode[] = [];
  for (const x of resources) { if (x.children?.length) r.push(...x.children); else r.push(x); }
  return r;
}

const SORT_LABEL_KEYS: Record<SortKey, string> = {
  name: "resourceList.name",
  type: "resourceList.type",
  size: "resourceList.size",
  percent: "resourceList.percent",
};

export function ResourceList({ resources, onToggleSelect }: ResourceListProps) {
  const { t } = useI18n();
  const [sortKey, setSortKey] = useState<SortKey>("size");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const flat = useMemo(() => flatten(resources), [resources]);
  const totalSize = useMemo(() => flat.reduce((s, r) => s + r.size, 0), [flat]);

  const sorted = useMemo(() => {
    const items = flat.map(r => ({ ...r, percent: totalSize > 0 ? (r.size / totalSize) * 100 : 0 }));
    return items.sort((a, b) => {
      let c = 0;
      switch (sortKey) {
        case "name": c = a.name.localeCompare(b.name); break;
        case "type": c = (TYPE_ORDER[a.type] ?? 99) - (TYPE_ORDER[b.type] ?? 99); break;
        case "size": c = a.size - b.size; break;
        case "percent": c = a.percent - b.percent; break;
      }
      return sortDir === "asc" ? c : -c;
    });
  }, [flat, totalSize, sortKey, sortDir]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir(k === "name" ? "asc" : "desc"); }
  };

  const SI = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="h-2.5 w-2.5 text-muted-foreground/25" />;
    return sortDir === "asc" ? <ArrowUp className="h-2.5 w-2.5 text-primary" /> : <ArrowDown className="h-2.5 w-2.5 text-primary" />;
  };

  return (
    <div className="h-full flex flex-col gap-2">
      <div className="flex items-center gap-1 shrink-0">
        {(["name", "type", "size", "percent"] as SortKey[]).map(k => (
          <button key={k} onClick={() => toggleSort(k)}
            className={`flex items-center gap-0.5 px-2.5 py-1 rounded-lg text-[11px] transition-colors duration-150 ${sortKey === k ? "bg-primary/8 text-primary font-medium" : "text-muted-foreground hover:bg-muted/60"}`}>
            {t(SORT_LABEL_KEYS[k] as Parameters<typeof t>[0])}
            <SI col={k} />
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
          {sorted.map(r => (
            <div key={r.id} onClick={() => onToggleSelect(r.id)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer transition-all duration-150 ${r.selected ? "bg-primary/6 ring-[0.5px] ring-primary/20" : "hover:bg-muted/50"}`}>
              <Checkbox checked={r.selected} onCheckedChange={() => onToggleSelect(r.id)} className="shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium truncate leading-tight">{r.name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: TYPE_COLORS[r.type] }} />
                  <span className="text-[10px] text-muted-foreground">{t(TYPE_LABEL_KEYS[r.type] as Parameters<typeof t>[0])}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[12px] tabular-nums font-medium leading-tight">{formatBytes(r.size)}</p>
                <p className="text-[10px] tabular-nums text-muted-foreground">{r.percent.toFixed(1)}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
