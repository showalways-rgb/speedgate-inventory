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

const cell: React.CSSProperties = {
  padding: "10px 14px",
  border: "1px solid var(--border)",
  verticalAlign: "middle",
};
const cellNum: React.CSSProperties = {
  ...cell,
  textAlign: "right",
  fontVariantNumeric: "tabular-nums",
};

export default function StockChart({ data }: Props) {
  if (!data.length) {
    return (
      <div style={{ textAlign: "center", padding: "48px 0", color: "var(--muted)", fontSize: "14px" }}>
        거래 내역이 없습니다.
      </div>
    );
  }

  return (
    <div className="stock-chart-wrap" style={{ overflowX: "auto" }}>
      <style>{`
        .stock-chart-table tbody tr:hover { background-color: #f8fafc; }
      `}</style>
      <table
        className="stock-chart-table"
        style={{
          borderCollapse: "collapse",
          width: "100%",
          minWidth: "480px",
          border: "1px solid var(--border)",
          fontSize: "14px",
          color: "var(--foreground)",
        }}
      >
        <thead>
          <tr>
            <th
              scope="col"
              style={{
                ...cell,
                textAlign: "left",
                background: "#f8fafc",
                fontWeight: 600,
                borderBottom: "1px solid var(--border)",
              }}
            >
              모델명
            </th>
            <th
              scope="col"
              style={{
                ...cellNum,
                background: "#f8fafc",
                fontWeight: 600,
                borderBottom: "1px solid var(--border)",
              }}
            >
              총 입고
            </th>
            <th
              scope="col"
              style={{
                ...cellNum,
                background: "#f8fafc",
                fontWeight: 600,
                borderBottom: "1px solid var(--border)",
              }}
            >
              출고
            </th>
            <th
              scope="col"
              style={{
                ...cellNum,
                background: "#f8fafc",
                fontWeight: 600,
                borderBottom: "1px solid var(--border)",
              }}
            >
              현재고
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => {
            const totalIn = item.totalIn ?? 0;
            const totalOut = item.totalOut ?? 0;
            const currentStock = item.currentStock ?? 0;
            const stockColor = currentStock === 0 ? "#dc2626" : "#2563eb";

            return (
              <tr key={item.itemId}>
                <td
                  style={{
                    ...cell,
                    textAlign: "left",
                    maxWidth: "220px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={item.itemName}
                >
                  {item.itemName}
                </td>
                <td style={cellNum}>{totalIn}</td>
                <td style={cellNum}>{totalOut}</td>
                <td style={{ ...cellNum, color: stockColor, fontWeight: 600 }}>
                  {currentStock}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
