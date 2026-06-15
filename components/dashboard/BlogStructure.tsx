"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Material } from "./types";

// ── 型 ──────────────────────────────────────────
type BlogData = {
  title_ja: string;
  title_en: string;
  target: string;
  hook: string;
  sections: { h2: string; points: string[] }[];
  conclusion: string;
  cta: string;
  seo_check: {
    target_clear: boolean;
    hook_impact: boolean;
    keyword_included: boolean;
    cta_clear: boolean;
    title_under_30: boolean;
  };
};

const SEO_LABELS: Record<keyof BlogData["seo_check"], string> = {
  target_clear: "ターゲットが明確",
  hook_impact: "つかみにインパクトがある",
  keyword_included: "キーワードが含まれている",
  cta_clear: "CTAが明確",
  title_under_30: "タイトルが30文字以内",
};

const GRILL_KEY = (id: number) => `aigrill-${id}`;
const MINDMAP_KEY = (id: number) => `mindmap-${id}`;

// ── クリップボード用フォーマット ─────────────────
function formatForClipboard(blog: BlogData): string {
  return [
    "【タイトル（日本語）】",
    blog.title_ja,
    "【タイトル（英語）】",
    blog.title_en,
    "",
    "【ターゲット】",
    blog.target,
    "",
    "【つかみ】",
    blog.hook,
    "",
    "【記事構成】",
    ...blog.sections.flatMap((s) => [
      `## ${s.h2}`,
      ...s.points.map((p) => `- ${p}`),
      "",
    ]),
    "【まとめ】",
    blog.conclusion,
    "",
    "【CTA】",
    blog.cta,
  ].join("\n");
}

// ── メインコンポーネント ─────────────────────────
type Props = { selected: Material | null };

