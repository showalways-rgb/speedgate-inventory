"use client";

import { useEffect, useState } from "react";
import { BarChart2, Pencil, RefreshCw, Check, X, Trash2 } from "lucide-react";

interface Product { id: number; modelName: string; variant: string }
interface Part    { id: number; name: string; unit: string }

interface PartTx {
  id: number; type: string; quantity: number; note: string | null; createdAt: string;
  part: Part;
}
interface ProductTx {
  id: number; type: string; quantity: number; note: string | null; usedParts: string | null; createdAt: string;
  product: Product;
  partTransactions: PartTx[];
}

interface EditValues { date: string; type: string; quantity: string; note: string; usedParts: string }

const VARIANTS = ["Master", "Slave", "Center", "이동형"];

function toDateInput(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export default function StatusPage() {
  const [products, setProducts]   = useState<Product[]>([]);
  const [productTxs, setProductTxs] = useState<ProductTx[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [listError,  setListError]  = useState<string | null>(null);

  // 행 편집 상태
  const [editingId,     setEditingId]     = useState<{ type: "product"; id: number } | null>(null);
  const [editValues,    setEditValues]    = useState<EditValues>({ date: "", type: "IN", quantity: "", note: "", usedParts: "" });
  const [editError,     setEditError]     = useState("");
  const [editSaving,    setEditSaving]    = useState(false);

  // 삭제 확인 상태
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "product"; id: number } | null>(null);
  const [deleteError,   setDeleteError]   = useState("");

  // 필터 상태
  const [filterModel,   setFilterModel]   = useState("all");
  const [filterVariant, setFilterVariant] = useState("all");
  const [filterType,    setFilterType]    = useState("all");

  const fetchAll = () => {
    setLoading(true);
    setListError(null);
    Promise.all([
      fetch("/api/products").then(async r => ({ ok: r.ok, body: await r.json() })),
      fetch("/api/product-transactions").then(async r => ({ ok: r.ok, body: await r.json() })),
    ])
      .then(([prRes, ptxRes]) => {
        const pr = prRes.ok && Array.isArray(prRes.body) ? prRes.body : [];
        const ptx = ptxRes.ok && Array.isArray(ptxRes.body) ? ptxRes.body : [];
        setProducts(pr);
        setProductTxs(ptx);
        if (!ptxRes.ok) {
          const msg = typeof ptxRes.body?.error === "string" ? ptxRes.body.error : "제품 거래 목록을 불러오지 못했습니다.";
          setListError(msg);
        } else if (!Array.isArray(ptxRes.body)) {
          setListError("서버 응답 형식이 올바르지 않습니다.");
        }
      })
      .catch(() => {
        setProducts([]);
        setProductTxs([]);
        setListError("네트워크 오류로 목록을 불러오지 못했습니다.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const modelNames = [...new Set(products.map(p => p.modelName))].sort();

  const filteredProductTxs = productTxs.filter(tx => {
    if (!tx?.product) return false;
    if (filterModel   !== "all" && tx.product.modelName !== filterModel)   return false;
    if (filterVariant !== "all" && tx.product.variant   !== filterVariant) return false;
    if (filterType    !== "all" && tx.type              !== filterType)     return false;
    return true;
  });

  const totalIn  = (txs: { type: string; quantity: number }[]) => txs.filter(t => t.type === "IN" ).reduce((s, t) => s + t.quantity, 0);
  const totalOut = (txs: { type: string; quantity: number }[]) => txs.filter(t => t.type === "OUT").reduce((s, t) => s + t.quantity, 0);
  const fmt = (d: string) => new Date(d).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });

  const displayUsedParts = (tx: ProductTx) => {
    const u = typeof tx.usedParts === "string" ? tx.usedParts.trim() : "";
    if (u) return u;
    const pts = Array.isArray(tx.partTransactions) ? tx.partTransactions : [];
    if (pts.length === 0) return "";
    return pts
      .filter((pt): pt is PartTx & { part: Part } => Boolean(pt?.part?.name))
      .map(pt => `${pt.part.name} ×${pt.quantity}`)
      .join(", ");
  };

  const startEdit = (txType: "product", tx: ProductTx) => {
    setEditingId({ type: txType, id: tx.id });
    setEditValues({
      date: toDateInput(tx.createdAt),
      type: tx.type,
      quantity: String(tx.quantity),
      note: tx.note ?? "",
      usedParts: typeof tx.usedParts === "string" ? tx.usedParts : "",
    });
    setEditError("");
  };

  const cancelEdit = () => { setEditingId(null); setEditError(""); };

  const saveEdit = async () => {
    if (!editingId) return;
    setEditSaving(true); setEditError("");
    const url = `/api/product-transactions/${editingId.id}`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: editValues.type,
        quantity: Number(editValues.quantity),
        note: editValues.note || null,
        usedParts: editValues.usedParts.trim() || null,
        date: editValues.date,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setEditError(data.error ?? "수정 실패");
    } else {
      if (editingId.type === "product") {
        setProductTxs(prev => prev.map(tx => tx.id === editingId.id ? { ...tx, ...data } : tx));
      }
      setEditingId(null);
    }
    setEditSaving(false);
  };

  const isEditingRow = (txType: "product", id: number) =>
    editingId?.type === txType && editingId.id === id;

  const confirmDelete = (txType: "product", id: number) => {
    setDeleteConfirm({ type: txType, id });
    setDeleteError("");
    setEditingId(null);
  };

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    const url = `/api/product-transactions/${deleteConfirm.id}`;
    const res = await fetch(url, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setDeleteError(data.error ?? "삭제 실패");
    } else {
      if (deleteConfirm.type === "product") {
        setProductTxs(prev => prev.filter(tx => tx.id !== deleteConfirm.id));
      }
      setDeleteConfirm(null);
    }
  };

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

      {loading ? (
        <div style={{ padding: "60px", textAlign: "center", color: "var(--muted)" }}>로딩 중...</div>
      ) : (
        /* ── 제품 입출고 ── */
        <div>
          {listError && (
            <div style={{ marginBottom: "16px", padding: "12px 14px", borderRadius: "8px", background: "#fff5f5", border: "1px solid #fecaca", color: "#9b1c1c", fontSize: "14px" }}>
              {listError}
              <span style={{ display: "block", marginTop: "6px", fontSize: "12px", color: "#7f1d1d" }}>
                DB에 <code style={{ background: "#fee2e2", padding: "0 4px", borderRadius: "4px" }}>usedParts</code> 컬럼이 없으면 이 오류가 납니다. Supabase SQL 편집기에서 한 번 실행해 주세요:{" "}
                <code style={{ display: "block", marginTop: "6px", padding: "8px", background: "#fff", borderRadius: "6px", fontSize: "11px", wordBreak: "break-all" }}>
                  {`ALTER TABLE "ProductTransaction" ADD COLUMN IF NOT EXISTS "usedParts" TEXT;`}
                </code>
              </span>
            </div>
          )}
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

          <div style={{ border: "1px solid var(--border)", borderRadius: "10px", overflow: "auto", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
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
                    <Th width="140px">현장명</Th>
                    <Th>사용 부품</Th>
                    <Th width="90px" center>관리</Th>
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
                            <td style={{ ...td, fontWeight: 600, color: "var(--muted)" }}>
                              {tx.product.variant === "이동형"
                                ? `${tx.product.modelName}M`
                                : tx.product.modelName}
                            </td>
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
                            <td style={td}>
                              <textarea
                                value={editValues.usedParts}
                                onChange={e => setEditValues(v => ({ ...v, usedParts: e.target.value }))}
                                placeholder="사용 부품 입력"
                                rows={2}
                                style={{ ...inpSt, minHeight: "44px", resize: "vertical" }}
                              />
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
                            <td style={{ ...td, fontWeight: 600 }}>
                              {tx.product.variant === "이동형"
                                ? `${tx.product.modelName}M`
                                : tx.product.modelName}
                            </td>
                            <td style={{ ...td, textAlign: "center" }}><VariantBadge variant={tx.product.variant} /></td>
                            <td style={{ ...td, textAlign: "center", fontWeight: 700, fontSize: "15px",
                              color: tx.type === "IN" ? "#276749" : "#c53030" }}>
                              {tx.type === "IN" ? "+" : "−"}{tx.quantity}
                            </td>
                            <td style={{ ...td, color: tx.note ? "var(--foreground)" : "var(--muted)" }}>
                              {tx.note || "—"}
                            </td>
                            <td style={{ ...td, whiteSpace: "pre-wrap", color: displayUsedParts(tx) ? "var(--foreground)" : "var(--muted)" }}>
                              {displayUsedParts(tx) || "—"}
                            </td>
                            <td style={{ ...td, textAlign: "center" }}>
                              {deleteConfirm?.type === "product" && deleteConfirm.id === tx.id ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "center" }}>
                                  <span style={{ fontSize: "11px", color: "#c53030", whiteSpace: "nowrap" }}>삭제 확인</span>
                                  {deleteError && <span style={{ fontSize: "10px", color: "#c53030" }}>{deleteError}</span>}
                                  <div style={{ display: "flex", gap: "4px" }}>
                                    <button onClick={executeDelete} style={actionBtn("#fee2e2", "#c53030")} title="삭제 확인"><Check size={13} /></button>
                                    <button onClick={() => setDeleteConfirm(null)} style={actionBtn("#f1f5f9", "#64748b")} title="취소"><X size={13} /></button>
                                  </div>
                                </div>
                              ) : (
                                <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                                  <button onClick={() => startEdit("product", tx)} style={actionBtn("#eef2ff", "#5b6ee8")} title="수정"><Pencil size={13} /></button>
                                  <button onClick={() => confirmDelete("product", tx.id)} style={actionBtn("#fff0f0", "#e05c5c")} title="삭제"><Trash2 size={13} /></button>
                                </div>
                              )}
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
                    <td colSpan={3} style={footTdIn} />
                  </tr>
                  <tr style={{ background: "#fff5f5" }}>
                    <td colSpan={3} style={{ ...footTdOut, borderTop: "1px solid #fed7d7" }}>출고 소계</td>
                    <td style={{ ...footTdOut, textAlign: "center", borderTop: "1px solid #fed7d7" }}>
                      <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: 600, background: "#fed7d7", color: "#c53030" }}>출고</span>
                    </td>
                    <td style={{ ...footTdOut, textAlign: "center", color: "#c53030", fontSize: "16px", fontWeight: 700, borderTop: "1px solid #fed7d7" }}>
                      −{totalOut(filteredProductTxs)}대
                    </td>
                    <td colSpan={3} style={{ ...footTdOut, borderTop: "1px solid #fed7d7" }} />
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
    이동형:  { bg: "#fef9c3", color: "#854d0e" },
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
