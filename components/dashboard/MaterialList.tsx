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
  onNew: () => void;
  onEdit: (m: Material) => void;
};

export default function MaterialList({
  materials,
  loading,
  error,
  selectedId,
  filter,
  onFilterChange,
  onSelect,
  onNew,
  onEdit,
}: Props) {
  const filtered =
    filter === "全て" ? materials : materials.filter((m) => m.category === filter);

  return (
    <aside className="w-1/3 shrink-0 border-r border-stone-200 flex flex-col bg-white h-screen overflow-hidden">
      {/* ヘッダー */}
      <div className="px-6 pt-6 pb-5 border-b border-stone-100">
        <div className="flex items-center gap-4">
          <Image
            src="/apple-touch-icon.png"
            alt="Take The Helm Studio"
            width={80}
            height={80}
            className="rounded-2xl shrink-0 shadow-md"
          />
          <div className="flex-1">
            <p className="text-xs tracking-widest text-stone-400 uppercase mb-1">
              Take The Helm Studio
            </p>
            <h1 className="text-xl font-semibold text-stone-800">今日の体験を言葉に残す</h1>
            <p className="text-xs text-stone-400 mt-1">{materials.length} 件</p>
          </div>
        </div>
        {/* 新規追加ボタン */}
        <button
          onClick={onNew}
          className="mt-4 w-full h-10 bg-[#C4704F] hover:bg-[#b05e3f] text-white text-sm font-medium rounded-xl transition-colors"
        >
          ＋ 新しい素材を追加
        </button>
      </div>

      {/* カテゴリーフィルター */}
      <div className="px-4 pt-4 pb-3 border-b border-stone-100">
        <Tabs value={filter} onValueChange={(v) => onFilterChange(v as CategoryFilter)}>
          <TabsList className="flex flex-wrap gap-1.5 h-auto bg-transparent p-0">
            {ALL_CATEGORIES.map((cat) => (
              <TabsTrigger
                key={cat}
                value={cat}
                className="text-xs px-3 py-1.5 rounded-full border border-stone-200 bg-white tab-filter-brand transition-colors"
              >
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* リスト */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
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
            <div
              key={m.id}
              className={`w-full text-left rounded-xl border transition-all ${
                isSelected
                  ? "border-[#C4704F] bg-[#C4704F] text-white shadow-sm"
                  : "border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm"
              }`}
            >
              <button
                onClick={() => onSelect(m)}
                className="w-full text-left px-4 pt-3 pb-2"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${
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
                <p className={`text-sm font-medium ${isSelected ? "text-white" : "text-stone-700"}`}>
                  {m.title || "（タイトルなし）"}
                </p>
                {m.rating && (
                  <p className="text-xs mt-1">{"⭐".repeat(m.rating)}</p>
                )}
              </button>
              {/* 編集ボタン */}
              <div className="px-4 pb-2.5">
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(m); }}
                  className={`text-xs px-3 py-1 rounded-lg border transition-colors ${
                    isSelected
                      ? "border-white/30 text-white hover:bg-white/20"
                      : "border-stone-200 text-stone-500 hover:border-stone-400 hover:text-stone-700"
                  }`}
                >
                  ✏️ 編集
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}