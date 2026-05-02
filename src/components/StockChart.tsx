"use client";

interface StockItem {
  itemId: number;
  itemName: string;
  subcategoryName: string;
  totalIn: number;
  totalOut: number;
  currentStock: number;
  virtualOut?: boolean;
  outOrderCount?: number;
}

interface Props {
  data: StockItem[];
}

const OUT_GREEN = "#48bb78";
const OUT_ZERO = "#cbd5e1";
const TOTAL_IN_COLOR = "#64748b";

function groupBySubcategory(items: StockItem[]): { subcategoryName: string; rows: StockItem[] }[] {
  const order: string[] = [];
  const map = new Map<string, StockItem[]>();
  for (const item of items) {
    const key = item.subcategoryName ?? "";
    if (!map.has(key)) {
      order.push(key);
      map.set(key, []);
    }
    map.get(key)!.push(item);
  }
  return order.map((subcategoryName) => ({
    subcategoryName,
    rows: map.get(subcategoryName)!,
  }));
}

const headerTh: React.CSSProperties = {
  fontSize: "13px",
  color: "#64748b",
  fontWeight: 600,
  padding: "10px 16px",
  textAlign: "right",
};

const headerThBlank: React.CSSProperties = {
  fontSize: "13px",
  color: "#64748b",
  fontWeight: 600,
  padding: "10px 12px",
  textAlign: "left",
};

export default function StockChart({ data }: Props) {
  if (!data.length) {
    return (
      <div style={{ textAlign: "center", padding: "48px 0", color: "var(--muted)", fontSize: "14px" }}>
        거래 내역이 없습니다.
      </div>
    );
  }

  const groups = groupBySubcategory(data);

  const numCell: React.CSSProperties = {
    textAlign: "right",
    fontSize: "14px",
    padding: "8px 16px",
    fontVariantNumeric: "tabular-nums",
  };

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
            <th scope="col" style={{ ...headerThBlank, width: "130px" }} />
            <th scope="col" style={headerThBlank} />
            <th scope="col" style={headerTh}>
              총입고
            </th>
            <th scope="col" style={headerTh}>
              출고
            </th>
            <th scope="col" style={headerTh}>
              현재고
            </th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group, groupIndex) =>
            group.rows.map((item, rowIndex) => {
              const isFirstInGroup = rowIndex === 0;
              const borderTop = groupIndex > 0 && isFirstInGroup ? "1px solid #e2e8f0" : undefined;
              const totalIn = item.totalIn ?? 0;
              const totalOut = item.totalOut ?? 0;
              const cs = Math.max(0, item.currentStock ?? 0);
              const out = Math.max(0, totalOut);

              return (
                <tr
                  key={item.itemId}
                  style={{
                    borderTop,
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  {isFirstInGroup ? (
                    <td
                      rowSpan={group.rows.length}
                      style={{
                        width: "130px",
                        fontSize: "13px",
                        color: "#94a3b8",
                        fontWeight: 500,
                        verticalAlign: "top",
                        paddingTop: "14px",
                        paddingLeft: "12px",
                        paddingRight: "12px",
                      }}
                    >
                      {group.subcategoryName}
                    </td>
                  ) : null}
                  <td
                    title={item.itemName}
                    style={{
                      fontSize: "14px",
                      color: "var(--foreground)",
                      padding: "8px 12px",
                      maxWidth: "280px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.itemName}
                  </td>
                  <td style={{ ...numCell, color: TOTAL_IN_COLOR, fontWeight: 500 }}>{totalIn}</td>
                  <td
                    style={{
                      ...numCell,
                      color: out > 0 ? OUT_GREEN : OUT_ZERO,
                      fontWeight: 600,
                    }}
                  >
                    {out > 0 ? out : "-"}
                  </td>
                  <td
                    style={{
                      ...numCell,
                      color: cs === 0 ? "#dc2626" : "var(--primary)",
                      fontWeight: 700,
                    }}
                  >
                    {cs}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
