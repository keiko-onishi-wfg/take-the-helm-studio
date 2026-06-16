import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { saveMindMap, loadMindMap, initMindMapTable } from "@/lib/db";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `あなたは思考整理の専門家です。
与えられた素材情報とAIグリルの会話から、洞察を整理したマインドマップをJSON形式で生成してください。

以下のフォーマットのJSONのみを返してください。マークダウンのコードブロックや説明文は一切含めないでください：
{"center":"中心テーマ","branches":[{"label":"ブランチ名","children":["子ノード1","子ノード2"]}]}

制約：
- center は 15 文字以内
- branches は 3〜5 個
- label は 10 文字以内
- children は各 2〜4 個、各 15 文字以内
- すべて日本語で`;

type GrillMessage = { role: "user" | "ai"; text: string };

export type MindMapData = {
  center: string;
  branches: { label: string; children: string[] }[];
};

function buildContext(
  material: Record<string, unknown>,
  grillMessages: GrillMessage[]
): string {
  const lines: string[] = [
    "【素材情報】",
    `タイトル：${material.title ?? "（なし）"}`,
    `カテゴリー：${material.category ?? "（なし）"}`,
    ...(material.summary ? [`概要：${material.summary}`] : []),
    ...(material.insight ? [`気づき：${material.insight}`] : []),
    ...(material.action ? [`アクション：${material.action}`] : []),
  ];

  if (grillMessages.length > 0) {
    lines.push("", "【AIグリル会話（抜粋）】");
    grillMessages.slice(-10).forEach((msg) => {
      lines.push(`${msg.role === "ai" ? "AI" : "ユーザー"}：${msg.text}`);
    });
  }

  return lines.join("\n");
}

function validateMindMap(data: unknown): data is MindMapData {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  if (typeof d.center !== "string") return false;
  if (!Array.isArray(d.branches)) return false;
  return d.branches.every(
    (b) =>
      b &&
      typeof b === "object" &&
      typeof (b as Record<string, unknown>).label === "string" &&
      Array.isArray((b as Record<string, unknown>).children)
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const materialId = Number(searchParams.get("materialId"));
  if (!materialId) {
    return NextResponse.json({ success: false, error: "materialId が必要です" }, { status: 400 });
  }
  try {
    await initMindMapTable();
    const mindmap = await loadMindMap(materialId);
    return NextResponse.json({ success: true, mindmap });
  } catch (error) {
    console.error("[GET /api/ai/mindmap]", error);
    return NextResponse.json({ success: false, error: "読み込みに失敗しました" }, { status: 500 });
  }
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

  const { material, grillMessages, materialId } = body as Record<string, unknown>;

  if (!material || typeof material !== "object") {
    return NextResponse.json(
      { success: false, error: "素材データが不正です" },
      { status: 400 }
    );
  }

  const messages = Array.isArray(grillMessages)
    ? (grillMessages as GrillMessage[])
    : [];

  try {
    const context = buildContext(material as Record<string, unknown>, messages);

    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: context }],
    });

    const firstBlock = response.content[0];
    const rawText = firstBlock?.type === "text" ? firstBlock.text : "";

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { success: false, error: "マインドマップの生成に失敗しました" },
        { status: 500 }
      );
    }

    let mindmap: unknown;
    try {
      mindmap = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json(
        { success: false, error: "マインドマップの解析に失敗しました" },
        { status: 500 }
      );
    }

    if (!validateMindMap(mindmap)) {
      return NextResponse.json(
        { success: false, error: "マインドマップの形式が正しくありません" },
        { status: 500 }
      );
    }

    // DBに保存
    if (typeof materialId === "number") {
      await initMindMapTable();
      await saveMindMap(materialId, mindmap);
    }

    return NextResponse.json({ success: true, mindmap });
  } catch (error) {
    console.error("[POST /api/ai/mindmap]", error);
    return NextResponse.json(
      { success: false, error: "マインドマップの生成に失敗しました" },
      { status: 500 }
    );
  }
}