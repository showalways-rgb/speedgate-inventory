"use client";

interface StockItem {
  itemId: number;
  itemName: string;
  totalIn: number;
  totalOut: number;
  currentStock: number;
  virtualOut?: boolean;
  outOrderCount?: number;
}

interface Props {
  data: StockItem[];
}

const STOCK_BLUE = "#5b6ee8";
const OUT_GREEN = "#48bb78";
const MUTED_GRAY = "#cbd5e0";
const NUM_MUTED = "#718096";

function LegendSwatch({ color }: { color: string }) {
  return (
    <span
      style={{
        width: "12px",
        height: "12px",
        borderRadius: "2px",
        backgroundColor: color,
        flexShrink: 0,
      }}
    />
  );
}

export default function StockChart({ data }: Props) {
  if (!data.length) {
    return (
      <div style={{ textAlign: "center", padding: "48px 0", color: "var(--muted)", fontSize: "14px" }}>
        거래 내역이 없습니다.
      </div>
    );
  }

  const totals = data.map((d) => ({
    cs: Math.max(0, d.currentStock ?? 0),
    out: Math.max(0, d.totalOut ?? 0),
  }));
  const maxBarTotal = Math.max(...totals.map((t) => t.cs + t.out), 1);

  const rowFlex: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "10px",
  };

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <div style={{ display: "flex", gap: "20px", marginBottom: "16px", fontSize: "12px", flexWrap: "wrap" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <LegendSwatch color={STOCK_BLUE} /> 현재고
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <LegendSwatch color={OUT_GREEN} /> 출고 (수량)
        </span>
      </div>

      {data.map((item) => {
        const totalIn = item.totalIn ?? 0;
        const totalOut = item.totalOut ?? 0;
        const currentStock = item.currentStock ?? 0;
        const cs = Math.max(0, currentStock);
        const out = Math.max(0, totalOut);
        const barSum = cs + out;
        const emptyRow = totalIn === 0 && totalOut === 0;

        if (emptyRow) {
          return (
            <div key={item.itemId} style={rowFlex}>
              <div
                title={item.itemName}
                style={{
                  width: "160px",
                  textAlign: "right",
                  fontSize: "13px",
                  flexShrink: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {item.itemName}
              </div>
              <span style={{ fontSize: "12px", color: MUTED_GRAY }}>입고 없음</span>
            </div>
          );
        }

        const barScale = Math.min(100, (barSum / maxBarTotal) * 100);
        const inPct = barSum <= 0 ? 0 : (cs / barSum) * 100;
        const outPct = barSum <= 0 ? 0 : (out / barSum) * 100;

        return (
          <div key={item.itemId} style={rowFlex}>
            <div
              title={item.itemName}
              style={{
                width: "160px",
                textAlign: "right",
                fontSize: "13px",
                flexShrink: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {item.itemName}
            </div>

            <div style={{ flex: 1, minWidth: "80px" }}>
              <div
                style={{
                  width: `${barScale}%`,
                  maxWidth: "100%",
                  display: "flex",
                  alignItems: "stretch",
                  height: "20px",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                {cs > 0 && (
                  <div style={{ flex: `${inPct} 1 0%`, minWidth: 0, backgroundColor: STOCK_BLUE }} />
                )}
                {out > 0 && (
                  <div style={{ flex: `${outPct} 1 0%`, minWidth: 0, backgroundColor: OUT_GREEN }} />
                )}
              </div>
            </div>

            <div style={{ fontSize: "12px", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
              <span style={{ color: cs === 0 && out > 0 ? "#dc2626" : NUM_MUTED }}>{cs}</span>
              {out > 0 && <span style={{ color: OUT_GREEN }}>{` / ${out}`}</span>}
              <span style={{ color: MUTED_GRAY }}>{` (총입고 ${totalIn})`}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
