CREATE TABLE blog_materials (
  id          SERIAL PRIMARY KEY,
  category    TEXT NOT NULL,
  title       TEXT,
  rating      INTEGER CHECK (rating BETWEEN 1 AND 5),
  summary     TEXT,
  insight     TEXT,
  action      TEXT,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE blog_drafts (
  id              SERIAL PRIMARY KEY,
  material_id     INTEGER REFERENCES blog_materials(id),
  title_ja        TEXT,
  title_en        TEXT,
  structure_ja    TEXT,
  summary_en      TEXT,
  status          TEXT DEFAULT 'draft',
  created_at      TIMESTAMP DEFAULT NOW()
);
