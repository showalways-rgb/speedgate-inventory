"use client";

interface StockItem {
  itemId: number;
  itemName: string;
  totalIn: number;
  totalOut: number;
  currentStock: number;
}

interface Props { data: StockItem[] }

export default function StockChart({ data }: Props) {
  if (!data.length) {
    return (
      <div style={{ textAlign: "center", padding: "48px 0", color: "var(--muted)", fontSize: "14px" }}>
        거래 내역이 없습니다.
      </div>
    );
  }

  const hasData = data.some((d) => d.totalIn > 0);
  if (!hasData) {
    return (
      <div style={{ textAlign: "center", padding: "48px 0", color: "var(--muted)", fontSize: "14px" }}>
        입고 내역이 없습니다.
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.totalIn), 1);

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ minWidth: "480px" }}>
        <div style={{ display: "flex", gap: "20px", marginBottom: "16px", flexWrap: "wrap" }}>
          {[
            { color: "#a0aec0", label: "현재고" },
            { color: "#48bb78", label: "출고" },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--muted)" }}>
              <div style={{ width: "12px", height: "12px", background: color, borderRadius: "2px" }} />
              {label}
            </div>
          ))}
        </div>

        {data.map((item) => {
          if (item.totalIn === 0) return (
            <div key={item.itemId} style={{ display: "flex", alignItems: "center", marginBottom: "10px", gap: "10px" }}>
              <div style={{
                width: "160px", flexShrink: 0, fontSize: "13px", color: "var(--foreground)",
                textAlign: "right", paddingRight: "8px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {item.itemName}
              </div>
              <span style={{ fontSize: "12px", color: "#cbd5e0" }}>입고 없음</span>
            </div>
          );

          const barW = (item.totalIn / maxVal) * 100;
          const stockRatio = item.totalIn > 0 ? item.currentStock / item.totalIn : 0;
          const outRatio = item.totalIn > 0 ? item.totalOut / item.totalIn : 0;

          return (
            <div key={item.itemId} style={{ display: "flex", alignItems: "center", marginBottom: "10px", gap: "10px" }}>
              <div style={{
                width: "160px", flexShrink: 0, fontSize: "13px", color: "var(--foreground)",
                textAlign: "right", paddingRight: "8px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {item.itemName}
              </div>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                <div style={{ width: `${barW}%`, height: "20px", borderRadius: "4px", overflow: "hidden", display: "flex", minWidth: "4px" }}>
                  {stockRatio > 0 && (
                    <div title={`현재고: ${item.currentStock}`} style={{ width: `${stockRatio * 100}%`, height: "100%", background: "#a0aec0" }} />
                  )}
                  {outRatio > 0 && (
                    <div title={`출고: ${item.totalOut}`} style={{ width: `${outRatio * 100}%`, height: "100%", background: "#48bb78" }} />
                  )}
                </div>
                <span style={{ fontSize: "12px", color: "var(--muted)", whiteSpace: "nowrap" }}>
                  {item.currentStock > 0 && <span style={{ color: "#718096" }}>{item.currentStock} </span>}
                  {item.totalOut > 0 && <span style={{ color: "#48bb78" }}>/ {item.totalOut}</span>}
                  <span style={{ color: "#cbd5e0", marginLeft: "2px" }}>({item.totalIn})</span>
                </span>
              </div>
            </div>
          );
        })}

        <div style={{ marginTop: "12px", paddingLeft: "170px", fontSize: "11px", color: "#a0aec0" }}>
          현재고 / 출고 (총 입고)
        </div>
      </div>
    </div>
  );
}
