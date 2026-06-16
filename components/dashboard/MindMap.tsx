"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import type { Material } from "./types";

// ── 型 ──────────────────────────────────────────
type MindMapData = {
  center: string;
  branches: { label: string; children: string[] }[];
};

// ── SVG レイアウト定数（左右水平レイアウト） ────
const W = 1200;
const H = 760;
const CX = W / 2;
const CY = H / 2;

const BRANCH_X = 220;
const CHILD_X = 190;
const CHILD_V_SPACING = 46;
const BRANCH_GAP = 36;

// ── カラーパレット ────────────────────────────────
const PALETTE = [
  { fill: "#fef3c7", stroke: "#d97706", text: "#92400e" },
  { fill: "#dbeafe", stroke: "#3b82f6", text: "#1e3a8a" },
  { fill: "#d1fae5", stroke: "#10b981", text: "#065f46" },
  { fill: "#ede9fe", stroke: "#8b5cf6", text: "#4c1d95" },
  { fill: "#ffe4e6", stroke: "#f43f5e", text: "#9f1239" },
];

// ── SVGテキスト ───────────────────────────────────
function SvgText({ text, x, y, maxW, fontSize, fill }: {
  text: string; x: number; y: number; maxW: number; fontSize: number; fill: string;
}) {
  const approxCharW = fontSize * 0.95;
  const maxChars = Math.floor(maxW / approxCharW);
  if (text.length <= maxChars) {
    return (
      <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize={fontSize} fill={fill}>
        {text}
      </text>
    );
  }
  const mid = Math.ceil(text.length / 2);
  const lh = fontSize * 1.35;
  return (
    <text textAnchor="middle" fontSize={fontSize} fill={fill}>
      <tspan x={x} y={y - lh / 2} dominantBaseline="middle">{text.slice(0, mid)}</tspan>
      <tspan x={x} y={y + lh / 2} dominantBaseline="middle">{text.slice(mid)}</tspan>
    </text>
  );
}

// ── レイアウト計算 ────────────────────────────────
type ChildPos = { label: string; x: number; y: number };
type BranchPos = {
  label: string; x: number; y: number; side: "left" | "right";
  children: ChildPos[]; paletteIdx: number;
};

function computeLayout(data: MindMapData): BranchPos[] {
  const n = data.branches.length;
  const rightCount = Math.ceil(n / 2);

  function layoutGroup(branches: typeof data.branches, side: "left" | "right", paletteOffset: number): BranchPos[] {
    const heights = branches.map((b) => Math.max(50, b.children.length * CHILD_V_SPACING));
    const totalH = heights.reduce((a, b) => a + b, 0) + (branches.length - 1) * BRANCH_GAP;
    let curY = CY - totalH / 2;
    return branches.map((branch, i) => {
      const h = heights[i];
      const by = curY + h / 2;
      curY += h + BRANCH_GAP;
      const bx = side === "right" ? CX + BRANCH_X : CX - BRANCH_X;
      const cx = side === "right" ? bx + CHILD_X : bx - CHILD_X;
      const nc = branch.children.length;
      const children: ChildPos[] = branch.children.map((child, j) => ({
        label: child, x: cx, y: by + (j - (nc - 1) / 2) * CHILD_V_SPACING,
      }));
      return { label: branch.label, x: bx, y: by, side, children, paletteIdx: paletteOffset + i };
    });
  }

  return [
    ...layoutGroup(data.branches.slice(0, rightCount), "right", 0),
    ...layoutGroup(data.branches.slice(rightCount), "left", rightCount),
  ];
}

