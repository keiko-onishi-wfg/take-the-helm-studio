import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!id) return NextResponse.json({ success: false, error: "IDが不正です" }, { status: 400 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ success: false, error: "リクエストの形式が正しくありません" }, { status: 400 });
  }

  const { category, title, rating, summary, insight, action, created_at } = body as Record<string, unknown>;

  try {
    const sql = getDb();
    await sql`
      UPDATE blog_materials SET
        category   = ${category as string},
        title      = ${title as string},
        rating     = ${rating as number},
        summary    = ${summary as string},
        insight    = ${insight as string},
        action     = ${action as string},
        created_at = ${created_at as string},
        updated_at = NOW()
      WHERE id = ${id}
    `;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PUT /api/materials/[id]]", error);
    return NextResponse.json({ success: false, error: "更新に失敗しました" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!id) return NextResponse.json({ success: false, error: "IDが不正です" }, { status: 400 });

  try {
    const sql = getDb();
    await sql`DELETE FROM blog_materials WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/materials/[id]]", error);
    return NextResponse.json({ success: false, error: "削除に失敗しました" }, { status: 500 });
  }
}