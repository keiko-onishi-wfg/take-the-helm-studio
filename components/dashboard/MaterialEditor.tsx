"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Material } from "./types";

const CATEGORIES = ["本", "映画", "旅", "セミナー", "その他"];

const STAR_LABELS: Record<number, string> = {
  1: "時間の無駄だった",
  2: "まぁ「経験した」ということで",
  3: "読んで・観て良かった",
  4: "人に薦めたい",
  5: "座右の書/何度も観たい映画",
};

type Props = {
  material?: Material | null;
  onSave: (material: Material) => void;
  onDelete?: (id: number) => void;
  onCancel: () => void;
};

export default function MaterialEditor({ material, onSave, onDelete, onCancel }: Props) {
  const isNew = !material;
  const today = new Date().toISOString().split("T")[0];

  const [category, setCategory] = useState(material?.category ?? "本");
  const [title, setTitle] = useState(material?.title ?? "");
  const [date, setDate] = useState(
    material?.created_at ? material.created_at.split("T")[0] : today
  );
  const [rating, setRating] = useState(material?.rating ?? 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [summary, setSummary] = useState(material?.summary ?? "");
  const [insight, setInsight] = useState(material?.insight ?? "");
  const [action, setAction] = useState(material?.action ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!category) { setError("カテゴリーを選択してください"); return; }
    setSaving(true);
    setError("");

    try {
      let res;
      if (isNew) {
        res = await fetch("/api/materials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category, title, date, rating, summary, insight, action }),
        });
      } else {
        res = await fetch(`/api/materials/${material.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category, title, rating, summary, insight, action, created_at: date }),
        });
      }

      const data = await res.json();
      if (!data.success) { setError(data.error ?? "保存に失敗しました"); return; }

      onSave({
        id: isNew ? data.id : material!.id,
        category,
        title,
        rating,
        summary,
        insight,
        action,
        created_at: new Date(date).toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch {
      setError("ネットワークエラーが発生しました");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!material || !onDelete) return;
    if (!confirm(`「${material.title || "この素材"}」を削除しますか？`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/materials/${material.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) { setError(data.error ?? "削除に失敗しました"); return; }
      onDelete(material.id);
    } catch {
      setError("ネットワークエラーが発生しました");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* ヘッダー */}
      <div className="px-8 pt-6 pb-4 border-b border-stone-100">
        <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">
          {isNew ? "新規追加" : "編集"}
        </p>
        <h2 className="text-xl font-semibold text-stone-800">
          {isNew ? "新しい素材を追加" : (material?.title || "（タイトルなし）")}
        </h2>
      </div>

      {/* フォーム */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">

        {/* カテゴリー */}
        <div>
          <label className="text-xs font-medium text-stone-500 uppercase tracking-wider">カテゴリー</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm border transition-all ${
                  category === cat
                    ? "bg-[#C4704F] text-white border-[#C4704F]"
                    : "bg-white text-stone-600 border-stone-200 hover:border-stone-400"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 日付 */}
        <div>
          <label className="text-xs font-medium text-stone-500 uppercase tracking-wider">日付</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-2 w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-[#C4704F]"
          />
        </div>

        {/* タイトル */}
        <div>
          <label className="text-xs font-medium text-stone-500 uppercase tracking-wider">タイトル</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="タイトルを入力..."
            className="mt-2 w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-[#C4704F]"
          />
        </div>

        {/* 評価 */}
        <div>
          <label className="text-xs font-medium text-stone-500 uppercase tracking-wider">評価</label>
          <div className="mt-2 flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="text-2xl transition-transform hover:scale-110"
              >
                {star <= (hoveredRating || rating) ? "⭐" : "☆"}
              </button>
            ))}
            {(hoveredRating || rating) > 0 && (
              <span className="text-xs text-stone-500 ml-2">
                {STAR_LABELS[hoveredRating || rating]}
              </span>
            )}
          </div>
        </div>

        {/* 概要・内容 */}
        <div>
          <label className="text-xs font-medium text-stone-500 uppercase tracking-wider">概要・内容</label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="概要や内容を入力..."
            rows={4}
            className="mt-2 w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-[#C4704F] resize-none"
          />
        </div>

        {/* 気づき */}
        <div>
          <label className="text-xs font-medium text-stone-500 uppercase tracking-wider">気づき</label>
          <textarea
            value={insight}
            onChange={(e) => setInsight(e.target.value)}
            placeholder="気づきを入力..."
            rows={3}
            className="mt-2 w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-[#C4704F] resize-none"
          />
        </div>

        {/* アクション */}
        <div>
          <label className="text-xs font-medium text-stone-500 uppercase tracking-wider">アクション</label>
          <textarea
            value={action}
            onChange={(e) => setAction(e.target.value)}
            placeholder="アクションを入力..."
            rows={3}
            className="mt-2 w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-[#C4704F] resize-none"
          />
        </div>
      </div>

      {/* フッター */}
      <div className="px-8 pb-6 pt-3 border-t border-stone-100 space-y-2">
        {error && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-center">
            ⚠️ {error}
          </p>
        )}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-12 bg-[#C4704F] hover:bg-[#b05e3f] text-white rounded-xl"
        >
          {saving ? "保存中..." : "💾 保存する"}
        </Button>
        {!isNew && onDelete && (
          <Button
            onClick={handleDelete}
            disabled={deleting}
            className="w-full h-10 bg-white hover:bg-red-50 text-red-500 border border-red-200 rounded-xl"
          >
            {deleting ? "削除中..." : "🗑️ 削除する"}
          </Button>
        )}
        <Button
          onClick={onCancel}
          className="w-full h-10 bg-white hover:bg-stone-50 text-stone-600 border border-stone-200 rounded-xl"
        >
          キャンセル
        </Button>
      </div>
    </div>
  );
}