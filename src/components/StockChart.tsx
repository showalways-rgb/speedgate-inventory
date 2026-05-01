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

  const maxVal = Math.max(...data.map(d => d.totalIn), 1);

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ minWidth: "480px" }}>
        {data.map((item) => {
          const inW = (item.totalIn / maxVal) * 100;
          const outW = (item.totalOut / maxVal) * 100;
          const stockW = (item.currentStock / maxVal) * 100;
          return (
            <div key={item.itemId} style={{ display: "flex", alignItems: "center", marginBottom: "10px", gap: "10px" }}>
              <div style={{ width: "160px", flexShrink: 0, fontSize: "13px", color: "var(--foreground)", textAlign: "right", paddingRight: "8px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {item.itemName}
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "3px" }}>
                {item.totalIn > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: `${inW}%`, height: "16px", background: "#4f86f7", borderRadius: "3px", minWidth: "2px" }} />
                    <span style={{ fontSize: "12px", color: "var(--muted)", whiteSpace: "nowrap" }}>{item.totalIn}</span>
                  </div>
                )}
                {item.totalOut > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: `${outW}%`, height: "16px", background: "#48bb78", borderRadius: "3px", minWidth: "2px" }} />
                    <span style={{ fontSize: "12px", color: "var(--muted)", whiteSpace: "nowrap" }}>{item.totalOut}</span>
                  </div>
                )}
                {item.currentStock > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: `${stockW}%`, height: "16px", background: "#a0aec0", borderRadius: "3px", minWidth: "2px" }} />
                    <span style={{ fontSize: "12px", color: "var(--muted)", whiteSpace: "nowrap" }}>{item.currentStock}</span>
                  </div>
                )}
                {item.totalIn === 0 && (
                  <div style={{ height: "16px", display: "flex", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", color: "#cbd5e0" }}>입고 없음</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div style={{ marginTop: "16px", display: "flex", gap: "20px", paddingLeft: "170px", flexWrap: "wrap" }}>
          {[
            { color: "#4f86f7", label: "입고 및 재고" },
            { color: "#48bb78", label: "출고" },
            { color: "#a0aec0", label: "현재고" },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--muted)" }}>
              <div style={{ width: "14px", height: "14px", background: color, borderRadius: "3px" }} />
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
