import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `あなたはTake The Helmというブログの編集パートナーです。
読者は40代以上の知的な日本人女性です。
素材（本・映画・旅・セミナーなど）から、読者の人生に役立つ気づきを引き出すために
深掘りする質問を投げかけてください。
西野亮廣の「誰の何の問題を解決するか」という視点を常に意識してください。
日本語で回答してください。`;

const MAX_MESSAGES = 20;
const MAX_FIELD_LENGTH = 1000;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type IncomingMessage = { role: "user" | "ai"; text: string };

function toAnthropicMessages(
  messages: IncomingMessage[]
): Anthropic.MessageParam[] {
  return messages.map((m) => ({
    role: m.role === "ai" ? "assistant" : "user",
    content: m.text,
  }));
}

function truncate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return value.slice(0, MAX_FIELD_LENGTH) || null;
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { success: false, error: "ANTHROPIC_API_KEY が設定されていません" },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "リクエストの形式が正しくありません" },
      { status: 400 }
    );
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { success: false, error: "リクエストの形式が正しくありません" },
      { status: 400 }
    );
  }

  const { material, messages } = body as Record<string, unknown>;

  if (!material || typeof material !== "object") {
    return NextResponse.json(
      { success: false, error: "素材データが不正です" },
      { status: 400 }
    );
  }

  if (!Array.isArray(messages)) {
    return NextResponse.json(
      { success: false, error: "メッセージの形式が正しくありません" },
      { status: 400 }
    );
  }

  if (messages.length > MAX_MESSAGES) {
    return NextResponse.json(
      { success: false, error: "メッセージ数が上限を超えています" },
      { status: 400 }
    );
  }

  try {
    const mat = material as Record<string, unknown>;
    const sanitizedMaterial = {
      title: truncate(mat.title),
      category: truncate(mat.category),
      summary: truncate(mat.summary),
      insight: truncate(mat.insight),
      action: truncate(mat.action),
    };

    const anthropicMessages = toAnthropicMessages(messages as IncomingMessage[]);

    // 初回：素材の内容をユーザーメッセージとして追加
    if (anthropicMessages.length === 0) {
      const context = [
        `タイトル：${sanitizedMaterial.title ?? "（なし）"}`,
        `カテゴリー：${sanitizedMaterial.category ?? "（なし）"}`,
        sanitizedMaterial.summary ? `概要：${sanitizedMaterial.summary}` : null,
        sanitizedMaterial.insight ? `気づき：${sanitizedMaterial.insight}` : null,
        sanitizedMaterial.action ? `アクション：${sanitizedMaterial.action}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      anthropicMessages.push({
        role: "user",
        content: `以下の素材について深掘りしてください。まず、最も重要だと思うポイントについて質問を1つ投げかけてください。\n\n${context}`,
      });
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: anthropicMessages,
    });

    const firstBlock = response.content[0];
    const reply = firstBlock?.type === "text" ? firstBlock.text : "";

    return NextResponse.json({ success: true, reply });
  } catch (error) {
    console.error("[POST /api/ai/grill]", error);
    return NextResponse.json(
      { success: false, error: "AIの応答に失敗しました" },
      { status: 500 }
    );
  }
}
