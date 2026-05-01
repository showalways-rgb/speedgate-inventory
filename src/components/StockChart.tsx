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

interface Props { data: StockItem[] }

function rowScale(item: StockItem): number {
  if (item.virtualOut) {
    return Math.max(item.totalIn, item.totalOut, 1);
  }
  /** 입고·실물고 기준과 무관하게, 표시 출고가 입고를 넘을 수 있음(BT-400M→BT-400 등) */
  return Math.max(item.totalIn, item.currentStock + item.totalOut, 1);
}

export default function StockChart({ data }: Props) {
  if (!data.length) {
    return (
      <div style={{ textAlign: "center", padding: "48px 0", color: "var(--muted)", fontSize: "14px" }}>
        거래 내역이 없습니다.
      </div>
    );
  }

  const hasData = data.some(
    (d) => d.totalIn > 0 || d.totalOut > 0 || (d.outOrderCount ?? 0) > 0
  );
  if (!hasData) {
    return (
      <div style={{ textAlign: "center", padding: "48px 0", color: "var(--muted)", fontSize: "14px" }}>
        입고·출고 내역이 없습니다.
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => rowScale(d)), 1);

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ minWidth: "520px" }}>
        <div style={{ display: "flex", gap: "20px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
          {[
            { color: "#a0aec0", label: "현재고" },
            { color: "#48bb78", label: "출고(수량)" },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--muted)" }}>
              <div style={{ width: "12px", height: "12px", background: color, borderRadius: "2px" }} />
              {label}
            </div>
          ))}
          <span style={{ fontSize: "11px", color: "#9333ea", padding: "4px 10px", background: "#f5f3ff", borderRadius: "999px" }}>
            BT-400M→BT-400 · BF-400M→Master/Slave 출고 집계 연동 (재고는 본체 FIFO만)
          </span>
        </div>

        {data.map((item) => {
          const scale = rowScale(item);
          const isEmptyRow = item.totalIn === 0 && item.totalOut === 0 && (item.outOrderCount ?? 0) === 0;

          if (isEmptyRow) {
            return (
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
          }

          const barW = (scale / maxVal) * 100;
          const stockRatio = scale > 0 ? item.currentStock / scale : 0;
          const outRatio = scale > 0 ? item.totalOut / scale : 0;

          return (
            <div key={item.itemId} style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  width: "160px", flexShrink: 0, fontSize: "13px", color: "var(--foreground)",
                  textAlign: "right", paddingRight: "8px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {item.itemName}
                  {item.virtualOut && (
                    <div style={{ fontSize: "10px", color: "#7c3aed", fontWeight: 600, marginTop: "4px" }}>파생 집계</div>
                  )}
                </div>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                  <div style={{ width: `${barW}%`, height: "20px", borderRadius: "4px", overflow: "hidden", display: "flex", minWidth: "4px" }}>
                    {stockRatio > 0 && (
                      <div title={`현재고: ${item.currentStock}`} style={{ width: `${stockRatio * 100}%`, height: "100%", background: "#a0aec0" }} />
                    )}
                    {outRatio > 0 && (
                      <div title={`출고 수량: ${item.totalOut}`} style={{ width: `${outRatio * 100}%`, height: "100%", background: "#48bb78" }} />
                    )}
                  </div>
                  <span style={{ fontSize: "12px", color: "var(--muted)", whiteSpace: "nowrap" }}>
                    {item.currentStock > 0 && <span style={{ color: "#718096" }}>{item.currentStock} </span>}
                    {item.totalOut > 0 && <span style={{ color: "#48bb78" }}>/ {item.totalOut}</span>}
                    <span style={{ color: "#cbd5e0", marginLeft: "2px" }}>(총입고 {item.totalIn})</span>
                    {(item.outOrderCount ?? 0) > 0 && (
                      <span style={{ color: "#9333ea", marginLeft: "6px", fontWeight: 600 }}>
                        · 출고 {item.outOrderCount}건
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        <div style={{ marginTop: "12px", paddingLeft: "170px", fontSize: "11px", color: "#a0aec0", lineHeight: 1.45 }}>
          현재고 / 출고 수량 (총 입고) · 보라: 출고 등록 건수
        </div>
      </div>
    </div>
  );
}