export default function BlogStructure({ selected }: Props) {
  const [blog, setBlog] = useState<BlogData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [hasContext, setHasContext] = useState(false);

  // 素材切り替えでリセット＋コンテキストチェック
  useEffect(() => {
    setBlog(null);
    setError("");
    if (!selected) {
      setHasContext(false);
      return;
    }
    try {
      const hasGrill = !!sessionStorage.getItem(GRILL_KEY(selected.id));
      const hasMindmap = !!sessionStorage.getItem(MINDMAP_KEY(selected.id));
      setHasContext(hasGrill || hasMindmap);
    } catch {
      setHasContext(false);
    }
  }, [selected?.id]);

  async function handleGenerate() {
    if (!selected) return;
    setLoading(true);
    setError("");

    let grillMessages: unknown[] = [];
    let mindmapData: unknown = null;
    try {
      const saved = sessionStorage.getItem(GRILL_KEY(selected.id));
      if (saved) grillMessages = JSON.parse(saved);
    } catch {}
    try {
      const saved = sessionStorage.getItem(MINDMAP_KEY(selected.id));
      if (saved) mindmapData = JSON.parse(saved);
    } catch {}

    try {
      const res = await fetch("/api/ai/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          material: {
            title: selected.title,
            category: selected.category,
            summary: selected.summary,
            insight: selected.insight,
            action: selected.action,
          },
          grillMessages,
          mindmapData,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error ?? "生成に失敗しました");
        return;
      }
      setBlog(data.blog);
    } catch {
      setError("ネットワークエラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!blog) return;
    try {
      await navigator.clipboard.writeText(formatForClipboard(blog));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("クリップボードへのコピーに失敗しました");
    }
  }

  if (!selected) {
    return (
      <div className="flex items-center justify-center h-full text-stone-400">
        <div className="text-center">
          <p className="text-5xl mb-4">📝</p>
          <p className="text-base font-medium text-stone-500">
            素材を選択するとブログ構成を生成できます
          </p>
          <p className="text-sm mt-1">← 左のリストから素材を選択してください</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* ヘッダー */}
      <div className="px-8 pt-6 pb-4 border-b border-stone-100 flex items-start justify-between">
        <div>
          <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">
            ブログ構成
          </p>
          <h2 className="text-xl font-semibold text-stone-800">
            {selected.title || "（タイトルなし）"}
          </h2>
        </div>
        {blog && (
          <button
            onClick={handleCopy}
            className="text-xs text-stone-400 hover:text-stone-600 mt-1 shrink-0 flex items-center gap-1 transition-colors"
          >
            {copied ? "✅ コピー済み" : "📋 コピー"}
          </button>
        )}
      </div>

      {/* コンテンツエリア */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
        {/* 空の状態 */}
        {!blog && !loading && !error && (
          <div className="text-center text-stone-400 py-12">
            <p className="text-5xl mb-4">✍️</p>
            <p className="text-sm">ボタンを押してブログ構成を生成してください</p>
            {hasContext && (
              <p className="text-xs text-stone-400 mt-2">
                💬 AIグリル・マインドマップの情報も反映されます
              </p>
            )}
          </div>
        )}

        {/* ローディング */}
        {loading && (
          <div className="text-center text-stone-400 py-12">
            <p className="text-4xl mb-4 animate-pulse">✍️</p>
            <p className="text-sm">構成を考え中...</p>
          </div>
        )}

        {/* エラー */}
        {error && !loading && (
          <div className="text-center py-6">
            <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              ⚠️ {error}
            </p>
          </div>
        )}

        {/* 生成結果 */}
        {blog && (
          <>
            {/* タイトル */}
            <Card className="border-stone-200">
              <CardContent className="px-6 py-4">
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
                  タイトル
                </p>
                <p className="text-stone-800 font-semibold text-base leading-snug">
                  {blog.title_ja}
                </p>
                <p className="text-stone-400 text-sm mt-1 italic">
                  {blog.title_en}
                </p>
                <p
                  className={`text-xs mt-2 ${
                    blog.title_ja.length <= 30
                      ? "text-emerald-500"
                      : "text-red-400"
                  }`}
                >
                  {blog.title_ja.length}文字{" "}
                  {blog.title_ja.length <= 30 ? "✅" : "❌（30文字超）"}
                </p>
              </CardContent>
            </Card>

            {/* ターゲット */}
            <Card className="border-stone-200">
              <CardContent className="px-6 py-4">
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
                  ターゲット（誰の何の問題）
                </p>
                <p className="text-stone-700 text-sm leading-relaxed">
                  {blog.target}
                </p>
              </CardContent>
            </Card>

            {/* つかみ */}
            <Card className="border-stone-200">
              <CardContent className="px-6 py-4">
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
                  つかみ・導入
                </p>
                <p className="text-stone-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {blog.hook}
                </p>
              </CardContent>
            </Card>

            {/* 記事構成 */}
            <Card className="border-stone-200">
              <CardContent className="px-6 py-4">
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
                  記事構成
                </p>
                <div className="space-y-4">
                  {blog.sections.map((section, i) => (
                    <div key={i}>
                      <p className="text-sm font-semibold text-stone-800 mb-1.5">
                        H2 {i + 1}. {section.h2}
                      </p>
                      <ul className="space-y-1 pl-2">
                        {section.points.map((point, j) => (
                          <li
                            key={j}
                            className="flex gap-2 text-sm text-stone-600"
                          >
                            <span className="text-stone-300 shrink-0 mt-0.5">
                              •
                            </span>
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* まとめ・CTA */}
            <Card className="border-stone-200">
              <CardContent className="px-6 py-4 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
                    まとめ
                  </p>
                  <p className="text-stone-700 text-sm leading-relaxed">
                    {blog.conclusion}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
                    CTA
                  </p>
                  <p className="text-stone-700 text-sm leading-relaxed font-medium">
                    {blog.cta}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* SEOチェック */}
            <Card className="border-stone-200">
              <CardContent className="px-6 py-4">
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
                  SEOチェック
                </p>
                <ul className="space-y-2.5">
                  {(
                    Object.entries(blog.seo_check) as [
                      keyof BlogData["seo_check"],
                      boolean
                    ][]
                  ).map(([key, ok]) => (
                    <li key={key} className="flex items-center gap-3 text-sm">
                      <span
                        className={`shrink-0 ${
                          ok ? "text-emerald-500" : "text-red-400"
                        }`}
                      >
                        {ok ? "✅" : "❌"}
                      </span>
                      <span className={ok ? "text-stone-700" : "text-red-600"}>
                        {SEO_LABELS[key]}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* フッター */}
      <div className="px-8 pb-6 pt-3 border-t border-stone-100">
        <Button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full h-12 bg-stone-800 hover:bg-stone-700 text-white rounded-xl"
        >
          {loading
            ? "構成を考え中..."
            : blog
            ? "🔄 再生成する"
            : "📝 ブログ構成を生成"}
        </Button>
      </div>
    </div>
  );
}
