"use client";

import { useEffect, useState } from "react";
import { Package, RefreshCw, Pencil, Check, X, Trash2 } from "lucide-react";

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

  // 부품명·단위 인라인 수정
  const [editingPartId, setEditingPartId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editUnit, setEditUnit] = useState("");
  const [editQty, setEditQty] = useState("");
  const [editError, setEditError] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [deletingPartId, setDeletingPartId] = useState<number | null>(null);

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

  // 제품: modelName별로 그룹핑 (재고가 하나라도 있는 모델만 표시 — 전부 0이면 화면 비움)
  const allModels = Array.from(new Set(productStocks.map(s => s.product.modelName))).sort();

  const getProductQty = (modelName: string, variant: string) =>
    productStocks.find(s => s.product.modelName === modelName && s.product.variant === variant)?.quantity ?? 0;

  const models = allModels.filter((modelName) =>
    VARIANTS.some((v) => getProductQty(modelName, v) > 0)
  );

  const partsWithStock = partStocks.filter((s) => s.quantity > 0);

  const startPartEdit = (s: PartStock) => {
    setEditingPartId(s.partId);
    setEditName(s.part.name);
    setEditUnit(s.part.unit);
    setEditQty(String(s.quantity));
    setEditError("");
  };

  const cancelPartEdit = () => {
    setEditingPartId(null);
    setEditName("");
    setEditUnit("");
    setEditQty("");
    setEditError("");
  };

  const savePartEdit = async () => {
    if (editingPartId == null) return;
    const name = editName.trim();
    const qty = Number(editQty);
    if (!name) {
      setEditError("부품명을 입력하세요.");
      return;
    }
    if (!Number.isInteger(qty) || qty < 0) {
      setEditError("수량은 0 이상의 정수로 입력하세요.");
      return;
    }
    const original = partStocks.find(x => x.partId === editingPartId);
    if (!original) {
      setEditError("대상을 찾을 수 없습니다.");
      return;
    }
    setEditSaving(true);
    setEditError("");

    const unit = editUnit.trim() || "EA";
    const needMetaUpdate = name !== original.part.name || unit !== original.part.unit;
    if (needMetaUpdate) {
      const res = await fetch(`/api/parts/${editingPartId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, unit }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditSaving(false);
        setEditError(typeof data.error === "string" ? data.error : "수정에 실패했습니다.");
        return;
      }
    }

    const diff = qty - original.quantity;
    if (diff !== 0) {
      const res = await fetch("/api/part-transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partId: editingPartId,
          type: diff > 0 ? "IN" : "OUT",
          quantity: Math.abs(diff),
          note: "현재고 화면 수동 조정",
          date: new Date().toISOString().slice(0, 10),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditSaving(false);
        setEditError(typeof data.error === "string" ? data.error : "수량 조정에 실패했습니다.");
        return;
      }
    }

    fetchData();
    cancelPartEdit();
    setEditSaving(false);
  };

  const deletePart = async (partId: number) => {
    if (!window.confirm("이 부품을 삭제할까요? 관련 부품 입출고 내역도 함께 삭제됩니다.")) return;
    setDeletingPartId(partId);
    const res = await fetch(`/api/parts/${partId}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      window.alert(typeof data.error === "string" ? data.error : "삭제에 실패했습니다.");
      setDeletingPartId(null);
      return;
    }
    setPartStocks(prev => prev.filter(x => x.partId !== partId));
    if (editingPartId === partId) cancelPartEdit();
    setDeletingPartId(null);
  };

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
            <EmptyBox>
              {allModels.length === 0 ? "등록된 제품이 없습니다." : "보유 중인 제품 재고가 없습니다."}
            </EmptyBox>
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
          {partsWithStock.length === 0 ? (
            <EmptyBox>
              {partStocks.length === 0 ? "등록된 부품이 없습니다." : "보유 중인 부품 재고가 없습니다."}
            </EmptyBox>
          ) : (
            <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: "12px", overflow: "auto", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", minWidth: "360px" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "2px solid var(--border)" }}>
                    <th style={th}>부품명</th>
                    <th style={{ ...th, textAlign: "center" }}>단위</th>
                    <th style={{ ...th, textAlign: "center" }}>현재고</th>
                    <th style={{ ...th, textAlign: "center" }}>상태</th>
                    <th style={{ ...th, textAlign: "center", width: "90px" }}>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {partsWithStock.map((s, i) => {
                    const low = s.quantity < 5;
                    const editing = editingPartId === s.partId;
                    const rowBg = editing ? "#f0f4ff" : i % 2 === 0 ? "white" : "#fafafa";
                    return (
                      <tr key={s.partId} style={{ borderBottom: i < partsWithStock.length - 1 ? "1px solid var(--border)" : "none", background: rowBg }}>
                        {editing ? (
                          <>
                            <td style={td}>
                              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                <input
                                  value={editName}
                                  onChange={e => setEditName(e.target.value)}
                                  placeholder="부품명"
                                  style={inp}
                                />
                                <input
                                  value={editUnit}
                                  onChange={e => setEditUnit(e.target.value)}
                                  placeholder="단위 (예: EA)"
                                  style={inp}
                                />
                                {editError && <span style={{ color: "#c53030", fontSize: "12px" }}>{editError}</span>}
                              </div>
                            </td>
                            <td style={{ ...td, textAlign: "center" }}>
                              <input
                                type="number"
                                min="0"
                                value={editQty}
                                onChange={e => setEditQty(e.target.value)}
                                style={{ ...inp, width: "86px", textAlign: "center", margin: "0 auto" }}
                              />
                            </td>
                            <td style={{ ...td, textAlign: "center" }}>
                              <span style={{ padding: "3px 10px", borderRadius: "4px", fontSize: "12px", fontWeight: 500,
                                background: s.quantity === 0 ? "#f7f8fc" : low ? "#fff0f0" : "#f0fff4",
                                color: s.quantity === 0 ? "#a0aec0" : low ? "#c53030" : "#276749" }}>
                                {s.quantity === 0 ? "재고 없음" : low ? "부족 주의" : "정상"}
                              </span>
                            </td>
                            <td style={{ ...td, textAlign: "center" }}>
                              <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                                <button type="button" onClick={savePartEdit} disabled={editSaving} style={actBtn("#d1fae5", "#276749")} title="저장"><Check size={13} /></button>
                                <button type="button" onClick={cancelPartEdit} disabled={editSaving} style={actBtn("#f1f5f9", "#64748b")} title="취소"><X size={13} /></button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
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
                            <td style={{ ...td, textAlign: "center" }}>
                              <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                                <button type="button" onClick={() => startPartEdit(s)} style={actBtn("#eef2ff", "#5b6ee8")} title="부품명·단위·수량 수정"><Pencil size={13} /></button>
                                <button type="button" onClick={() => deletePart(s.partId)} disabled={deletingPartId === s.partId} style={actBtn("#fff0f0", "#e05c5c")} title="삭제"><Trash2 size={13} /></button>
                              </div>
                            </td>
                          </>
                        )}
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
const inp: React.CSSProperties = { width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #c7d2fe", fontSize: "13px", outline: "none", background: "white" };
function actBtn(bg: string, color: string): React.CSSProperties {
  return { width: "30px", height: "30px", borderRadius: "6px", border: "none", background: bg, color, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" };
}
