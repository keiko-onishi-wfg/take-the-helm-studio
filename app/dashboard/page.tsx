"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MaterialList from "@/components/dashboard/MaterialList";
import AiGrill from "@/components/dashboard/AiGrill";
import MindMap from "@/components/dashboard/MindMap";
import BlogStructure from "@/components/dashboard/BlogStructure";
import type { Material, CategoryFilter } from "@/components/dashboard/types";

export default function DashboardPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Material | null>(null);
  const [filter, setFilter] = useState<CategoryFilter>("全て");

  useEffect(() => {
    fetch("/api/materials")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setMaterials(data.data);
        else setError(data.error ?? "取得に失敗しました");
      })
      .catch(() => setError("ネットワークエラーが発生しました"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-stone-50">
      {/* ── 左：素材リスト（固定） ── */}
      <MaterialList
        materials={materials}
        loading={loading}
        error={error}
        selectedId={selected?.id ?? null}
        filter={filter}
        onFilterChange={setFilter}
        onSelect={setSelected}
      />

      {/* ── 右：タブ切り替えパネル ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs defaultValue="aigrill" className="flex flex-col h-full">
          {/* タブナビゲーション */}
          <div className="border-b border-stone-200 bg-white px-6 pt-4 pb-0 shrink-0">
            <TabsList className="h-auto bg-transparent p-0 gap-1">
              {[
                { value: "aigrill", label: "🤖 AIグリル" },
                { value: "mindmap", label: "🗺️ マインドマップ" },
                { value: "blog", label: "📝 ブログ構成" },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="text-sm px-5 py-2.5 rounded-none border-b-2 border-transparent data-[state=active]:border-stone-800 data-[state=active]:text-stone-800 data-[state=inactive]:text-stone-400 bg-transparent shadow-none transition-colors"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* タブコンテンツ */}
          <TabsContent value="aigrill" className="flex-1 overflow-hidden m-0">
            <AiGrill selected={selected} />
          </TabsContent>
          <TabsContent value="mindmap" className="flex-1 overflow-hidden m-0">
            <MindMap selected={selected} />
          </TabsContent>
          <TabsContent value="blog" className="flex-1 overflow-hidden m-0">
            <BlogStructure selected={selected} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
