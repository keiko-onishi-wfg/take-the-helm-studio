import { neon } from '@neondatabase/serverless';

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set in environment variables');
  }
  return neon(url);
}
export async function initMindMapTable() {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS mindmap_sessions (
      id SERIAL PRIMARY KEY,
      material_id INTEGER NOT NULL UNIQUE,
      mindmap JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export async function saveMindMap(materialId: number, mindmap: unknown) {
  const sql = getDb();
  await sql`
    INSERT INTO mindmap_sessions (material_id, mindmap, updated_at)
    VALUES (${materialId}, ${JSON.stringify(mindmap)}, NOW())
    ON CONFLICT (material_id)
    DO UPDATE SET mindmap = ${JSON.stringify(mindmap)}, updated_at = NOW()
  `;
}

export async function loadMindMap(materialId: number) {
  const sql = getDb();
  const rows = await sql`
    SELECT mindmap FROM mindmap_sessions WHERE material_id = ${materialId}
  `;
  return rows.length > 0 ? rows[0].mindmap : null;
}