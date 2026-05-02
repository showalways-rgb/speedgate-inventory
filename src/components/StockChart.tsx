"use client";

import { Fragment } from "react";
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

const OUT_GREEN = "#48bb78";
const OUT_ZERO = "#cbd5e1";
const PRIMARY = "#5b6ee8";
const DANGER = "#dc2626";
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
  padding: "10px 14px",
  textAlign: "right",
};

const headerThModel: React.CSSProperties = {
  fontSize: "13px",
  color: "#64748b",
  fontWeight: 600,
  padding: "10px 14px",
  textAlign: "center",
};

const SUBCAT_HEADER_BG = "#ebf4ff";
const MODEL_COL = "240px";

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
    fontSize: "15px",
    padding: "9px 14px",
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
          <col style={{ width: MODEL_COL }} />
          <col style={{ width: "110px" }} />
          <col style={{ width: "110px" }} />
          <col style={{ width: "110px" }} />
        </colgroup>
        <thead>
          <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
            <th scope="col" style={{ ...headerThModel, width: MODEL_COL }}>
              모델명
            </th>
            <th scope="col" style={{ ...headerTh, width: "110px" }}>
              총입고
            </th>
            <th scope="col" style={{ ...headerTh, width: "110px" }}>
              출고
            </th>
            <th scope="col" style={{ ...headerTh, width: "110px" }}>
              현재고
            </th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group, groupIndex) =>
            group.rows.map((item, rowIndex) => {
              const isFirstInGroup = rowIndex === 0;
              const totalIn = item.totalIn ?? 0;
              const totalOut = item.totalOut ?? 0;
              const cs = Math.max(0, item.currentStock ?? 0);
              const out = Math.max(0, totalOut);
              const hideVirtualInAndStock =
                item.virtualOut === true || isVirtualOutItemName(item.itemName);

              return (
                <Fragment key={item.itemId}>
                  {isFirstInGroup && group.subcategoryName && (
                    <tr>
                      <td
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#94a3b8",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          padding: "10px 12px 8px 12px",
                          textAlign: "center",
                          borderTop: groupIndex > 0 ? "1px solid #e2e8f0" : undefined,
                          background: SUBCAT_HEADER_BG,
                        }}
                      >
                        {group.subcategoryName}
                      </td>
                      <td
                        colSpan={3}
                        style={{
                          borderTop: groupIndex > 0 ? "1px solid #e2e8f0" : undefined,
                          background: SUBCAT_HEADER_BG,
                          padding: 0,
                        }}
                      />
                    </tr>
                  )}
                  <tr
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                    }}
                  >
                    <td
                      title={item.itemName}
                      style={{
                        width: MODEL_COL,
                        maxWidth: MODEL_COL,
                        fontSize: "15px",
                        color: "var(--foreground)",
                        padding: "9px 12px",
                        textAlign: "center",
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
                    <td
                      style={{
                        ...numCell,
                        color: out > 0 ? OUT_GREEN : OUT_ZERO,
                        fontWeight: 500,
                      }}
                    >
                      {out > 0 ? out : "-"}
                    </td>
                    <td
                      style={{
                        ...numCell,
                        color: hideVirtualInAndStock ? OUT_ZERO : cs === 0 ? DANGER : PRIMARY,
                        fontWeight: hideVirtualInAndStock ? 500 : 700,
                      }}
                    >
                      {hideVirtualInAndStock ? "" : cs}
                    </td>
                  </tr>
                </Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
