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

const STOCK_BAR = "#5b6ee8";
const OUT_GREEN = "#48bb78";
const TRACK_BG = "#f1f5f9";
const SEPARATOR = "#cbd5e1";

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
      <span
        style={{
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          backgroundColor: color,
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: "11px", color: "var(--muted)" }}>{label}</span>
    </span>
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

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "16px",
          gap: "12px",
        }}
      >
        <div style={{ flex: "1", minWidth: 0 }} />
        <div style={{ display: "flex", gap: "20px", flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <LegendItem color={STOCK_BAR} label="현재고" />
          <LegendItem color={OUT_GREEN} label="출고 (수량)" />
        </div>
      </div>

      {data.map((item) => {
        const totalIn = item.totalIn ?? 0;
        const totalOut = item.totalOut ?? 0;
        const cs = Math.max(0, item.currentStock ?? 0);
        const out = Math.max(0, totalOut);
        const barSum = cs + out;
        const emptyRow = totalIn === 0 && totalOut === 0;

        if (emptyRow) {
          return (
            <div
              key={item.itemId}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <div
                title={item.itemName}
                style={{
                  width: "140px",
                  flexShrink: 0,
                  fontSize: "12px",
                  color: "#cbd5e1",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {item.itemName}
              </div>
            </div>
          );
        }

        const barScale = barSum <= 0 ? 0 : Math.min(100, (barSum / maxBarTotal) * 100);
        const inPct = barSum <= 0 ? 0 : (cs / barSum) * 100;
        const outPct = barSum <= 0 ? 0 : (out / barSum) * 100;

        return (
          <div
            key={item.itemId}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "16px",
              height: "32px",
              boxSizing: "border-box",
            }}
          >
            <div
              title={item.itemName}
              style={{
                width: "140px",
                flexShrink: 0,
                fontSize: "13px",
                color: "var(--foreground)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {item.itemName}
            </div>

            <div
              style={{
                flex: 1,
                minWidth: "80px",
                height: "10px",
                position: "relative",
                alignSelf: "center",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  height: "10px",
                  backgroundColor: TRACK_BG,
                  borderRadius: "6px",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: `${barScale}%`,
                  maxWidth: "100%",
                  height: "10px",
                  borderRadius: "6px",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "stretch",
                  zIndex: 1,
                }}
              >
                {cs > 0 && (
                  <div style={{ flex: `${inPct} 1 0%`, minWidth: 0, backgroundColor: STOCK_BAR }} />
                )}
                {out > 0 && (
                  <div style={{ flex: `${outPct} 1 0%`, minWidth: 0, backgroundColor: OUT_GREEN }} />
                )}
              </div>
            </div>

            <div
              style={{
                fontSize: "12px",
                whiteSpace: "nowrap",
                fontVariantNumeric: "tabular-nums",
                flexShrink: 0,
                lineHeight: 1,
              }}
            >
              <span style={{ color: "var(--foreground)" }}>현재고 </span>
              <span style={{ color: cs === 0 ? "#dc2626" : "var(--primary)", fontWeight: 600 }}>{cs}</span>
              <span style={{ color: SEPARATOR }}> · </span>
              <span style={{ color: "var(--foreground)" }}>출고 </span>
              <span style={{ color: OUT_GREEN, fontWeight: 600 }}>{out}</span>
              {" "}
              <span style={{ fontSize: "11px", color: "var(--muted)" }}>(총입고 {totalIn})</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
