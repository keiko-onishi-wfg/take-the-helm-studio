import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `あなたはTake The Helmというブログの編集パートナーです。
読者は40代以上の知的な日本人女性です。
素材（本・映画・旅・セミナーなど）から、読者の人生に役立つ気づきを引き出すために
深掘りする質問を投げかけてください。
西野亮廣の「誰の何の問題を解決するか」という視点を常に意識してください。
日本語で回答してください。`;

type IncomingMessage = { role: "user" | "ai"; text: string };

function toAnthropicMessages(
  messages: IncomingMessage[]
): Anthropic.MessageParam[] {
  return messages.map((m) => ({
    role: m.role === "ai" ? "assistant" : "user",
    content: m.text,
  }));
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "ANTHROPIC_API_KEY が設定されていません" },
      { status: 500 }
    );
  }

  try {
    const { material, messages } = await req.json();

    const anthropicMessages = toAnthropicMessages(messages);

    // 初回：素材の内容をユーザーメッセージとして追加
    if (anthropicMessages.length === 0) {
      const context = [
        `タイトル：${material.title ?? "（なし）"}`,
        `カテゴリー：${material.category ?? "（なし）"}`,
        material.summary ? `概要：${material.summary}` : null,
        material.insight ? `気づき：${material.insight}` : null,
        material.action ? `アクション：${material.action}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      anthropicMessages.push({
        role: "user",
        content: `以下の素材について深掘りしてください。まず、最も重要だと思うポイントについて質問を1つ投げかけてください。\n\n${context}`,
      });
    }

    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: anthropicMessages,
    });

    const reply =
      response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ success: true, reply });
  } catch (error) {
    console.error("[POST /api/ai/grill]", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "AIの応答に失敗しました",
      },
      { status: 500 }
    );
  }
}
