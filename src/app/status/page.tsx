"use client";

import { useState, useEffect, useCallback } from "react";

interface TxItem {
  id: number;
  type: string;
  quantity: number;
  note: string | null;
  addon: string | null;
  spec: string | null;
  date: string;
  createdAt: string;
  item: {
    id: number; name: string;
    subcategory: { name: string; category: { id: number; name: string } };
  };
}

interface Category { id: number; name: string }

const thStyle: React.CSSProperties = {
  padding: "10px 14px", fontSize: "12px", fontWeight: 600, color: "var(--muted)",
  textAlign: "left", background: "#f8fafc", borderBottom: "1px solid var(--border)",
  whiteSpace: "nowrap",
};
const tdStyle: React.CSSProperties = {
  padding: "10px 14px", fontSize: "13px", borderBottom: "1px solid var(--border)",
};

const inputStyle: React.CSSProperties = {
  padding: "8px 12px", border: "1px solid var(--border)", borderRadius: "8px",
  fontSize: "13px", outline: "none",
};

export default function StatusPage() {
  const [transactions, setTransactions] = useState<TxItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filterCat, setFilterCat] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editNote, setEditNote] = useState("");
  const [editAddon, setEditAddon] = useState("");
  const [editSpec, setEditSpec] = useState("");
  const [editDate, setEditDate] = useState("");

  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(setCategories);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterType) params.set("type", filterType);
    if (filterFrom) params.set("from", filterFrom);
    if (filterTo) params.set("to", filterTo);
    const data: TxItem[] = await fetch(`/api/transactions?${params}`).then(r => r.json());
    const filtered = filterCat
      ? data.filter(t => String(t.item.subcategory.category.id) === filterCat)
      : data;
    setTransactions(filtered);
    setLoading(false);
  }, [filterCat, filterType, filterFrom, filterTo]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { alert(data.error); return; }
    load();
  };

  const startEdit = (tx: TxItem) => {
    setEditId(tx.id);
    setEditNote(tx.note ?? "");
    setEditAddon(tx.addon ?? "");
    setEditSpec(tx.spec ?? "");
    setEditDate(tx.date.slice(0, 10));
  };

  const handleEdit = async () => {
    if (!editId) return;
    const res = await fetch(`/api/transactions/${editId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ note: editNote, addon: editAddon, spec: editSpec, date: editDate }),
    });
    if (!res.ok) { alert("수정 실패"); return; }
    setEditId(null);
    load();
  };

  const isGate = (tx: TxItem) => tx.item.subcategory.category.name === "GATE";

  return (
    <div>
      <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--foreground)", marginBottom: "24px" }}>입출고 현황</h1>

      {/* 필터 */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
        <select style={inputStyle} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="">전체 대분류</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select style={inputStyle} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">전체 유형</option>
          <option value="IN">입고</option>
          <option value="OUT">출고</option>
        </select>
        <input type="date" style={inputStyle} value={filterFrom} onChange={e => setFilterFrom(e.target.value)} placeholder="시작일" />
        <span style={{ fontSize: "13px", color: "var(--muted)" }}>~</span>
        <input type="date" style={inputStyle} value={filterTo} onChange={e => setFilterTo(e.target.value)} placeholder="종료일" />
        <button onClick={() => { setFilterCat(""); setFilterType(""); setFilterFrom(""); setFilterTo(""); }}
          style={{ padding: "8px 14px", border: "1px solid var(--border)", borderRadius: "8px", background: "white", fontSize: "13px", cursor: "pointer" }}>
          초기화
        </button>
      </div>

      <div style={{ overflowX: "auto", background: "white", borderRadius: "12px", border: "1px solid var(--border)" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>불러오는 중...</div>
        ) : transactions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)", fontSize: "14px" }}>
            내역이 없습니다.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["날짜", "유형", "대분류", "소분류", "모델", "수량", "현장/비고", "추가모듈", "세부사양", ""].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                editId === tx.id ? (
                  <tr key={tx.id} style={{ background: "#f0f4ff" }}>
                    <td style={tdStyle}>
                      <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)}
                        style={{ padding: "4px 8px", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "12px" }} />
                    </td>
                    <td style={tdStyle}>
                      <span style={{ color: tx.type === "IN" ? "#4f86f7" : "#48bb78", fontWeight: 600 }}>
                        {tx.type === "IN" ? "입고" : "출고"}
                      </span>
                    </td>
                    <td style={tdStyle}>{tx.item.subcategory.category.name}</td>
                    <td style={tdStyle}>{tx.item.subcategory.name || "-"}</td>
                    <td style={tdStyle}>{tx.item.name}</td>
                    <td style={tdStyle}>{tx.quantity}</td>
                    <td style={tdStyle}>
                      <input value={editNote} onChange={e => setEditNote(e.target.value)}
                        style={{ padding: "4px 8px", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "12px", width: "100px" }} />
                    </td>
                    <td style={tdStyle}>
                      {isGate(tx) ? (
                        <input value={editAddon} onChange={e => setEditAddon(e.target.value)}
                          style={{ padding: "4px 8px", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "12px", width: "80px" }} />
                      ) : "-"}
                    </td>
                    <td style={tdStyle}>
                      {isGate(tx) ? (
                        <input value={editSpec} onChange={e => setEditSpec(e.target.value)}
                          style={{ padding: "4px 8px", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "12px", width: "80px" }} />
                      ) : "-"}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button onClick={handleEdit} style={{ padding: "4px 10px", background: "var(--primary)", color: "white", border: "none", borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}>저장</button>
                        <button onClick={() => setEditId(null)} style={{ padding: "4px 10px", background: "#f1f5f9", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}>취소</button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={tx.id} style={{ transition: "background 0.1s" }}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "#f8fafc"}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "white"}>
                    <td style={tdStyle}>{tx.date.slice(0, 10)}</td>
                    <td style={tdStyle}>
                      <span style={{
                        display: "inline-block", padding: "3px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: 600,
                        background: tx.type === "IN" ? "#ebf4ff" : "#f0fff4",
                        color: tx.type === "IN" ? "#4f86f7" : "#48bb78",
                      }}>
                        {tx.type === "IN" ? "입고" : "출고"}
                      </span>
                    </td>
                    <td style={tdStyle}>{tx.item.subcategory.category.name}</td>
                    <td style={tdStyle}>{tx.item.subcategory.name || "-"}</td>
                    <td style={tdStyle}>{tx.item.name}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{tx.quantity}</td>
                    <td style={tdStyle}>{tx.note || "-"}</td>
                    <td style={tdStyle}>{isGate(tx) ? (tx.addon || "-") : "-"}</td>
                    <td style={tdStyle}>{isGate(tx) ? (tx.spec || "-") : "-"}</td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button onClick={() => startEdit(tx)} style={{ padding: "4px 10px", background: "#f1f5f9", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}>수정</button>
                        <button onClick={() => handleDelete(tx.id)} style={{ padding: "4px 10px", background: "#fff5f5", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}>삭제</button>
                      </div>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
