export type Material = {
  id: number;
  category: string;
  title: string | null;
  rating: number | null;
  created_at: string;
  summary: string | null;
  insight: string | null;
  action: string | null;
};

export type CategoryFilter =
  | "全て"
  | "本"
  | "映画"
  | "旅"
  | "セミナー"
  | "その他";
