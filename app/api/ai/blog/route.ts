import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `あなたはTake The Helmブログ（対象：40代以上の知的な日本人女性）のSEOプロマーケターです。
素材・気づき・マインドマップをもとに、以下のJSON形式でブログ構成を返してください。
西野亮廣の「誰の何の問題を解決するか」を必ず意識してください。

以下のJSONのみを返してください。マークダウンのコードブロックや説明文は一切含めないでください：
{"title_ja":"日本語タイトル（30文字以内）","title_en":"English title","target":"誰の何の問題を解決するか（1文）","hook":"つかみ・導入（2〜3文）","sections":[{"h2":"見出し","points":["ポイント1","ポイント2"]}],"conclusion":"まとめ（2文）","cta":"読者への問いかけ・行動促進（1文）","seo_check":{"target_clear":true,"hook_impact":true,"keyword_included":true,"cta_clear":true,"title_under_30":true}}

制約：
- sections は 3〜4 個
- 各 section の points は 2〜3 個
- すべて日本語で（title_en のみ英語）`;

type GrillMessage = { role: "user" | "ai"; text: string };

export type BlogData = {
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

function buildContext(
  material: Record<string, unknown>,
  grillMessages: GrillMessage[],
  mindmapData: Record<string, unknown> | null
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
    grillMessages.slice(-8).forEach((msg) => {
      lines.push(`${msg.role === "ai" ? "AI" : "ユーザー"}：${msg.text}`);
    });
  }

  if (mindmapData && typeof mindmapData.center === "string") {
    lines.push("", "【マインドマップ】");
    lines.push(`中心テーマ：${mindmapData.center}`);
    if (Array.isArray(mindmapData.branches)) {
      (mindmapData.branches as { label: string; children: string[] }[]).forEach(
        (b) => {
          lines.push(`ブランチ：${b.label} → ${(b.children ?? []).join("、")}`);
        }
      );
    }
  }

  return lines.join("\n");
}

function validateBlogData(data: unknown): data is BlogData {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.title_ja === "string" &&
    typeof d.title_en === "string" &&
    typeof d.target === "string" &&
    typeof d.hook === "string" &&
    Array.isArray(d.sections) &&
    typeof d.conclusion === "string" &&
    typeof d.cta === "string" &&
    d.seo_check !== null &&
    typeof d.seo_check === "object"
  );
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

  const { material, grillMessages, mindmapData } = body as Record<
    string,
    unknown
  >;

  if (!material || typeof material !== "object") {
    return NextResponse.json(
      { success: false, error: "素材データが不正です" },
      { status: 400 }
    );
  }

  const messages = Array.isArray(grillMessages)
    ? (grillMessages as GrillMessage[])
    : [];

  const mindmap =
    mindmapData && typeof mindmapData === "object"
      ? (mindmapData as Record<string, unknown>)
      : null;

  try {
    const context = buildContext(
      material as Record<string, unknown>,
      messages,
      mindmap
    );

    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: context }],
    });

    const firstBlock = response.content[0];
    const rawText = firstBlock?.type === "text" ? firstBlock.text : "";

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[blog] No JSON in response:", rawText);
      return NextResponse.json(
        { success: false, error: "ブログ構成の生成に失敗しました" },
        { status: 500 }
      );
    }

    let blogData: unknown;
    try {
      blogData = JSON.parse(jsonMatch[0]);
    } catch {
      console.error("[blog] JSON parse error:", jsonMatch[0]);
      return NextResponse.json(
        { success: false, error: "ブログ構成の解析に失敗しました" },
        { status: 500 }
      );
    }

    if (!validateBlogData(blogData)) {
      return NextResponse.json(
        { success: false, error: "ブログ構成の形式が正しくありません" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, blog: blogData });
  } catch (error) {
    console.error("[POST /api/ai/blog]", error);
    return NextResponse.json(
      { success: false, error: "ブログ構成の生成に失敗しました" },
      { status: 500 }
    );
  }
}
