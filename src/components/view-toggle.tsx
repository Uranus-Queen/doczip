"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, List } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface ViewToggleProps {
  viewMode: "treemap" | "list";
  onViewChange: (mode: "treemap" | "list") => void;
}

export function ViewToggle({ viewMode, onViewChange }: ViewToggleProps) {
  const { t } = useI18n();
  return (
    <Tabs
      value={viewMode}
      onValueChange={(v) => onViewChange(v as "treemap" | "list")}
    >
      <TabsList className="h-9">
        <TabsTrigger value="treemap" className="gap-1.5 text-xs px-3">
          <LayoutGrid className="h-3.5 w-3.5" />
          {t("viewToggle.treemap")}
        </TabsTrigger>
        <TabsTrigger value="list" className="gap-1.5 text-xs px-3">
          <List className="h-3.5 w-3.5" />
          {t("viewToggle.list")}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
