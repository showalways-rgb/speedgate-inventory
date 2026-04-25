"use client";

import { useEffect, useState } from "react";
import { Package, Wrench, RefreshCw } from "lucide-react";

interface ProductStock {
  productId: number;
  quantity: number;
  product: { modelName: string; variant: string };
}

interface PartStock {
  partId: number;
  quantity: number;
  part: { name: string; unit: string };
}

const VARIANTS = ["Master", "Slave", "Center", "이동형"];
const VARIANT_COLORS: Record<string, { bg: string; color: string }> = {
  Master: { bg: "#e0e7ff", color: "#4338ca" },
  Slave:  { bg: "#d1fae5", color: "#065f46" },
  Center: { bg: "#fdf4ff", color: "#7e22ce" },
  이동형:  { bg: "#fef9c3", color: "#854d0e" },
};

export default function InventoryPage() {
  const [productStocks, setProductStocks] = useState<ProductStock[]>([]);
  const [partStocks, setPartStocks] = useState<PartStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"product" | "part">("product");

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/product-stock").then(r => r.json()),
      fetch("/api/part-stock").then(r => r.json()),
    ]).then(([ps, pts]) => {
      setProductStocks(ps);
      setPartStocks(pts);
      setLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, []);

  // 제품: modelName별로 그룹핑
  const models = Array.from(new Set(productStocks.map(s => s.product.modelName))).sort();

  const getProductQty = (modelName: string, variant: string) =>
    productStocks.find(s => s.product.modelName === modelName && s.product.variant === variant)?.quantity ?? 0;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Package size={22} color="#3b82f6" />
          </div>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0, color: "var(--foreground)" }}>현재고</h1>
            <p style={{ color: "var(--muted)", fontSize: "13px", marginTop: "2px" }}>제품과 부품 재고를 독립적으로 확인합니다.</p>
          </div>
        </div>
        <button onClick={fetchData} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "8px", border: "1px solid var(--border)", background: "white", fontSize: "13px", cursor: "pointer" }}>
          <RefreshCw size={14} /> 새로고침
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0", marginBottom: "20px", background: "#f1f5f9", borderRadius: "10px", padding: "4px", maxWidth: "340px" }}>
        {([["product", "제품 (모델)"], ["part", "부품"]] as const).map(([t, label]) => (
          <button key={t} type="button" onClick={() => setTab(t)} style={{
            flex: 1, padding: "9px", borderRadius: "7px", border: "none",
            background: tab === t ? "white" : "transparent",
            color: tab === t ? "var(--foreground)" : "var(--muted)",
            fontWeight: tab === t ? 600 : 400, fontSize: "14px", cursor: "pointer",
            boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
          }}>{label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: "12px", padding: "48px", textAlign: "center", color: "var(--muted)" }}>로딩 중...</div>
      ) : tab === "product" ? (
        /* ── 제품 재고 테이블 ── */
        <div>
          {models.length === 0 ? (
            <EmptyBox>등록된 제품이 없습니다.</EmptyBox>
          ) : (
            <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: "12px", overflow: "auto", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", minWidth: "400px" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "2px solid var(--border)" }}>
                    <th style={th}>모델명</th>
                    {VARIANTS.map(v => (
                      <th key={v} style={{ ...th, textAlign: "center" }}>
                        <span style={{ padding: "3px 10px", borderRadius: "4px", fontSize: "12px", ...VARIANT_COLORS[v] }}>{v}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {models.map((model, i) => (
                    <tr key={model} style={{ borderBottom: i < models.length - 1 ? "1px solid var(--border)" : "none", background: i % 2 === 0 ? "white" : "#fafafa" }}>
                      <td style={{ ...td, fontWeight: 600 }}>{model}</td>
                      {VARIANTS.map(v => {
                        const qty = getProductQty(model, v);
                        return (
                          <td key={v} style={{ ...td, textAlign: "center" }}>
                            <span style={{ fontWeight: 600, fontSize: "16px", color: qty === 0 ? "#cbd5e1" : qty < 3 ? "#e05c5c" : "#2d3748" }}>{qty}</span>
                            <span style={{ fontSize: "11px", color: "var(--muted)", marginLeft: "2px" }}>대</span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Legend items={[["#2d3748","3대 이상"], ["#e05c5c","3대 미만 (주의)"], ["#cbd5e1","0대"]]} />
        </div>
      ) : (
        /* ── 부품 재고 목록 ── */
        <div>
          {partStocks.length === 0 ? (
            <EmptyBox>등록된 부품이 없습니다.</EmptyBox>
          ) : (
            <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: "12px", overflow: "auto", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", minWidth: "360px" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "2px solid var(--border)" }}>
                    <th style={th}>부품명</th>
                    <th style={{ ...th, textAlign: "center" }}>단위</th>
                    <th style={{ ...th, textAlign: "center" }}>현재고</th>
                    <th style={{ ...th, textAlign: "center" }}>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {partStocks.map((s, i) => {
                    const low = s.quantity < 5;
                    return (
                      <tr key={s.partId} style={{ borderBottom: i < partStocks.length - 1 ? "1px solid var(--border)" : "none", background: i % 2 === 0 ? "white" : "#fafafa" }}>
                        <td style={{ ...td, fontWeight: 500 }}>{s.part.name}</td>
                        <td style={{ ...td, textAlign: "center", color: "var(--muted)" }}>{s.part.unit}</td>
                        <td style={{ ...td, textAlign: "center" }}>
                          <span style={{ fontWeight: 700, fontSize: "16px", color: s.quantity === 0 ? "#cbd5e1" : low ? "#e05c5c" : "#2d3748" }}>{s.quantity}</span>
                        </td>
                        <td style={{ ...td, textAlign: "center" }}>
                          <span style={{ padding: "3px 10px", borderRadius: "4px", fontSize: "12px", fontWeight: 500,
                            background: s.quantity === 0 ? "#f7f8fc" : low ? "#fff0f0" : "#f0fff4",
                            color: s.quantity === 0 ? "#a0aec0" : low ? "#c53030" : "#276749" }}>
                            {s.quantity === 0 ? "재고 없음" : low ? "부족 주의" : "정상"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <Legend items={[["#276749","5개 이상 (정상)"], ["#e05c5c","5개 미만 (주의)"], ["#a0aec0","0개 (재고 없음)"]]} />
        </div>
      )}
    </div>
  );
}

function EmptyBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: "48px", textAlign: "center", color: "var(--muted)", fontSize: "14px",
      background: "white", border: "1px solid var(--border)", borderRadius: "12px" }}>
      {children}
    </div>
  );
}

function Legend({ items }: { items: [string, string][] }) {
  return (
    <div style={{ display: "flex", gap: "16px", marginTop: "10px", fontSize: "12px", color: "var(--muted)", flexWrap: "wrap" }}>
      {items.map(([color, label]) => (
        <span key={label}><span style={{ color, fontWeight: 700 }}>■ </span>{label}</span>
      ))}
    </div>
  );
}

const th: React.CSSProperties = { padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "var(--muted)", whiteSpace: "nowrap", fontSize: "13px" };
const td: React.CSSProperties = { padding: "12px 16px", verticalAlign: "middle" };
