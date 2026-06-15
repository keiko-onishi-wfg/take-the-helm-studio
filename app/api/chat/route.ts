import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const materialId = req.nextUrl.searchParams.get("materialId");
  if (!materialId || isNaN(Number(materialId))) {
    return NextResponse.json(
      { success: false, error: "materialId が不正です" },
      { status: 400 }
    );
  }

  try {
    const sql = getDb();
    const rows = await sql`
      SELECT messages FROM chat_sessions
      WHERE material_id = ${Number(materialId)}
    `;
    const messages = rows[0]?.messages ?? [];
    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error("[GET /api/chat]", error);
    return NextResponse.json(
      { success: false, error: "会話履歴の取得に失敗しました" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "リクエストの形式が正しくありません" },
      { status: 400 }
    );
  }

  const { materialId, messages } = body as Record<string, unknown>;

  if (!materialId || isNaN(Number(materialId))) {
    return NextResponse.json(
      { success: false, error: "materialId が不正です" },
      { status: 400 }
    );
  }
  if (!Array.isArray(messages)) {
    return NextResponse.json(
      { success: false, error: "messages の形式が正しくありません" },
      { status: 400 }
    );
  }

  try {
    const sql = getDb();
    await sql`
      INSERT INTO chat_sessions (material_id, messages, updated_at)
      VALUES (${Number(materialId)}, ${JSON.stringify(messages)}, NOW())
      ON CONFLICT (material_id)
      DO UPDATE SET messages = EXCLUDED.messages, updated_at = NOW()
    `;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/chat]", error);
    return NextResponse.json(
      { success: false, error: "会話履歴の保存に失敗しました" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const materialId = req.nextUrl.searchParams.get("materialId");
  if (!materialId || isNaN(Number(materialId))) {
    return NextResponse.json(
      { success: false, error: "materialId が不正です" },
      { status: 400 }
    );
  }

  try {
    const sql = getDb();
    await sql`
      DELETE FROM chat_sessions WHERE material_id = ${Number(materialId)}
    `;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/chat]", error);
    return NextResponse.json(
      { success: false, error: "会話履歴の削除に失敗しました" },
      { status: 500 }
    );
  }
}
