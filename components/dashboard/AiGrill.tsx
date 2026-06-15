"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Material } from "./types";

type Message = { role: "user" | "ai"; text: string };

const DUMMY_RESPONSES = [
  "この素材の核心にある問いは何でしょう？もう少し掘り下げてみましょう。",
  "著者はなぜこの結論に至ったのか、背景にある前提を探ってみると面白いですよ。",
  "あなたの「気づき」と「アクション」の間にある、見えていないステップは何ですか？",
  "この学びを3年後の自分に伝えるとしたら、どう要約しますか？",
];

type Props = { selected: Material | null };

export default function AiGrill({ selected }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [drilling, setDrilling] = useState(false);

  function handleDrill() {
    if (!selected) return;
    setDrilling(true);

    const userMsg: Message = {
      role: "user",
      text: `「${selected.title || "この素材"}」についてAIと深掘りします`,
    };
    const aiMsg: Message = {
      role: "ai",
      text: DUMMY_RESPONSES[messages.length % DUMMY_RESPONSES.length],
    };

    setTimeout(() => {
      setMessages((prev) => [...prev, userMsg, aiMsg]);
      setDrilling(false);
    }, 800);
  }

  if (!selected) {
    return (
      <EmptyState icon="🤖" message="素材を選択するとAIと深掘りできます" />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 素材概要 */}
      <div className="px-8 pt-6 pb-4 border-b border-stone-100">
        <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">AIグリル</p>
        <h2 className="text-xl font-semibold text-stone-800">
          {selected.title || "（タイトルなし）"}
        </h2>
        {selected.summary && (
          <p className="text-sm text-stone-500 mt-2 line-clamp-2">{selected.summary}</p>
        )}
      </div>

      {/* チャット */}
      <div className="flex-1 overflow-y-auto px-8 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12 text-stone-400">
            <p className="text-3xl mb-3">💬</p>
            <p className="text-sm">「AIと深掘りする」を押して会話を始めましょう</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "bg-stone-800 text-white rounded-br-sm"
                  : "bg-stone-100 text-stone-700 rounded-bl-sm"
              }`}
            >
              {msg.role === "ai" && (
                <p className="text-xs font-semibold text-stone-400 mb-1">AI</p>
              )}
              {msg.text}
            </div>
          </div>
        ))}
        {drilling && (
          <div className="flex justify-start">
            <div className="bg-stone-100 rounded-2xl rounded-bl-sm px-4 py-3">
              <span className="text-stone-400 text-sm animate-pulse">考え中...</span>
            </div>
          </div>
        )}
      </div>

      {/* アクションボタン */}
      <div className="px-8 pb-6 pt-3 border-t border-stone-100">
        <Button
          onClick={handleDrill}
          disabled={drilling}
          className="w-full h-12 bg-stone-800 hover:bg-stone-700 text-white rounded-xl"
        >
          {drilling ? "深掘り中..." : "🤖 AIと深掘りする"}
        </Button>
        <p className="text-xs text-stone-400 text-center mt-2">
          ※ 現在はダミーレスポンスです
        </p>
      </div>
    </div>
  );
}

function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div className="flex items-center justify-center h-full text-stone-400">
      <div className="text-center">
        <p className="text-5xl mb-4">{icon}</p>
        <p className="text-base font-medium text-stone-500">{message}</p>
        <p className="text-sm mt-1">← 左のリストから素材を選択してください</p>
      </div>
    </div>
  );
}
