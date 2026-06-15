"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Material } from "./types";

type Node = { id: string; label: string; color: string };

const BRANCH_COLORS = [
  "bg-amber-100 border-amber-300 text-amber-800",
  "bg-blue-100 border-blue-300 text-blue-800",
  "bg-emerald-100 border-emerald-300 text-emerald-800",
  "bg-purple-100 border-purple-300 text-purple-800",
  "bg-rose-100 border-rose-300 text-rose-800",
];

function buildDummyNodes(m: Material): Node[] {
  const nodes: Node[] = [];
  if (m.summary) nodes.push({ id: "summary", label: "概要：" + m.summary.slice(0, 30) + "…", color: BRANCH_COLORS[0] });
  if (m.insight) nodes.push({ id: "insight", label: "気づき：" + m.insight.slice(0, 30) + "…", color: BRANCH_COLORS[1] });
  if (m.action) nodes.push({ id: "action", label: "アクション：" + m.action.slice(0, 30) + "…", color: BRANCH_COLORS[2] });
  if (m.rating) nodes.push({ id: "rating", label: `評価 ${"⭐".repeat(m.rating)} (${m.rating}/5)`, color: BRANCH_COLORS[3] });
  if (m.category) nodes.push({ id: "category", label: `カテゴリー：${m.category}`, color: BRANCH_COLORS[4] });
  return nodes;
}

type Props = { selected: Material | null };

export default function MindMap({ selected }: Props) {
  const [generated, setGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [nodes, setNodes] = useState<Node[]>([]);

  function handleGenerate() {
    if (!selected) return;
    setGenerating(true);
    setTimeout(() => {
      setNodes(buildDummyNodes(selected));
      setGenerated(true);
      setGenerating(false);
    }, 900);
  }

  if (!selected) {
    return (
      <div className="flex items-center justify-center h-full text-stone-400">
        <div className="text-center">
          <p className="text-5xl mb-4">🗺️</p>
          <p className="text-base font-medium text-stone-500">素材を選択するとマインドマップを作成できます</p>
          <p className="text-sm mt-1">← 左のリストから素材を選択してください</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-8 pt-6 pb-4 border-b border-stone-100">
        <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">マインドマップ</p>
        <h2 className="text-xl font-semibold text-stone-800">
          {selected.title || "（タイトルなし）"}
        </h2>
      </div>

      <div className="flex-1 overflow-auto px-8 py-8 flex items-center justify-center">
        {!generated ? (
          <div className="text-center text-stone-400">
            <p className="text-5xl mb-4">✨</p>
            <p className="text-sm">ボタンを押してマインドマップを生成</p>
          </div>
        ) : (
          <div className="relative w-full max-w-2xl flex flex-col items-center gap-6">
            {/* 中心ノード */}
            <div className="bg-stone-800 text-white px-6 py-4 rounded-2xl text-center shadow-lg max-w-xs">
              <p className="text-sm font-semibold">{selected.title || "（タイトルなし）"}</p>
            </div>

            {/* 接続線 */}
            <div className="w-px h-6 bg-stone-300" />

            {/* ブランチノード */}
            <div className="grid grid-cols-2 gap-3 w-full">
              {nodes.map((node) => (
                <div
                  key={node.id}
                  className={`border rounded-xl px-4 py-3 text-sm font-medium ${node.color}`}
                >
                  {node.label}
                </div>
              ))}
            </div>
            <p className="text-xs text-stone-400 mt-2">※ 現在はダミー生成です</p>
          </div>
        )}
      </div>

      <div className="px-8 pb-6 pt-3 border-t border-stone-100">
        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full h-12 bg-stone-800 hover:bg-stone-700 text-white rounded-xl"
        >
          {generating ? "生成中..." : "🗺️ マインドマップを生成"}
        </Button>
      </div>
    </div>
  );
}
