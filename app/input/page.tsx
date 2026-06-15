"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Mic } from "lucide-react";
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

// Web Speech API の型宣言（TypeScript 標準 lib には未収録）
interface SpeechRecognitionResultItem {
  readonly transcript: string;
  readonly confidence: number;
}
interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionResultItem;
  [index: number]: SpeechRecognitionResultItem;
}
interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

// ───────────────────────────────────────────
// 定数
// ───────────────────────────────────────────

const CATEGORIES = ["本", "映画", "旅", "セミナー", "その他"] as const;

const RATING_LABELS: Record<number, string> = {
  1: "時間の無駄だった",
  2: "まぁ「経験した」ということで",
  3: "読んで・観て良かった",
  4: "人に薦めたい",
  5: "座右の書・何度も観たい映画",
};

const today = new Date().toISOString().split("T")[0];

// ───────────────────────────────────────────
// ユーティリティ
// ───────────────────────────────────────────

function toJapaneseDate(iso: string) {
  if (!iso) return "";
  const [yyyy, mm, dd] = iso.split("-");
  return `${yyyy}年${Number(mm)}月${Number(dd)}日`;
}


// ───────────────────────────────────────────
// 型
// ───────────────────────────────────────────

type FormData = {
  category: string;
  date: string;
  title: string;
  rating: number;
  summary: string;
  insight: string;
  action: string;
};

type VoiceField = "summary" | "insight" | "action";

const INITIAL_FORM: FormData = {
  category: "",
  date: today,
  title: "",
  rating: 0,
  summary: "",
  insight: "",
  action: "",
};

// ───────────────────────────────────────────
// ページコンポーネント
// ───────────────────────────────────────────

export default function InputPage() {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [activeField, setActiveField] = useState<VoiceField | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const [speechSupported, setSpeechSupported] = useState(false);

  useEffect(() => {
    setSpeechSupported(!!(window.SpeechRecognition || window.webkitSpeechRecognition));
  }, []);

  // ── フォーム変更 ──────────────────────────
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  // ── 音声入力トグル ────────────────────────
  const toggleRecording = useCallback(
    (field: VoiceField) => {
      if (activeField === field) {
        // 録音中 → 停止
        recognitionRef.current?.stop();
        recognitionRef.current = null;
        setActiveField(null);
        return;
      }

      // 別フィールドが録音中なら先に停止
      recognitionRef.current?.stop();
      recognitionRef.current = null;

      const SpeechRecognitionAPI =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      const recognition = new SpeechRecognitionAPI();
      recognition.lang = "ja-JP";
      recognition.continuous = true;
      recognition.interimResults = false;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript;
          }
        }
        if (transcript) {
          setForm((prev) => ({
            ...prev,
            [field]: prev[field]
              ? prev[field] + "　" + transcript
              : transcript,
          }));
        }
      };

      recognition.onerror = () => {
        recognitionRef.current = null;
        setActiveField(null);
      };

      recognition.onend = () => {
        // continuous=true でも接続が切れた場合のフォールバック
        setActiveField((cur) => (cur === field ? null : cur));
        recognitionRef.current = null;
      };

      recognition.start();
      recognitionRef.current = recognition;
      setActiveField(field);
    },
    [activeField]
  );

  // ── 保存 ──────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    recognitionRef.current?.stop();
    setActiveField(null);

    setStatus("saving");
    setErrorMessage("");

    try {
      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (data.success) {
        setStatus("success");
        setForm(INITIAL_FORM);
        setTimeout(() => setStatus("idle"), 4000);
      } else {
        setErrorMessage(data.error ?? "保存に失敗しました");
        setStatus("error");
      }
    } catch {
      setErrorMessage("ネットワークエラーが発生しました");
      setStatus("error");
    }
  }

  // ── マイクボタン ──────────────────────────
  function MicButton({ field }: { field: VoiceField }) {
    if (!speechSupported) return null;
    const isRecording = activeField === field;
    return (
      <button
        type="button"
        onClick={() => toggleRecording(field)}
        aria-label={isRecording ? "録音停止" : "音声入力開始"}
        className={`
          absolute top-2 right-2 z-10
          flex items-center justify-center
          w-9 h-9 rounded-full border transition-all
          ${
            isRecording
              ? "bg-red-500 border-red-500 text-white animate-pulse shadow-md shadow-red-200"
              : "bg-white border-stone-200 text-stone-400 hover:border-stone-400 hover:text-stone-600"
          }
        `}
      >
        <Mic size={16} />
      </button>
    );
  }

  // ────────────────────────────────────────
  return (
    <div className="min-h-screen bg-stone-50 py-6 px-4">
      <div className="max-w-lg mx-auto">
        {/* ヘッダー */}
        <div className="mb-6">
          <p className="text-xs tracking-widest text-stone-400 uppercase mb-1">
            Take The Helm Studio
          </p>
          <h1 className="text-2xl font-semibold text-stone-800 font-serif-jp">今日の体験を、言葉に残す</h1>
        </div>

        {/* 音声入力非対応の通知 */}
        {!speechSupported && (
          <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
            このブラウザは音声入力に対応していません。iOS の場合は Safari をお使いください。
          </div>
        )}

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
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, category: v ?? "" }))
                }
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
              <div className="relative">
                <MicButton field="summary" />
                <Textarea
                  name="summary"
                  value={form.summary}
                  onChange={handleChange}
                  placeholder="どんな内容だったか簡単にまとめてください"
                  className={`min-h-28 text-base border-stone-200 bg-white resize-none pr-12 ${
                    activeField === "summary" ? "border-red-300 ring-1 ring-red-200" : ""
                  }`}
                />
                {activeField === "summary" && (
                  <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    録音中…話しかけてください
                  </p>
                )}
              </div>
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
              <div className="relative">
                <MicButton field="insight" />
                <Textarea
                  name="insight"
                  value={form.insight}
                  onChange={handleChange}
                  placeholder="印象に残ったこと、発見したこと"
                  className={`min-h-28 text-base border-stone-200 bg-white resize-none pr-12 ${
                    activeField === "insight" ? "border-red-300 ring-1 ring-red-200" : ""
                  }`}
                />
                {activeField === "insight" && (
                  <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    録音中…話しかけてください
                  </p>
                )}
              </div>
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
              <div className="relative">
                <MicButton field="action" />
                <Textarea
                  name="action"
                  value={form.action}
                  onChange={handleChange}
                  placeholder="この体験から実際にやってみること"
                  className={`min-h-24 text-base border-stone-200 bg-white resize-none pr-12 ${
                    activeField === "action" ? "border-red-300 ring-1 ring-red-200" : ""
                  }`}
                />
                {activeField === "action" && (
                  <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    録音中…話しかけてください
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 保存ボタン */}
          <div className="pt-2 pb-8">
            <Button
              type="submit"
              disabled={status === "saving"}
              className="w-full h-14 text-base font-medium text-white rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed btn-terracotta"
            >
              {status === "saving" ? "保存中..." : "保存する"}
            </Button>
            {status === "success" && (
              <p className="mt-3 text-center text-sm text-emerald-700 font-medium">
                記録しました。あなたの気づきが、ここに積み上がっています。✨
              </p>
            )}
            {status === "error" && (
              <p className="mt-3 text-center text-sm text-red-500 font-medium">
                エラーが発生しました：{errorMessage}
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
