"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Material } from "./types";

type Message = { role: "user" | "ai"; text: string };

const SESSION_KEY = (id: number) => `aigrill-${id}`;

type Props = { selected: Material | null };

export default function AiGrill({ selected }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [error, setError] = useState("");
  const [started, setStarted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // 素材が切り替わったら DB からセッションを復元
  useEffect(() => {
    if (!selected) {
      setMessages([]);
      setStarted(false);
      setError("");
      return;
    }

    let cancelled = false;
    setSessionLoading(true);
    setMessages([]);
    setStarted(false);
    setError("");
    setInput("");

    fetch(`/api/chat?materialId=${selected.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.success && Array.isArray(data.messages) && data.messages.length > 0) {
          setMessages(data.messages);
          setStarted(true);
          // sessionStorage も更新（MindMap / BlogStructure との互換）
          try {
            sessionStorage.setItem(SESSION_KEY(selected.id), JSON.stringify(data.messages));
          } catch {}
        }
      })
      .catch(() => {/* ネットワークエラーは無視して空状態で続行 */})
      .finally(() => {
        if (!cancelled) setSessionLoading(false);
      });

    return () => { cancelled = true; };
  }, [selected?.id]);

  // 新メッセージが追加されたら一番下にスクロール
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // DB と sessionStorage に保存（fire-and-forget）
  function saveSession(id: number, msgs: Message[]) {
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ materialId: id, messages: msgs }),
    }).catch(() => {});
    try {
      sessionStorage.setItem(SESSION_KEY(id), JSON.stringify(msgs));
    } catch {}
  }

  // API 呼び出し
  async function callApi(currentMessages: Message[]) {
    if (!selected) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/ai/grill", {
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
          messages: currentMessages,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error ?? "エラーが発生しました");
        return;
      }

      const aiMsg: Message = { role: "ai", text: data.reply };
      const next = [...currentMessages, aiMsg];
      setMessages(next);
      saveSession(selected.id, next);
    } catch {
      setError("ネットワークエラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  // 最初の深掘りを開始
  async function handleStart() {
    if (!selected) return;
    setStarted(true);
    await callApi([]);
  }

  // ユーザーメッセージを送信
  async function handleSend() {
    if (!input.trim() || loading || !selected) return;
    const userMsg: Message = { role: "user", text: input.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    saveSession(selected.id, next);
    setInput("");
    await callApi(next);
  }

  // Enter キーで送信（Shift+Enter で改行）
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // 会話リセット
  function handleReset() {
    if (!selected) return;
    // DB から削除（fire-and-forget）
    fetch(`/api/chat?materialId=${selected.id}`, { method: "DELETE" }).catch(() => {});
    sessionStorage.removeItem(SESSION_KEY(selected.id));
    setMessages([]);
    setStarted(false);
    setError("");
    setInput("");
  }

  if (!selected) {
    return (
      <div className="flex items-center justify-center h-full text-stone-400">
        <div className="text-center">
          <p className="text-5xl mb-4">🤖</p>
          <p className="text-base font-medium text-stone-500">素材を選択するとAIと深掘りできます</p>
          <p className="text-sm mt-1">← 左のリストから素材を選択してください</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* ヘッダー */}
      <div className="px-8 pt-5 pb-4 border-b border-stone-100 flex items-start justify-between">
        <div>
          <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">AIグリル</p>
          <h2 className="text-xl font-semibold text-stone-800">
            {selected.title || "（タイトルなし）"}
          </h2>
          {selected.summary && (
            <p className="text-sm text-stone-500 mt-1 line-clamp-2">{selected.summary}</p>
          )}
        </div>
        {started && (
          <button
            onClick={handleReset}
            className="text-xs text-stone-400 hover:text-stone-600 mt-1 shrink-0"
          >
            会話をリセット
          </button>
        )}
      </div>

      {/* チャットエリア */}
      <div className="flex-1 overflow-y-auto px-8 py-5 space-y-4">
        {sessionLoading && (
          <div className="flex justify-center py-8">
            <span className="text-stone-400 text-sm animate-pulse">会話履歴を読み込み中...</span>
          </div>
        )}

        {!sessionLoading && !started && (
          <div className="text-center py-12 text-stone-400">
            <p className="text-4xl mb-3">💬</p>
            <p className="text-sm">「AIと深掘りする」を押して会話を始めましょう</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-stone-800 text-white rounded-br-sm"
                  : "bg-stone-100 text-stone-700 rounded-bl-sm"
              }`}
            >
              {msg.role === "ai" && (
                <p className="text-xs font-semibold text-stone-400 mb-1.5">🤖 AI</p>
              )}
              {msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-stone-100 rounded-2xl rounded-bl-sm px-4 py-3">
              <span className="text-stone-400 text-sm animate-pulse">考え中...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center">
            <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
              ⚠️ {error}
            </p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* 入力エリア */}
      <div className="px-8 pb-6 pt-3 border-t border-stone-100">
        {!started ? (
          <Button
            onClick={handleStart}
            disabled={loading}
            className="w-full h-12 bg-stone-800 hover:bg-stone-700 text-white rounded-xl"
          >
            {loading ? "接続中..." : "🤖 AIと深掘りする"}
          </Button>
        ) : (
          <div className="flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="返答を入力… (Enter で送信 / Shift+Enter で改行)"
              disabled={loading}
              className="flex-1 min-h-[48px] max-h-32 resize-none text-sm border-stone-200 focus:border-stone-400"
              rows={1}
            />
            <Button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="h-12 px-5 bg-stone-800 hover:bg-stone-700 text-white rounded-xl shrink-0"
            >
              送信
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
