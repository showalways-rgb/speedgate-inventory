"use client";

import { isVirtualOutItemName } from "@/lib/virtual-out-models";

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
  padding: "8px 10px",
  textAlign: "right",
};

const headerThBlank: React.CSSProperties = {
  fontSize: "13px",
  color: "#64748b",
  fontWeight: 600,
  padding: "8px 10px",
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
    padding: "5px 10px",
    fontVariantNumeric: "tabular-nums",
  };

  const numCellFirst: React.CSSProperties = {
    ...numCell,
    paddingLeft: "4px",
  };

  return (
    <div style={{ maxWidth: "100%", overflowX: "auto" }}>
      <table style={{ width: "max-content", borderCollapse: "collapse", tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: "118px" }} />
          <col style={{ width: "240px" }} />
          <col style={{ width: "100px" }} />
          <col style={{ width: "100px" }} />
          <col style={{ width: "100px" }} />
        </colgroup>
        <thead>
          <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
            <th scope="col" style={{ ...headerThBlank, width: "118px" }} />
            <th scope="col" style={{ ...headerThBlank, width: "240px" }} />
            <th scope="col" style={{ ...headerTh, width: "100px" }}>
              총입고
            </th>
            <th scope="col" style={{ ...headerTh, width: "100px" }}>
              출고
            </th>
            <th scope="col" style={{ ...headerTh, width: "100px" }}>
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
              const hideVirtualInAndStock =
                item.virtualOut === true || isVirtualOutItemName(item.itemName);

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
                        width: "118px",
                        fontSize: "13px",
                        color: "#94a3b8",
                        fontWeight: 500,
                        verticalAlign: "top",
                        paddingTop: "8px",
                        paddingLeft: "10px",
                        paddingRight: "8px",
                      }}
                    >
                      {group.subcategoryName}
                    </td>
                  ) : null}
                  <td
                    title={item.itemName}
                    style={{
                      width: "240px",
                      maxWidth: "240px",
                      fontSize: "14px",
                      color: "var(--foreground)",
                      padding: "5px 4px 5px 10px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.itemName}
                  </td>
                  <td style={{ ...numCellFirst, color: TOTAL_IN_COLOR, fontWeight: 500 }}>
                    {hideVirtualInAndStock ? "" : totalIn}
                  </td>
                  <td style={{ ...numCell, color: TOTAL_IN_COLOR, fontWeight: 500 }}>{out > 0 ? out : "-"}</td>
                  <td style={{ ...numCell, color: TOTAL_IN_COLOR, fontWeight: 500 }}>
                    {hideVirtualInAndStock ? "" : cs}
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
