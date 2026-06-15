"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Material } from "./types";

type SeoCheck = { label: string; ok: boolean | null };
type Structure = { title: string; sections: string[] };

function buildDummyStructure(m: Material): { structure: Structure; seo: SeoCheck[] } {
  const titleBase = m.title || "この体験";
  const title = `${titleBase}から学んだ3つのこと【${m.category}レビュー】`;

  const structure: Structure = {
    title,
    sections: [
      "はじめに：なぜこれを読んだ／観た／体験したのか",
      `本編①：${m.summary?.slice(0, 40) ?? "主要なポイント"}`,
      `本編②：${m.insight?.slice(0, 40) ?? "気づきと考察"}`,
      `本編③：${m.action?.slice(0, 40) ?? "実際に行動してみること"}`,
      "まとめ：あなたにもおすすめしたい理由",
    ],
  };

  const titleLen = title.length;
  const seo: SeoCheck[] = [
    {
      label: "誰の何の問題を解決しているか？",
      ok: !!(m.summary && m.summary.length > 20),
    },
    {
      label: "つかみはインパクトあるか？",
      ok: !!(m.insight && m.insight.length > 10),
    },
    {
      label: "キーワードは入っているか？",
      ok: !!(m.title && m.title.length > 4),
    },
    {
      label: "CTAは明確か？",
      ok: !!(m.action && m.action.length > 5),
    },
    {
      label: `タイトルは30文字以内か？（現在 ${titleLen} 文字）`,
      ok: titleLen <= 30,
    },
  ];

  return { structure, seo };
}

type Props = { selected: Material | null };

export default function BlogStructure({ selected }: Props) {
  const [result, setResult] = useState<ReturnType<typeof buildDummyStructure> | null>(null);
  const [generating, setGenerating] = useState(false);

  function handleGenerate() {
    if (!selected) return;
    setGenerating(true);
    setResult(null);
    setTimeout(() => {
      setResult(buildDummyStructure(selected));
      setGenerating(false);
    }, 900);
  }

  if (!selected) {
    return (
      <div className="flex items-center justify-center h-full text-stone-400">
        <div className="text-center">
          <p className="text-5xl mb-4">📝</p>
          <p className="text-base font-medium text-stone-500">素材を選択するとブログ構成を生成できます</p>
          <p className="text-sm mt-1">← 左のリストから素材を選択してください</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-8 pt-6 pb-4 border-b border-stone-100">
        <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">ブログ構成</p>
        <h2 className="text-xl font-semibold text-stone-800">
          {selected.title || "（タイトルなし）"}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
        {!result && !generating && (
          <div className="text-center text-stone-400 py-12">
            <p className="text-5xl mb-4">✍️</p>
            <p className="text-sm">ボタンを押してブログ構成を生成してください</p>
          </div>
        )}
        {generating && (
          <div className="text-center text-stone-400 py-12">
            <p className="text-sm animate-pulse">構成を生成中...</p>
          </div>
        )}

        {result && (
          <>
            {/* 提案タイトル */}
            <Card className="border-stone-200">
              <CardContent className="px-6 py-4">
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
                  提案タイトル
                </p>
                <p className="text-stone-800 font-semibold text-base leading-snug">
                  {result.structure.title}
                </p>
              </CardContent>
            </Card>

            {/* 記事構成 */}
            <Card className="border-stone-200">
              <CardContent className="px-6 py-4">
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
                  記事構成
                </p>
                <ol className="space-y-2">
                  {result.structure.sections.map((sec, i) => (
                    <li key={i} className="flex gap-3 text-sm text-stone-700">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-stone-100 text-stone-500 text-xs flex items-center justify-center font-semibold mt-0.5">
                        {i + 1}
                      </span>
                      {sec}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>

            {/* SEOチェック */}
            <Card className="border-stone-200">
              <CardContent className="px-6 py-4">
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
                  SEOチェック
                </p>
                <ul className="space-y-2.5">
                  {result.seo.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className={`shrink-0 mt-0.5 text-base ${item.ok ? "text-emerald-500" : "text-red-400"}`}>
                        {item.ok ? "✅" : "❌"}
                      </span>
                      <span className={item.ok ? "text-stone-700" : "text-red-600"}>
                        {item.label}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-stone-400 mt-4">※ 現在はダミー判定です</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="px-8 pb-6 pt-3 border-t border-stone-100">
        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full h-12 bg-stone-800 hover:bg-stone-700 text-white rounded-xl"
        >
          {generating ? "生成中..." : "📝 ブログ構成を生成"}
        </Button>
      </div>
    </div>
  );
}
