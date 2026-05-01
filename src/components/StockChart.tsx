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

const pad = "6px 12px";
const muted = "#cbd5e1";

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
      <div
        style={{
          display: "inline-block",
          maxWidth: "560px",
          width: "auto",
          borderRadius: "10px",
          overflow: "hidden",
          verticalAlign: "top",
          boxSizing: "border-box",
        }}
      >
        <table
          className="stock-chart-table"
          style={{
            borderCollapse: "collapse",
            width: "auto",
            maxWidth: "560px",
            fontSize: "13px",
            color: "var(--foreground)",
            border: "1px solid var(--border)",
          }}
        >
          <thead>
            <tr>
              <th
                scope="col"
                style={{
                  padding: pad,
                  border: "1px solid var(--border)",
                  verticalAlign: "middle",
                  textAlign: "left",
                  background: "#f8fafc",
                  fontWeight: 600,
                  fontSize: "12px",
                  borderBottom: "2px solid #e2e8f0",
                  minWidth: "160px",
                }}
              >
                모델명
              </th>
              <th
                scope="col"
                style={{
                  padding: pad,
                  border: "1px solid var(--border)",
                  verticalAlign: "middle",
                  textAlign: "right",
                  background: "#f8fafc",
                  fontWeight: 600,
                  fontSize: "12px",
                  borderBottom: "2px solid #e2e8f0",
                  minWidth: "80px",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                총 입고
              </th>
              <th
                scope="col"
                style={{
                  padding: pad,
                  border: "1px solid var(--border)",
                  verticalAlign: "middle",
                  textAlign: "right",
                  background: "#f8fafc",
                  fontWeight: 600,
                  fontSize: "12px",
                  borderBottom: "2px solid #e2e8f0",
                  minWidth: "80px",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                출고
              </th>
              <th
                scope="col"
                style={{
                  padding: pad,
                  border: "1px solid var(--border)",
                  verticalAlign: "middle",
                  textAlign: "right",
                  background: "#f8fafc",
                  fontWeight: 600,
                  fontSize: "12px",
                  borderBottom: "2px solid #e2e8f0",
                  minWidth: "80px",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                현재고
              </th>
            </tr>
          </thead>
          <tbody style={{ fontSize: "13px" }}>
            {data.map((item) => {
              const totalIn = item.totalIn ?? 0;
              const totalOut = item.totalOut ?? 0;
              const currentStock = item.currentStock ?? 0;
              const dimRow = totalIn === 0 && totalOut === 0;

              const stockColor = dimRow
                ? muted
                : currentStock === 0
                  ? "#dc2626"
                  : "#2563eb";

              const rowText = dimRow ? muted : "var(--foreground)";

              return (
                <tr key={item.itemId}>
                  <td
                    style={{
                      padding: pad,
                      border: "1px solid var(--border)",
                      textAlign: "left",
                      verticalAlign: "middle",
                      minWidth: "160px",
                      maxWidth: "240px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      color: rowText,
                    }}
                    title={item.itemName}
                  >
                    {item.itemName}
                  </td>
                  <td
                    style={{
                      padding: pad,
                      border: "1px solid var(--border)",
                      textAlign: "right",
                      verticalAlign: "middle",
                      minWidth: "80px",
                      fontVariantNumeric: "tabular-nums",
                      color: rowText,
                    }}
                  >
                    {totalIn}
                  </td>
                  <td
                    style={{
                      padding: pad,
                      border: "1px solid var(--border)",
                      textAlign: "right",
                      verticalAlign: "middle",
                      minWidth: "80px",
                      fontVariantNumeric: "tabular-nums",
                      color: rowText,
                    }}
                  >
                    {totalOut}
                  </td>
                  <td
                    style={{
                      padding: pad,
                      border: "1px solid var(--border)",
                      textAlign: "right",
                      verticalAlign: "middle",
                      minWidth: "80px",
                      fontVariantNumeric: "tabular-nums",
                      color: stockColor,
                      fontWeight: 600,
                    }}
                  >
                    {currentStock}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
