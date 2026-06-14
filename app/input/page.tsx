"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORIES = ["本", "映画", "旅", "セミナー", "その他"] as const;

const RATING_LABELS: Record<number, string> = {
  1: "時間の無駄だった",
  2: "まぁ「経験した」ということで",
  3: "読んで・観て良かった",
  4: "人に薦めたい",
  5: "座右の書・何度も観たい映画",
};

const today = new Date().toISOString().split("T")[0];

function toJapaneseDate(iso: string) {
  if (!iso) return "";
  const [yyyy, mm, dd] = iso.split("-");
  return `${yyyy}年${Number(mm)}月${Number(dd)}日`;
}

type FormData = {
  category: string;
  date: string;
  title: string;
  rating: number;
  summary: string;
  insight: string;
  action: string;
};

const INITIAL_FORM: FormData = {
  category: "",
  date: today,
  title: "",
  rating: 0,
  summary: "",
  insight: "",
  action: "",
};

export default function InputPage() {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [saved, setSaved] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log("保存データ:", form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="min-h-screen bg-stone-50 py-6 px-4">
      <div className="max-w-lg mx-auto">
        {/* ヘッダー */}
        <div className="mb-6">
          <p className="text-xs tracking-widest text-stone-400 uppercase mb-1">
            Take The Helm Studio
          </p>
          <h1 className="text-2xl font-semibold text-stone-800">素材を記録する</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* カテゴリー */}
          <Card className="border-stone-200 shadow-sm">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-medium text-stone-600">
                カテゴリー <span className="text-red-400">*</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <Select
                value={form.category}
                onValueChange={(v) => setForm((prev) => ({ ...prev, category: v ?? "" }))}
                required
              >
                <SelectTrigger className="h-12 text-base border-stone-200 bg-white">
                  <SelectValue placeholder="選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-base py-3">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* 日付 */}
          <Card className="border-stone-200 shadow-sm">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-medium text-stone-600">
                日付
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  className="h-12 flex-1 rounded-md border border-stone-200 bg-white px-3 text-base text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400"
                />
                <span className="shrink-0 text-sm text-stone-500 tabular-nums">
                  {toJapaneseDate(form.date)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* タイトル */}
          <Card className="border-stone-200 shadow-sm">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-medium text-stone-600">
                タイトル
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <Input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="作品・イベントのタイトル"
                className="h-12 text-base border-stone-200 bg-white"
              />
            </CardContent>
          </Card>

          {/* 評価 */}
          <Card className="border-stone-200 shadow-sm">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-medium text-stone-600">
                評価
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex gap-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        rating: prev.rating === star ? 0 : star,
                      }))
                    }
                    className={`text-3xl leading-none transition-transform active:scale-110 ${
                      star <= form.rating ? "opacity-100" : "opacity-25"
                    }`}
                    aria-label={`${star}点`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
              {form.rating > 0 && (
                <p className="mt-3 text-sm text-stone-600 font-medium">
                  ★{form.rating} / 5　
                  <span className="text-stone-500 font-normal">
                    {RATING_LABELS[form.rating]}
                  </span>
                </p>
              )}
            </CardContent>
          </Card>

          {/* 概要・内容 */}
          <Card className="border-stone-200 shadow-sm">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-medium text-stone-600">
                概要・内容
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <Textarea
                name="summary"
                value={form.summary}
                onChange={handleChange}
                placeholder="どんな内容だったか簡単にまとめてください"
                className="min-h-28 text-base border-stone-200 bg-white resize-none"
              />
            </CardContent>
          </Card>

          {/* 気づき */}
          <Card className="border-stone-200 shadow-sm">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-medium text-stone-600">
                気づき
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <Textarea
                name="insight"
                value={form.insight}
                onChange={handleChange}
                placeholder="印象に残ったこと、発見したこと"
                className="min-h-28 text-base border-stone-200 bg-white resize-none"
              />
            </CardContent>
          </Card>

          {/* アクション */}
          <Card className="border-stone-200 shadow-sm">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-medium text-stone-600">
                アクション
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <Textarea
                name="action"
                value={form.action}
                onChange={handleChange}
                placeholder="この体験から実際にやってみること"
                className="min-h-24 text-base border-stone-200 bg-white resize-none"
              />
            </CardContent>
          </Card>

          {/* 保存ボタン */}
          <div className="pt-2 pb-8">
            <Button
              type="submit"
              className="w-full h-14 text-base font-medium bg-stone-800 hover:bg-stone-700 text-white rounded-xl transition-colors"
            >
              保存する
            </Button>
            {saved && (
              <p className="mt-3 text-center text-sm text-emerald-600 font-medium">
                ✓ コンソールに出力しました
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
