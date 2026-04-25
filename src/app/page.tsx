"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

interface Product { id: number; modelName: string; variant: string }
interface Part    { id: number; name: string; unit: string }
interface ProductStock { productId: number; quantity: number; product: Product }
interface PartStock    { partId: number;    quantity: number; part: Part }

const VARIANTS = ["Master", "Slave", "Center", "이동형"];
const VARIANT_COLOR: Record<string, { bg: string; color: string }> = {
  Master: { bg: "#e0e7ff", color: "#4338ca" },
  Slave:  { bg: "#d1fae5", color: "#065f46" },
  Center: { bg: "#fdf4ff", color: "#7e22ce" },
  이동형:  { bg: "#fef9c3", color: "#854d0e" },
};

export default function Dashboard() {
  const [products,      setProducts]      = useState<Product[]>([]);
  const [parts,         setParts]         = useState<Part[]>([]);
  const [productStocks, setProductStocks] = useState<ProductStock[]>([]);
  const [partStocks,    setPartStocks]    = useState<PartStock[]>([]);
  const [loading,       setLoading]       = useState(true);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/products").then(r => r.json()),
      fetch("/api/parts").then(r => r.json()),
      fetch("/api/product-stock").then(r => r.json()),
      fetch("/api/part-stock").then(r => r.json()),
    ]).then(([pr, pa, ps, pts]) => {
      setProducts(pr); setParts(pa);
      setProductStocks(ps); setPartStocks(pts);
      setLoading(false);
    });
  };

  useEffect(() => { fetchAll(); }, []);

  const modelNames = [...new Set(products.map(p => p.modelName))].sort();

  const getQty = (modelName: string, variant: string) => {
    const prod = products.find(p => p.modelName === modelName && p.variant === variant);
    if (!prod) return null;
    return productStocks.find(s => s.productId === prod.id)?.quantity ?? 0;
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0 }}>재고 현황</h1>
          <p style={{ color: "var(--muted)", fontSize: "13px", marginTop: "4px" }}>모델·부품별 현재 보유 수량</p>
        </div>
        <button onClick={fetchAll} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "8px", border: "1px solid var(--border)", background: "white", fontSize: "13px", cursor: "pointer", color: "var(--muted)" }}>
          <RefreshCw size={13} /> 새로고침
        </button>
      </div>

      {loading ? (
        <div style={{ padding: "60px", textAlign: "center", color: "var(--muted)" }}>로딩 중...</div>
      ) : (
        <>
          {/* ── 제품 재고 ── */}
          <div style={{ marginBottom: "32px" }}>
            <h2 style={sectionTitle}>제품 재고 <span style={unitBadge}>단위: 대</span></h2>
            <div style={tableWrap}>
              {modelNames.length === 0 ? (
                <div style={emptyStyle}>등록된 제품이 없습니다.</div>
              ) : (
                <table style={tbl}>
                  <thead>
                    <tr>
                      <th style={th}>모델명</th>
                      {VARIANTS.map(v => (
                        <th key={v} style={{ ...th, textAlign: "center" }}>
                          <span style={{ padding: "2px 10px", borderRadius: "4px", fontSize: "12px", ...VARIANT_COLOR[v] }}>{v}</span>
                        </th>
                      ))}
                      <th style={{ ...th, textAlign: "center", background: "#eef2ff", color: "#4338ca" }}>합계</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modelNames.map((model, i) => {
                      const qtys = VARIANTS.map(v => getQty(model, v) ?? 0);
                      const total = qtys.reduce((a, b) => a + b, 0);
                      return (
                        <tr key={model} style={{ background: i % 2 === 0 ? "white" : "#fafbfd" }}>
                          <td style={{ ...td, fontWeight: 600, fontSize: "14px" }}>{model}</td>
                          {qtys.map((qty, vi) => (
                            <td key={vi} style={{ ...td, textAlign: "center" }}>
                              <span style={{
                                fontWeight: 700, fontSize: "16px",
                                color: qty === 0 ? "#cbd5e1" : qty < 3 ? "#e05c5c" : "#2d3748",
                              }}>{qty}</span>
                            </td>
                          ))}
                          <td style={{ ...td, textAlign: "center", background: "#f7f8ff" }}>
                            <span style={{ fontWeight: 700, fontSize: "15px", color: "#4338ca" }}>{total}</span>
                          </td>
                        </tr>
                      );
                    })}
                    {/* 합계 */}
                    <tr style={{ background: "#f0f4ff" }}>
                      <td style={{ ...td, color: "#4338ca", fontWeight: 700, borderTop: "2px solid #c7d2fe" }}>합 계</td>
                      {VARIANTS.map(v => {
                        const sum = products
                          .filter(p => p.variant === v)
                          .reduce((s, p) => s + (productStocks.find(st => st.productId === p.id)?.quantity ?? 0), 0);
                        return <td key={v} style={{ ...td, textAlign: "center", color: "#4338ca", fontWeight: 700, borderTop: "2px solid #c7d2fe" }}>{sum}</td>;
                      })}
                      <td style={{ ...td, textAlign: "center", color: "#4338ca", fontWeight: 700, fontSize: "15px", borderTop: "2px solid #c7d2fe", background: "#e8edff" }}>
                        {productStocks.reduce((s, p) => s + p.quantity, 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* ── 부품 재고 ── */}
          <div>
            <h2 style={sectionTitle}>부품 재고</h2>
            <div style={tableWrap}>
              {parts.length === 0 ? (
                <div style={emptyStyle}>등록된 부품이 없습니다.</div>
              ) : (
                <table style={tbl}>
                  <thead>
                    <tr>
                      <th style={th}>부품명</th>
                      <th style={{ ...th, textAlign: "center", width: "80px" }}>단위</th>
                      <th style={{ ...th, textAlign: "center", width: "120px" }}>현재고</th>
                      <th style={{ ...th, textAlign: "center", width: "100px" }}>상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parts.map((part, i) => {
                      const qty = partStocks.find(s => s.partId === part.id)?.quantity ?? 0;
                      const low  = qty > 0 && qty < 5;
                      const zero = qty === 0;
                      return (
                        <tr key={part.id} style={{ background: i % 2 === 0 ? "white" : "#fafbfd" }}>
                          <td style={{ ...td, fontWeight: 500 }}>{part.name}</td>
                          <td style={{ ...td, textAlign: "center", color: "var(--muted)", fontSize: "12px" }}>{part.unit}</td>
                          <td style={{ ...td, textAlign: "center" }}>
                            <span style={{ fontWeight: 700, fontSize: "16px", color: zero ? "#cbd5e1" : low ? "#e05c5c" : "#2d3748" }}>{qty}</span>
                          </td>
                          <td style={{ ...td, textAlign: "center" }}>
                            <span style={{
                              padding: "3px 10px", borderRadius: "4px", fontSize: "12px", fontWeight: 500,
                              background: zero ? "#f7f8fc" : low ? "#fff0f0" : "#f0fff4",
                              color: zero ? "#a0aec0" : low ? "#c53030" : "#276749",
                            }}>
                              {zero ? "없음" : low ? "부족" : "정상"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const sectionTitle: React.CSSProperties = { fontSize: "15px", fontWeight: 700, margin: "0 0 10px", display: "flex", alignItems: "center", gap: "8px", color: "#2d3748" } as React.CSSProperties;
const unitBadge:    React.CSSProperties = { fontSize: "12px", color: "var(--muted)", fontWeight: 400 };
const tableWrap:    React.CSSProperties = { border: "1px solid var(--border)", borderRadius: "10px", overflow: "auto", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" };
const emptyStyle:   React.CSSProperties = { padding: "40px", textAlign: "center", color: "var(--muted)", fontSize: "14px", background: "white" };
const tbl:          React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: "14px" };
const th:           React.CSSProperties = { padding: "11px 16px", background: "#f7f8fc", color: "#4a5568", fontWeight: 600, fontSize: "13px", whiteSpace: "nowrap", borderRight: "1px solid var(--border)", borderBottom: "2px solid var(--border)", textAlign: "left" };
const td:           React.CSSProperties = { padding: "10px 16px", borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)", verticalAlign: "middle" };
