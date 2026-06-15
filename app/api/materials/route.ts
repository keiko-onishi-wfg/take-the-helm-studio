import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT id, category, title, rating, created_at, summary, insight, action
      FROM blog_materials
      ORDER BY created_at DESC
    `;
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("[GET /api/materials]", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "取得に失敗しました",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  console.log('ENV CHECK:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
  try {
    const body = await req.json();
    const { category, title, date, rating, summary, insight, action } = body;

    if (!category) {
      return NextResponse.json(
        { success: false, error: "カテゴリーは必須です" },
        { status: 400 }
      );
    }

    const sql = getDb();
    const result = await sql`
      INSERT INTO blog_materials
        (category, title, created_at, rating, summary, insight, action, updated_at)
      VALUES (
        ${category},
        ${title ?? null},
        ${date ? new Date(date) : new Date()},
        ${rating > 0 ? rating : null},
        ${summary || null},
        ${insight || null},
        ${action || null},
        NOW()
      )
      RETURNING id
    `;

    return NextResponse.json({ success: true, id: result[0].id });
  } catch (error) {
    console.error("[POST /api/materials]", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "保存に失敗しました",
      },
      { status: 500 }
    );
  }
}
