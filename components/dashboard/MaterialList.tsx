"use client";

import Image from "next/image";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Material, CategoryFilter } from "./types";

const ALL_CATEGORIES: CategoryFilter[] = [
  "全て", "本", "映画", "旅", "セミナー", "その他",
];

const CATEGORY_COLORS: Record<string, string> = {
  本: "bg-amber-100 text-amber-800 border-amber-200",
  映画: "bg-blue-100 text-blue-800 border-blue-200",
  旅: "bg-emerald-100 text-emerald-800 border-emerald-200",
  セミナー: "bg-purple-100 text-purple-800 border-purple-200",
  その他: "bg-stone-100 text-stone-700 border-stone-200",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

type Props = {
  materials: Material[];
  loading: boolean;
  error: string;
  selectedId: number | null;
  filter: CategoryFilter;
  onFilterChange: (f: CategoryFilter) => void;
  onSelect: (m: Material) => void;
};

export default function MaterialList({
  materials,
  loading,
  error,
  selectedId,
  filter,
  onFilterChange,
  onSelect,
}: Props) {
  const filtered =
    filter === "全て" ? materials : materials.filter((m) => m.category === filter);

  return (
    <aside className="w-80 shrink-0 border-r border-stone-200 flex flex-col bg-white h-screen overflow-hidden">
      {/* ヘッダー */}
      <div className="px-5 pt-5 pb-3 border-b border-stone-100">
        <div className="flex items-center gap-3">
          <Image
            src="/apple-touch-icon.png"
            alt="Take The Helm Studio"
            width={60}
            height={60}
            className="rounded-xl shrink-0"
          />
          <div>
            <p className="text-xs tracking-widest text-stone-400 uppercase mb-0.5">
              Take The Helm Studio
            </p>
            <h1 className="text-lg font-semibold text-stone-800">素材ライブラリ</h1>
            <p className="text-xs text-stone-400 mt-0.5">{materials.length} 件</p>
          </div>
        </div>
      </div>

      {/* カテゴリーフィルター */}
      <div className="px-4 pt-3 pb-2 border-b border-stone-100">
        <Tabs value={filter} onValueChange={(v) => onFilterChange(v as CategoryFilter)}>
          <TabsList className="flex flex-wrap gap-1 h-auto bg-transparent p-0">
            {ALL_CATEGORIES.map((cat) => (
              <TabsTrigger
                key={cat}
                value={cat}
                className="text-xs px-2.5 py-1 rounded-full border border-stone-200 bg-white tab-filter-brand transition-colors"
              >
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* リスト */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
        {loading && (
          <p className="text-sm text-stone-400 text-center py-10">読み込み中...</p>
        )}
        {error && (
          <p className="text-sm text-red-500 text-center py-10">{error}</p>
        )}
        {!loading && !error && filtered.length === 0 && (
          <p className="text-sm text-stone-400 text-center py-10">素材がありません</p>
        )}
        {filtered.map((m) => {
          const isSelected = selectedId === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onSelect(m)}
              className={`w-full text-left rounded-lg border px-3.5 py-2.5 transition-all ${
                isSelected
                  ? "border-[#C4704F] bg-[#C4704F] text-white shadow-sm"
                  : "border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                    isSelected
                      ? "bg-white/20 text-white border-white/30"
                      : (CATEGORY_COLORS[m.category] ?? CATEGORY_COLORS["その他"])
                  }`}
                >
                  {m.category}
                </span>
                <span className={`text-xs ${isSelected ? "text-stone-300" : "text-stone-400"}`}>
                  {formatDate(m.created_at)}
                </span>
              </div>
              <p className={`text-sm font-medium truncate ${isSelected ? "text-white" : "text-stone-700"}`}>
                {m.title || "（タイトルなし）"}
              </p>
              {m.rating && (
                <p className="text-xs mt-0.5">{"⭐".repeat(m.rating)}</p>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