// ── SVG マインドマップ ────────────────────────────
function MindMapSvg({ data }: { data: MindMapData }) {
  const layout = computeLayout(data);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet"
      style={{ maxHeight: "100%", maxWidth: "100%" }}>
      {layout.map((branch, i) => {
        const p = PALETTE[branch.paletteIdx % PALETTE.length];
        const startX = branch.side === "right" ? CX + 70 : CX - 70;
        const endX = branch.side === "right" ? branch.x - 58 : branch.x + 58;
        const mx = (startX + endX) / 2;
        return (
          <path key={`cb-${i}`}
            d={`M ${startX} ${CY} C ${mx} ${CY}, ${mx} ${branch.y}, ${endX} ${branch.y}`}
            stroke={p.stroke} strokeWidth={1.8} strokeOpacity={0.5} fill="none" />
        );
      })}
      {layout.map((branch, bi) => {
        const p = PALETTE[branch.paletteIdx % PALETTE.length];
        const nc = branch.children.length;
        if (nc === 0) return null;
        const branchEdge = branch.side === "right" ? branch.x + 58 : branch.x - 58;
        const childEdge = branch.side === "right" ? branch.children[0].x - 53 : branch.children[0].x + 53;
        const jx = (branchEdge + childEdge) / 2;
        const topY = branch.children[0].y;
        const bottomY = branch.children[nc - 1].y;
        return (
          <g key={`conn-${bi}`} stroke={p.stroke} strokeWidth={1.5} fill="none">
            <line x1={branchEdge} y1={branch.y} x2={jx} y2={branch.y} />
            {nc > 1 && <line x1={jx} y1={topY} x2={jx} y2={bottomY} />}
            {branch.children.map((child, ci) => (
              <line key={ci} x1={jx} y1={child.y} x2={childEdge} y2={child.y} />
            ))}
          </g>
        );
      })}
      {layout.map((branch) => {
        const p = PALETTE[branch.paletteIdx % PALETTE.length];
        return branch.children.map((child, ci) => (
          <g key={`child-${branch.paletteIdx}-${ci}`}>
            <rect x={child.x - 53} y={child.y - 17} width={106} height={34} rx={10}
              fill={p.fill} stroke={p.stroke} strokeWidth={1.5} />
            <SvgText text={child.label} x={child.x} y={child.y} maxW={96} fontSize={11} fill={p.text} />
          </g>
        ));
      })}
      {layout.map((branch) => {
        const p = PALETTE[branch.paletteIdx % PALETTE.length];
        return (
          <g key={`branch-${branch.paletteIdx}`}>
            <rect x={branch.x - 58} y={branch.y - 19} width={116} height={38} rx={12}
              fill={p.fill} stroke={p.stroke} strokeWidth={2} />
            <SvgText text={branch.label} x={branch.x} y={branch.y} maxW={106} fontSize={12} fill={p.text} />
          </g>
        );
      })}
      <rect x={CX - 70} y={CY - 22} width={140} height={44} rx={22} fill="#292524" />
      <SvgText text={data.center} x={CX} y={CY} maxW={126} fontSize={13} fill="white" />
    </svg>
  );
}

// ── メインコンポーネント ──────────────────────────
type Props = { selected: Material | null };

export default function MindMap({ selected }: Props) {
  const [mindmap, setMindmap] = useState<MindMapData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 素材が切り替わったらDBから読み込む
  useEffect(() => {
    setMindmap(null);
    setError("");
    if (!selected) return;

    (async () => {
      try {
        const res = await fetch(`/api/ai/mindmap?materialId=${selected.id}`);
        const data = await res.json();
        if (data.success && data.mindmap) {
          setMindmap(data.mindmap);
        }
      } catch {}
    })();
  }, [selected?.id]);

  async function handleGenerate() {
    if (!selected) return;
    setLoading(true);
    setError("");

    let grillMessages: unknown[] = [];
    try {
      const saved = sessionStorage.getItem(`aigrill-${selected.id}`);
      if (saved) grillMessages = JSON.parse(saved);
    } catch {}

    try {
      const res = await fetch("/api/ai/mindmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialId: selected.id,
          material: {
            title: selected.title,
            category: selected.category,
            summary: selected.summary,
            insight: selected.insight,
            action: selected.action,
          },
          grillMessages,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error ?? "生成に失敗しました");
        return;
      }
      setMindmap(data.mindmap);
    } catch {
      setError("ネットワークエラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  if (!selected) {
    return (
      <div className="flex items-center justify-center h-full text-stone-400">
        <div className="text-center">
          <p className="text-5xl mb-4">🗺️</p>
          <p className="text-base font-medium text-stone-500">素材を選択するとマインドマップを作成できます</p>
          <p className="text-sm mt-1">← 左のリストから素材を選択してください</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-8 pt-6 pb-4 border-b border-stone-100">
        <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">マインドマップ</p>
        <h2 className="text-xl font-semibold text-stone-800">{selected.title || "（タイトルなし）"}</h2>
      </div>

      <div className="flex-1 overflow-auto px-4 py-6 flex items-center justify-center">
        {loading ? (
          <div className="text-center text-stone-400">
            <p className="text-4xl mb-4 animate-pulse">✨</p>
            <p className="text-sm">生成中...</p>
          </div>
        ) : !mindmap ? (
          <div className="text-center text-stone-400">
            <p className="text-5xl mb-4">✨</p>
            <p className="text-sm">ボタンを押してマインドマップを生成</p>
            {grillHint(selected)}
          </div>
        ) : (
          <MindMapSvg data={mindmap} />
        )}
      </div>

      <div className="px-8 pb-6 pt-3 border-t border-stone-100">
        {error && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2 mb-3 text-center">
            ⚠️ {error}
          </p>
        )}
        <Button onClick={handleGenerate} disabled={loading}
          className="w-full h-12 bg-stone-800 hover:bg-stone-700 text-white rounded-xl">
          {loading ? "生成中..." : mindmap ? "🔄 再生成する" : "🗺️ マインドマップを生成"}
        </Button>
      </div>
    </div>
  );
}

function grillHint(selected: Material) {
  try {
    const saved = sessionStorage.getItem(`aigrill-${selected.id}`);
    if (saved) {
      const msgs = JSON.parse(saved);
      if (Array.isArray(msgs) && msgs.length > 0) {
        return <p className="text-xs text-stone-400 mt-2">💬 AIグリルの会話履歴も反映されます</p>;
      }
    }
  } catch {}
  return null;
}