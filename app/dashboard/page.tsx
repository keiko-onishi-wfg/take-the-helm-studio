"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MaterialList from "@/components/dashboard/MaterialList";
import MaterialEditor from "@/components/dashboard/MaterialEditor";
import AiGrill from "@/components/dashboard/AiGrill";
import MindMap from "@/components/dashboard/MindMap";
import BlogStructure from "@/components/dashboard/BlogStructure";
import type { Material, CategoryFilter } from "@/components/dashboard/types";

type EditorMode = "none" | "new" | "edit";

export default function DashboardPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Material | null>(null);
  const [filter, setFilter] = useState<CategoryFilter>("全て");
  const [editorMode, setEditorMode] = useState<EditorMode>("none");

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

  function handleSave(saved: Material) {
    setMaterials((prev) => {
      const exists = prev.find((m) => m.id === saved.id);
      if (exists) return prev.map((m) => m.id === saved.id ? saved : m);
      return [saved, ...prev];
    });
    setSelected(saved);
    setEditorMode("none");
  }

  function handleDelete(id: number) {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
    setSelected(null);
    setEditorMode("none");
  }

  function handleSelect(m: Material) {
    setSelected(m);
    setEditorMode("none");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-stone-50">
      {/* 左：素材リスト */}
      <MaterialList
        materials={materials}
        loading={loading}
        error={error}
        selectedId={selected?.id ?? null}
        filter={filter}
        onFilterChange={setFilter}
        onSelect={handleSelect}
        onNew={() => { setSelected(null); setEditorMode("new"); }}
        onEdit={(m) => { setSelected(m); setEditorMode("edit"); }}
      />

      {/* 右：エディターまたはタブ */}
      {editorMode !== "none" ? (
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          <MaterialEditor
            material={editorMode === "edit" ? selected : null}
            onSave={handleSave}
            onDelete={editorMode === "edit" ? handleDelete : undefined}
            onCancel={() => setEditorMode("none")}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs defaultValue="aigrill" className="flex flex-col h-full">
            <div className="border-b border-stone-200 bg-white px-6 pt-4 pb-0 shrink-0">
              <TabsList className="h-auto bg-transparent p-0 gap-1">
                {[
                  { value: "aigrill", label: "✦ 深掘り" },
                  { value: "mindmap", label: "✦ つながりを見る" },
                  { value: "blog", label: "✦ 記事を組み立てる" },
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="text-sm px-5 py-2.5 rounded-none border-b-2 border-transparent data-[state=inactive]:text-stone-400 bg-transparent shadow-none transition-colors tab-brand"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
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
      )}
    </div>
  );
}