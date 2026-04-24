"use client";

import { useEffect, useState } from "react";
import { BarChart2, Pencil, RefreshCw, Check, X } from "lucide-react";

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

interface EditValues { date: string; type: string; quantity: string; note: string }

const VARIANTS = ["Master", "Slave", "Center"];

function toDateInput(iso: string) {
  return new Date(iso).toISOString().slice(0, 10);
}

export default function StatusPage() {
  const [tab, setTab]             = useState<"product" | "part">("product");
  const [products, setProducts]   = useState<Product[]>([]);
  const [parts,    setParts]      = useState<Part[]>([]);
  const [productTxs, setProductTxs] = useState<ProductTx[]>([]);
  const [partTxs,    setPartTxs]    = useState<PartTx[]>([]);
  const [loading,    setLoading]    = useState(true);

  // 행 편집 상태
  const [editingId,     setEditingId]     = useState<{ type: "product" | "part"; id: number } | null>(null);
  const [editValues,    setEditValues]    = useState<EditValues>({ date: "", type: "IN", quantity: "", note: "" });
  const [editError,     setEditError]     = useState("");
  const [editSaving,    setEditSaving]    = useState(false);

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

  const startEdit = (txType: "product" | "part", tx: ProductTx | PartTx) => {
    setEditingId({ type: txType, id: tx.id });
    setEditValues({
      date: toDateInput(tx.createdAt),
      type: tx.type,
      quantity: String(tx.quantity),
      note: tx.note ?? "",
    });
    setEditError("");
  };

  const cancelEdit = () => { setEditingId(null); setEditError(""); };

  const saveEdit = async () => {
    if (!editingId) return;
    setEditSaving(true); setEditError("");
    const url = editingId.type === "product"
      ? `/api/product-transactions/${editingId.id}`
      : `/api/part-transactions/${editingId.id}`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: editValues.type,
        quantity: Number(editValues.quantity),
        note: editValues.note || null,
        date: editValues.date,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setEditError(data.error ?? "수정 실패");
    } else {
      if (editingId.type === "product") {
        setProductTxs(prev => prev.map(tx => tx.id === editingId.id ? { ...tx, ...data } : tx));
      } else {
        setPartTxs(prev => prev.map(tx => tx.id === editingId.id ? { ...tx, ...data } : tx));
      }
      setEditingId(null);
    }
    setEditSaving(false);
  };

  const isEditingRow = (txType: "product" | "part", id: number) =>
    editingId?.type === txType && editingId.id === id;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BarChart2 size={22} color="#5b6ee8" />
          </div>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0 }}>입출고 현황</h1>
            <p style={{ color: "var(--muted)", fontSize: "13px", marginTop: "2px" }}>모델·부품별 입고·출고 내역</p>
          </div>
        </div>
        <button onClick={fetchAll} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "8px", border: "1px solid var(--border)", background: "white", fontSize: "13px", cursor: "pointer", color: "var(--muted)" }}>
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
              <span>총 <strong style={{ color: "var(--foreground)" }}>{filteredProductTxs.length}</strong>건</span>
              <span style={{ color: "#276749" }}>입고 <strong>{totalIn(filteredProductTxs)}</strong>대</span>
              <span style={{ color: "#c53030" }}>출고 <strong>{totalOut(filteredProductTxs)}</strong>대</span>
            </span>
          </div>

          <div style={{ border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            {filteredProductTxs.length === 0 ? (
              <div style={emptyStyle}>내역이 없습니다.</div>
            ) : (
              <table style={tbl}>
                <thead>
                  <tr>
                    <Th width="120px">날짜</Th>
                    <Th width="90px" center>구분</Th>
                    <Th width="110px">모델명</Th>
                    <Th width="100px" center>파생</Th>
                    <Th width="100px" center>수량 (대)</Th>
                    <Th>현장명</Th>
                    <Th width="60px" center>수정</Th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProductTxs.map((tx, i) => {
                    const editing = isEditingRow("product", tx.id);
                    const rowBg = editing ? "#f0f4ff" : i % 2 === 0 ? "white" : "#fafbfd";
                    return (
                      <tr key={tx.id} style={{ background: rowBg }}>
                        {editing ? (
                          <>
                            <td style={td}>
                              <input type="date" value={editValues.date}
                                onChange={e => setEditValues(v => ({ ...v, date: e.target.value }))}
                                style={inpSt} />
                            </td>
                            <td style={{ ...td, textAlign: "center" }}>
                              <select value={editValues.type}
                                onChange={e => setEditValues(v => ({ ...v, type: e.target.value }))}
                                style={{ ...inpSt, width: "72px", textAlign: "center" }}>
                                <option value="IN">입고</option>
                                <option value="OUT">출고</option>
                              </select>
                            </td>
                            <td style={{ ...td, fontWeight: 600, color: "var(--muted)" }}>{tx.product.modelName}</td>
                            <td style={{ ...td, textAlign: "center" }}><VariantBadge variant={tx.product.variant} /></td>
                            <td style={{ ...td, textAlign: "center" }}>
                              <input type="number" min="1" value={editValues.quantity}
                                onChange={e => setEditValues(v => ({ ...v, quantity: e.target.value }))}
                                style={{ ...inpSt, width: "72px", textAlign: "center" }} />
                            </td>
                            <td style={td}>
                              <input type="text" value={editValues.note}
                                onChange={e => setEditValues(v => ({ ...v, note: e.target.value }))}
                                placeholder="현장명"
                                style={inpSt} />
                              {editError && <p style={{ color: "#c53030", fontSize: "11px", margin: "4px 0 0" }}>{editError}</p>}
                            </td>
                            <td style={{ ...td, textAlign: "center" }}>
                              <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                                <button onClick={saveEdit} disabled={editSaving}
                                  style={actionBtn("#d1fae5", "#276749")} title="저장">
                                  <Check size={13} />
                                </button>
                                <button onClick={cancelEdit}
                                  style={actionBtn("#f1f5f9", "#64748b")} title="취소">
                                  <X size={13} />
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td style={td}>{fmt(tx.createdAt)}</td>
                            <td style={{ ...td, textAlign: "center" }}><TypeBadge type={tx.type} /></td>
                            <td style={{ ...td, fontWeight: 600 }}>{tx.product.modelName}</td>
                            <td style={{ ...td, textAlign: "center" }}><VariantBadge variant={tx.product.variant} /></td>
                            <td style={{ ...td, textAlign: "center", fontWeight: 700, fontSize: "15px",
                              color: tx.type === "IN" ? "#276749" : "#c53030" }}>
                              {tx.type === "IN" ? "+" : "−"}{tx.quantity}
                            </td>
                            <td style={{ ...td, color: tx.note ? "var(--foreground)" : "var(--muted)" }}>{tx.note || "—"}</td>
                            <td style={{ ...td, textAlign: "center" }}>
                              <button onClick={() => startEdit("product", tx)}
                                style={actionBtn("#eef2ff", "#5b6ee8")} title="수정">
                                <Pencil size={13} />
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: "#f0fff4" }}>
                    <td colSpan={3} style={footTdIn}>입고 소계</td>
                    <td style={{ ...footTdIn, textAlign: "center" }}>
                      <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: 600, background: "#c6f6d5", color: "#276749" }}>입고</span>
                    </td>
                    <td style={{ ...footTdIn, textAlign: "center", color: "#276749", fontSize: "16px", fontWeight: 700 }}>
                      +{totalIn(filteredProductTxs)}대
                    </td>
                    <td colSpan={2} style={footTdIn} />
                  </tr>
                  <tr style={{ background: "#fff5f5" }}>
                    <td colSpan={3} style={{ ...footTdOut, borderTop: "1px solid #fed7d7" }}>출고 소계</td>
                    <td style={{ ...footTdOut, textAlign: "center", borderTop: "1px solid #fed7d7" }}>
                      <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: 600, background: "#fed7d7", color: "#c53030" }}>출고</span>
                    </td>
                    <td style={{ ...footTdOut, textAlign: "center", color: "#c53030", fontSize: "16px", fontWeight: 700, borderTop: "1px solid #fed7d7" }}>
                      −{totalOut(filteredProductTxs)}대
                    </td>
                    <td colSpan={2} style={{ ...footTdOut, borderTop: "1px solid #fed7d7" }} />
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>
      ) : (
        /* ── 부품 입출고 ── */
        <div>
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
              <span>총 <strong style={{ color: "var(--foreground)" }}>{filteredPartTxs.length}</strong>건</span>
              <span style={{ color: "#276749" }}>입고 <strong>{totalIn(filteredPartTxs)}</strong></span>
              <span style={{ color: "#c53030" }}>출고 <strong>{totalOut(filteredPartTxs)}</strong></span>
            </span>
          </div>

          <div style={{ border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            {filteredPartTxs.length === 0 ? (
              <div style={emptyStyle}>내역이 없습니다.</div>
            ) : (
              <table style={tbl}>
                <thead>
                  <tr>
                    <Th width="120px">날짜</Th>
                    <Th width="90px" center>구분</Th>
                    <Th>부품명</Th>
                    <Th width="80px" center>단위</Th>
                    <Th width="110px" center>수량</Th>
                    <Th>현장명</Th>
                    <Th width="60px" center>수정</Th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPartTxs.map((tx, i) => {
                    const editing = isEditingRow("part", tx.id);
                    const rowBg = editing ? "#f0f4ff" : i % 2 === 0 ? "white" : "#fafbfd";
                    return (
                      <tr key={tx.id} style={{ background: rowBg }}>
                        {editing ? (
                          <>
                            <td style={td}>
                              <input type="date" value={editValues.date}
                                onChange={e => setEditValues(v => ({ ...v, date: e.target.value }))}
                                style={inpSt} />
                            </td>
                            <td style={{ ...td, textAlign: "center" }}>
                              <select value={editValues.type}
                                onChange={e => setEditValues(v => ({ ...v, type: e.target.value }))}
                                style={{ ...inpSt, width: "72px", textAlign: "center" }}>
                                <option value="IN">입고</option>
                                <option value="OUT">출고</option>
                              </select>
                            </td>
                            <td style={{ ...td, fontWeight: 500, color: "var(--muted)" }}>{tx.part.name}</td>
                            <td style={{ ...td, textAlign: "center", color: "var(--muted)", fontSize: "12px" }}>{tx.part.unit}</td>
                            <td style={{ ...td, textAlign: "center" }}>
                              <input type="number" min="1" value={editValues.quantity}
                                onChange={e => setEditValues(v => ({ ...v, quantity: e.target.value }))}
                                style={{ ...inpSt, width: "72px", textAlign: "center" }} />
                            </td>
                            <td style={td}>
                              <input type="text" value={editValues.note}
                                onChange={e => setEditValues(v => ({ ...v, note: e.target.value }))}
                                placeholder="현장명"
                                style={inpSt} />
                              {editError && <p style={{ color: "#c53030", fontSize: "11px", margin: "4px 0 0" }}>{editError}</p>}
                            </td>
                            <td style={{ ...td, textAlign: "center" }}>
                              <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                                <button onClick={saveEdit} disabled={editSaving}
                                  style={actionBtn("#d1fae5", "#276749")} title="저장">
                                  <Check size={13} />
                                </button>
                                <button onClick={cancelEdit}
                                  style={actionBtn("#f1f5f9", "#64748b")} title="취소">
                                  <X size={13} />
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td style={td}>{fmt(tx.createdAt)}</td>
                            <td style={{ ...td, textAlign: "center" }}><TypeBadge type={tx.type} /></td>
                            <td style={{ ...td, fontWeight: 500 }}>{tx.part.name}</td>
                            <td style={{ ...td, textAlign: "center", color: "var(--muted)", fontSize: "12px" }}>{tx.part.unit}</td>
                            <td style={{ ...td, textAlign: "center", fontWeight: 700, fontSize: "15px",
                              color: tx.type === "IN" ? "#276749" : "#c53030" }}>
                              {tx.type === "IN" ? "+" : "−"}{tx.quantity}
                            </td>
                            <td style={{ ...td, color: tx.note ? "var(--foreground)" : "var(--muted)" }}>{tx.note || "—"}</td>
                            <td style={{ ...td, textAlign: "center" }}>
                              <button onClick={() => startEdit("part", tx)}
                                style={actionBtn("#eef2ff", "#5b6ee8")} title="수정">
                                <Pencil size={13} />
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: "#f0fff4" }}>
                    <td colSpan={3} style={footTdIn}>입고 소계</td>
                    <td style={{ ...footTdIn, textAlign: "center" }}>
                      <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: 600, background: "#c6f6d5", color: "#276749" }}>입고</span>
                    </td>
                    <td style={{ ...footTdIn, textAlign: "center", color: "#276749", fontSize: "16px", fontWeight: 700 }}>
                      +{totalIn(filteredPartTxs)}
                    </td>
                    <td colSpan={2} style={footTdIn} />
                  </tr>
                  <tr style={{ background: "#fff5f5" }}>
                    <td colSpan={3} style={{ ...footTdOut, borderTop: "1px solid #fed7d7" }}>출고 소계</td>
                    <td style={{ ...footTdOut, textAlign: "center", borderTop: "1px solid #fed7d7" }}>
                      <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: 600, background: "#fed7d7", color: "#c53030" }}>출고</span>
                    </td>
                    <td style={{ ...footTdOut, textAlign: "center", color: "#c53030", fontSize: "16px", fontWeight: 700, borderTop: "1px solid #fed7d7" }}>
                      −{totalOut(filteredPartTxs)}
                    </td>
                    <td colSpan={2} style={{ ...footTdOut, borderTop: "1px solid #fed7d7" }} />
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
    <th style={{ padding: "11px 16px", background: "#f7f8fc", color: "#4a5568", fontWeight: 600, fontSize: "13px",
      whiteSpace: "nowrap", textAlign: center ? "center" : "left",
      borderRight: "1px solid var(--border)", borderBottom: "2px solid var(--border)", width }}>
      {children}
    </th>
  );
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span style={{ padding: "3px 10px", borderRadius: "4px", fontSize: "12px", fontWeight: 600,
      background: type === "IN" ? "#d1fae5" : "#fee2e2",
      color: type === "IN" ? "#276749" : "#c53030" }}>
      {type === "IN" ? "입고" : "출고"}
    </span>
  );
}

function VariantBadge({ variant }: { variant: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    Master: { bg: "#e0e7ff", color: "#4338ca" },
    Slave:  { bg: "#d1fae5", color: "#065f46" },
    Center: { bg: "#fdf4ff", color: "#7e22ce" },
  };
  const s = map[variant] ?? { bg: "#f1f5f9", color: "#475569" };
  return <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: 600, ...s }}>{variant}</span>;
}

/* ── 스타일 상수 ── */
const sel:       React.CSSProperties = { padding: "7px 11px", borderRadius: "7px", border: "1px solid var(--border)", fontSize: "13px", background: "white", cursor: "pointer", outline: "none", color: "var(--foreground)" };
const emptyStyle: React.CSSProperties = { padding: "48px", textAlign: "center", color: "var(--muted)", fontSize: "14px", background: "white" };
const tbl:       React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: "14px" };
const td:        React.CSSProperties = { padding: "9px 12px", borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)", verticalAlign: "middle" };
const inpSt:     React.CSSProperties = { padding: "5px 8px", border: "1px solid #c7d2fe", borderRadius: "6px", fontSize: "13px", outline: "none", background: "white", width: "100%" };
const footTdIn:  React.CSSProperties = { padding: "10px 16px", color: "#276749", fontWeight: 600, borderTop: "2px solid #c6f6d5", borderRight: "1px solid #c6f6d5", verticalAlign: "middle" };
const footTdOut: React.CSSProperties = { padding: "10px 16px", color: "#c53030", fontWeight: 600, borderRight: "1px solid #fed7d7", verticalAlign: "middle" };
function actionBtn(bg: string, color: string): React.CSSProperties {
  return { width: "28px", height: "28px", borderRadius: "6px", border: "none", background: bg, color, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 };
}
