"use client";

import { useEffect, useRef, useState } from "react";
import { BarChart2, Pencil, RefreshCw } from "lucide-react";

interface Product { id: number; modelName: string; variant: string }
interface Part    { id: number; name: string; unit: string }

interface ProductTx {
  id: number; type: string; quantity: number; note: string | null; createdAt: string;
  product: Product;
}
interface PartTx {
  id: number; type: string; quantity: number; note: string | null; createdAt: string;
  part: Part;
}

const VARIANTS = ["Master", "Slave", "Center"];

export default function StatusPage() {
  const [tab, setTab]             = useState<"product" | "part">("product");
  const [products, setProducts]   = useState<Product[]>([]);
  const [parts,    setParts]      = useState<Part[]>([]);
  const [productTxs, setProductTxs] = useState<ProductTx[]>([]);
  const [partTxs,    setPartTxs]    = useState<PartTx[]>([]);
  const [loading,    setLoading]    = useState(true);

  // 현장명 인라인 편집 상태
  const [editingId,   setEditingId]   = useState<{ type: "product" | "part"; id: number } | null>(null);
  const [editingNote, setEditingNote] = useState("");
  const editRef = useRef<HTMLInputElement>(null);

  // 필터 상태
  const [filterModel,   setFilterModel]   = useState("all");
  const [filterVariant, setFilterVariant] = useState("all");
  const [filterType,    setFilterType]    = useState("all");
  const [filterPart,    setFilterPart]    = useState("all");
  const [filterTypeP,   setFilterTypeP]   = useState("all");

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/products").then(r => r.json()),
      fetch("/api/parts").then(r => r.json()),
      fetch("/api/product-transactions").then(r => r.json()),
      fetch("/api/part-transactions").then(r => r.json()),
    ]).then(([pr, pa, ptx, pttx]) => {
      setProducts(pr); setParts(pa);
      setProductTxs(ptx); setPartTxs(pttx);
      setLoading(false);
    });
  };

  useEffect(() => { fetchAll(); }, []);

  const modelNames = [...new Set(products.map(p => p.modelName))].sort();

  // 필터 적용
  const filteredProductTxs = productTxs.filter(tx => {
    if (filterModel   !== "all" && tx.product.modelName !== filterModel)   return false;
    if (filterVariant !== "all" && tx.product.variant   !== filterVariant) return false;
    if (filterType    !== "all" && tx.type              !== filterType)     return false;
    return true;
  });

  const filteredPartTxs = partTxs.filter(tx => {
    if (filterPart  !== "all" && String(tx.part.id) !== filterPart) return false;
    if (filterTypeP !== "all" && tx.type            !== filterTypeP) return false;
    return true;
  });

  const totalIn  = (txs: { type: string; quantity: number }[]) => txs.filter(t => t.type === "IN" ).reduce((s, t) => s + t.quantity, 0);
  const totalOut = (txs: { type: string; quantity: number }[]) => txs.filter(t => t.type === "OUT").reduce((s, t) => s + t.quantity, 0);

  const fmt = (d: string) => new Date(d).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });

  const startEdit = (type: "product" | "part", id: number, note: string | null) => {
    setEditingId({ type, id });
    setEditingNote(note ?? "");
    setTimeout(() => editRef.current?.focus(), 0);
  };

  const saveNote = async () => {
    if (!editingId) return;
    const url = editingId.type === "product"
      ? `/api/product-transactions/${editingId.id}`
      : `/api/part-transactions/${editingId.id}`;
    await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ note: editingNote || null }) });
    if (editingId.type === "product") {
      setProductTxs(prev => prev.map(tx => tx.id === editingId.id ? { ...tx, note: editingNote || null } : tx));
    } else {
      setPartTxs(prev => prev.map(tx => tx.id === editingId.id ? { ...tx, note: editingNote || null } : tx));
    }
    setEditingId(null);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BarChart2 size={22} color="#7c3aed" />
          </div>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0 }}>입출고 현황</h1>
            <p style={{ color: "var(--muted)", fontSize: "13px", marginTop: "2px" }}>모델·부품별 입고·출고 내역</p>
          </div>
        </div>
        <button onClick={fetchAll} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "8px", border: "1px solid var(--border)", background: "white", fontSize: "13px", cursor: "pointer" }}>
          <RefreshCw size={13} /> 새로고침
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", background: "#f1f5f9", borderRadius: "10px", padding: "4px", maxWidth: "320px", marginBottom: "20px" }}>
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
        <div style={{ padding: "60px", textAlign: "center", color: "var(--muted)" }}>로딩 중...</div>
      ) : tab === "product" ? (
        /* ── 제품 입출고 ── */
        <div>
          {/* 필터 */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px", padding: "14px 16px", background: "white", border: "1px solid var(--border)", borderRadius: "10px" }}>
            <select value={filterModel}   onChange={e => setFilterModel(e.target.value)}   style={sel}>
              <option value="all">전체 모델</option>
              {modelNames.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={filterVariant} onChange={e => setFilterVariant(e.target.value)} style={sel}>
              <option value="all">전체 파생</option>
              {VARIANTS.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            <select value={filterType}    onChange={e => setFilterType(e.target.value)}    style={sel}>
              <option value="all">입고+출고</option>
              <option value="IN">입고만</option>
              <option value="OUT">출고만</option>
            </select>
            <span style={{ marginLeft: "auto", fontSize: "13px", color: "var(--muted)", display: "flex", alignItems: "center", gap: "12px" }}>
              <span>총 <strong style={{ color: "#0f172a" }}>{filteredProductTxs.length}</strong>건</span>
              <span style={{ color: "#16a34a" }}>입고 <strong>{totalIn(filteredProductTxs)}</strong>대</span>
              <span style={{ color: "#dc2626" }}>출고 <strong>{totalOut(filteredProductTxs)}</strong>대</span>
            </span>
          </div>

          {/* 표 */}
          <div style={{ border: "1px solid #cbd5e1", borderRadius: "10px", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            {filteredProductTxs.length === 0 ? (
              <div style={emptyStyle}>내역이 없습니다.</div>
            ) : (
              <table style={tbl}>
                <thead>
                  <tr>
                    <Th width="110px">날짜</Th>
                    <Th width="90px"  center>구분</Th>
                    <Th width="110px">모델명</Th>
                    <Th width="100px" center>파생</Th>
                    <Th width="100px" center>수량 (대)</Th>
                    <Th>현장명</Th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProductTxs.map((tx, i) => (
                    <tr key={tx.id} style={{ background: i % 2 === 0 ? "white" : "#f8fafc" }}>
                      <td style={td}>{fmt(tx.createdAt)}</td>
                      <td style={{ ...td, textAlign: "center" }}>
                        <TypeBadge type={tx.type} />
                      </td>
                      <td style={{ ...td, fontWeight: 600 }}>{tx.product.modelName}</td>
                      <td style={{ ...td, textAlign: "center" }}>
                        <VariantBadge variant={tx.product.variant} />
                      </td>
                      <td style={{ ...td, textAlign: "center", fontWeight: 700, fontSize: "15px",
                        color: tx.type === "IN" ? "#16a34a" : "#dc2626" }}>
                        {tx.type === "IN" ? "+" : "−"}{tx.quantity}
                      </td>
                      <td style={{ ...td, padding: "6px 10px" }}>
                        {editingId?.type === "product" && editingId.id === tx.id ? (
                          <div style={{ display: "flex", gap: "4px" }}>
                            <input ref={editRef} value={editingNote} onChange={e => setEditingNote(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") saveNote(); if (e.key === "Escape") setEditingId(null); }}
                              style={{ flex: 1, padding: "4px 8px", border: "1px solid #7c3aed", borderRadius: "5px", fontSize: "13px", outline: "none" }} />
                            <button onClick={saveNote} style={{ padding: "4px 10px", background: "#7c3aed", color: "white", border: "none", borderRadius: "5px", fontSize: "12px", cursor: "pointer" }}>저장</button>
                            <button onClick={() => setEditingId(null)} style={{ padding: "4px 8px", background: "#e2e8f0", border: "none", borderRadius: "5px", fontSize: "12px", cursor: "pointer" }}>취소</button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }} onClick={() => startEdit("product", tx.id, tx.note)}>
                            <span style={{ color: tx.note ? "var(--foreground)" : "var(--muted)" }}>{tx.note || "—"}</span>
                            <Pencil size={12} color="#94a3b8" />
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* 소계 */}
                <tfoot>
                  <tr style={{ background: "#1a3a2a" }}>
                    <td colSpan={3} style={footTd}>입고 소계</td>
                    <td style={{ ...footTd, textAlign: "center" }}>
                      <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: 600, background: "#dcfce7", color: "#16a34a" }}>입고</span>
                    </td>
                    <td style={{ ...footTd, textAlign: "center", color: "#86efac", fontSize: "16px", fontWeight: 700 }}>
                      +{totalIn(filteredProductTxs)}대
                    </td>
                    <td style={footTd} />
                  </tr>
                  <tr style={{ background: "#3a1a1a" }}>
                    <td colSpan={3} style={{ ...footTd, borderTop: "1px solid #4b1a1a" }}>출고 소계</td>
                    <td style={{ ...footTd, textAlign: "center", borderTop: "1px solid #4b1a1a" }}>
                      <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: 600, background: "#fee2e2", color: "#dc2626" }}>출고</span>
                    </td>
                    <td style={{ ...footTd, textAlign: "center", color: "#fca5a5", fontSize: "16px", fontWeight: 700, borderTop: "1px solid #4b1a1a" }}>
                      −{totalOut(filteredProductTxs)}대
                    </td>
                    <td style={{ ...footTd, borderTop: "1px solid #4b1a1a" }} />
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>
      ) : (
        /* ── 부품 입출고 ── */
        <div>
          {/* 필터 */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px", padding: "14px 16px", background: "white", border: "1px solid var(--border)", borderRadius: "10px" }}>
            <select value={filterPart}  onChange={e => setFilterPart(e.target.value)}  style={sel}>
              <option value="all">전체 부품</option>
              {parts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select value={filterTypeP} onChange={e => setFilterTypeP(e.target.value)} style={sel}>
              <option value="all">입고+출고</option>
              <option value="IN">입고만</option>
              <option value="OUT">출고만</option>
            </select>
            <span style={{ marginLeft: "auto", fontSize: "13px", color: "var(--muted)", display: "flex", alignItems: "center", gap: "12px" }}>
              <span>총 <strong style={{ color: "#0f172a" }}>{filteredPartTxs.length}</strong>건</span>
              <span style={{ color: "#16a34a" }}>입고 <strong>{totalIn(filteredPartTxs)}</strong></span>
              <span style={{ color: "#dc2626" }}>출고 <strong>{totalOut(filteredPartTxs)}</strong></span>
            </span>
          </div>

          {/* 표 */}
          <div style={{ border: "1px solid #cbd5e1", borderRadius: "10px", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            {filteredPartTxs.length === 0 ? (
              <div style={emptyStyle}>내역이 없습니다.</div>
            ) : (
              <table style={tbl}>
                <thead>
                  <tr>
                    <Th width="110px">날짜</Th>
                    <Th width="90px" center>구분</Th>
                    <Th>부품명</Th>
                    <Th width="80px" center>단위</Th>
                    <Th width="110px" center>수량</Th>
                    <Th>현장명</Th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPartTxs.map((tx, i) => (
                    <tr key={tx.id} style={{ background: i % 2 === 0 ? "white" : "#f8fafc" }}>
                      <td style={td}>{fmt(tx.createdAt)}</td>
                      <td style={{ ...td, textAlign: "center" }}>
                        <TypeBadge type={tx.type} />
                      </td>
                      <td style={{ ...td, fontWeight: 500 }}>{tx.part.name}</td>
                      <td style={{ ...td, textAlign: "center", color: "var(--muted)", fontSize: "12px" }}>{tx.part.unit}</td>
                      <td style={{ ...td, textAlign: "center", fontWeight: 700, fontSize: "15px",
                        color: tx.type === "IN" ? "#16a34a" : "#dc2626" }}>
                        {tx.type === "IN" ? "+" : "−"}{tx.quantity}
                      </td>
                      <td style={{ ...td, padding: "6px 10px" }}>
                        {editingId?.type === "part" && editingId.id === tx.id ? (
                          <div style={{ display: "flex", gap: "4px" }}>
                            <input ref={editRef} value={editingNote} onChange={e => setEditingNote(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") saveNote(); if (e.key === "Escape") setEditingId(null); }}
                              style={{ flex: 1, padding: "4px 8px", border: "1px solid #7c3aed", borderRadius: "5px", fontSize: "13px", outline: "none" }} />
                            <button onClick={saveNote} style={{ padding: "4px 10px", background: "#7c3aed", color: "white", border: "none", borderRadius: "5px", fontSize: "12px", cursor: "pointer" }}>저장</button>
                            <button onClick={() => setEditingId(null)} style={{ padding: "4px 8px", background: "#e2e8f0", border: "none", borderRadius: "5px", fontSize: "12px", cursor: "pointer" }}>취소</button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }} onClick={() => startEdit("part", tx.id, tx.note)}>
                            <span style={{ color: tx.note ? "var(--foreground)" : "var(--muted)" }}>{tx.note || "—"}</span>
                            <Pencil size={12} color="#94a3b8" />
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: "#1a3a2a" }}>
                    <td colSpan={3} style={footTd}>입고 소계</td>
                    <td style={{ ...footTd, textAlign: "center" }}>
                      <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: 600, background: "#dcfce7", color: "#16a34a" }}>입고</span>
                    </td>
                    <td style={{ ...footTd, textAlign: "center", color: "#86efac", fontSize: "16px", fontWeight: 700 }}>
                      +{totalIn(filteredPartTxs)}
                    </td>
                    <td style={footTd} />
                  </tr>
                  <tr style={{ background: "#3a1a1a" }}>
                    <td colSpan={3} style={{ ...footTd, borderTop: "1px solid #4b1a1a" }}>출고 소계</td>
                    <td style={{ ...footTd, textAlign: "center", borderTop: "1px solid #4b1a1a" }}>
                      <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: 600, background: "#fee2e2", color: "#dc2626" }}>출고</span>
                    </td>
                    <td style={{ ...footTd, textAlign: "center", color: "#fca5a5", fontSize: "16px", fontWeight: 700, borderTop: "1px solid #4b1a1a" }}>
                      −{totalOut(filteredPartTxs)}
                    </td>
                    <td style={{ ...footTd, borderTop: "1px solid #4b1a1a" }} />
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── 공용 컴포넌트 ── */

function Th({ children, width, center }: { children: React.ReactNode; width?: string; center?: boolean }) {
  return (
    <th style={{ padding: "11px 16px", background: "#334155", color: "white", fontWeight: 600, fontSize: "13px",
      whiteSpace: "nowrap", textAlign: center ? "center" : "left",
      borderRight: "1px solid #475569", width }}>
      {children}
    </th>
  );
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span style={{ padding: "3px 10px", borderRadius: "4px", fontSize: "12px", fontWeight: 600,
      background: type === "IN" ? "#dcfce7" : "#fee2e2",
      color: type === "IN" ? "#16a34a" : "#dc2626" }}>
      {type === "IN" ? "입고" : "출고"}
    </span>
  );
}

function VariantBadge({ variant }: { variant: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    Master: { bg: "#dbeafe", color: "#1d4ed8" },
    Slave:  { bg: "#dcfce7", color: "#15803d" },
    Center: { bg: "#fce7f3", color: "#be185d" },
  };
  const s = map[variant] ?? { bg: "#f1f5f9", color: "#475569" };
  return <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: 600, ...s }}>{variant}</span>;
}

/* ── 스타일 상수 ── */
const sel:       React.CSSProperties = { padding: "7px 11px", borderRadius: "7px", border: "1px solid var(--border)", fontSize: "13px", background: "white", cursor: "pointer", outline: "none" };
const emptyStyle: React.CSSProperties = { padding: "48px", textAlign: "center", color: "var(--muted)", fontSize: "14px", background: "white" };
const tbl:       React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: "14px" };
const td:        React.CSSProperties = { padding: "10px 16px", borderBottom: "1px solid #e2e8f0", borderRight: "1px solid #e2e8f0", verticalAlign: "middle" };
const footTd:    React.CSSProperties = { padding: "10px 16px", color: "white", fontWeight: 600, borderTop: "2px solid #0f172a", borderRight: "1px solid #374151", verticalAlign: "middle" };
