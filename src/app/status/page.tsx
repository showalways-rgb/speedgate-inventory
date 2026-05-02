"use client";

import { useState, useEffect, useCallback } from "react";

interface TxItem {
  id: number;
  type: string;
  quantity: number;
  note: string | null;
  addon: string | null;
  price: number | null;
  date: string;
  createdAt: string;
  item: {
    id: number;
    name: string;
    subcategory: {
      id: number;
      name: string;
      category: { id: number; name: string };
    };
  };
}

interface Category {
  id: number;
  name: string;
}

interface SubcategoryRow {
  id: number;
  name: string;
}

interface ItemRow {
  id: number;
  name: string;
}

const thStyle: React.CSSProperties = {
  padding: "10px 14px",
  fontSize: "12px",
  fontWeight: 600,
  color: "var(--muted)",
  textAlign: "left",
  background: "#f8fafc",
  borderBottom: "1px solid var(--border)",
  whiteSpace: "nowrap",
};
const tdStyle: React.CSSProperties = {
  padding: "10px 14px",
  fontSize: "13px",
  borderBottom: "1px solid var(--border)",
};
const inputStyle: React.CSSProperties = {
  padding: "8px 12px",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  fontSize: "13px",
  outline: "none",
};

const fmt = (n: number) => n.toLocaleString("ko-KR");

export default function StatusPage() {
  const [transactions, setTransactions] = useState<TxItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryRow[]>([]);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [filterCat, setFilterCat] = useState("");
  const [filterSub, setFilterSub] = useState("");
  const [filterItem, setFilterItem] = useState("");
  const [filterType, setFilterType] = useState("");
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editNote, setEditNote] = useState("");
  const [editAddon, setEditAddon] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDate, setEditDate] = useState("");

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories);
  }, []);

  useEffect(() => {
    setFilterSub("");
    setFilterItem("");
    setItems([]);
    if (!filterCat) {
      setSubcategories([]);
      return;
    }
    fetch(`/api/subcategories?categoryId=${filterCat}`)
      .then((r) => r.json())
      .then(setSubcategories);
  }, [filterCat]);

  useEffect(() => {
    setFilterItem("");
    if (!filterSub) {
      setItems([]);
      return;
    }
    fetch(`/api/items?subcategoryId=${filterSub}`)
      .then((r) => r.json())
      .then(setItems);
  }, [filterSub]);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterType) params.set("type", filterType);
    const data: TxItem[] = await fetch(`/api/transactions?${params}`).then((r) => r.json());
    const filtered = data
      .filter((t) => !filterCat || String(t.item.subcategory.category.id) === filterCat)
      .filter((t) => !filterSub || String(t.item.subcategory.id) === filterSub)
      .filter((t) => !filterItem || String(t.item.id) === filterItem);
    setTransactions(filtered);
    setLoading(false);
  }, [filterCat, filterSub, filterItem, filterType]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error);
      return;
    }
    load();
  };

  const startEdit = (tx: TxItem) => {
    setEditId(tx.id);
    setEditNote(tx.note ?? "");
    setEditAddon(tx.addon ?? "");
    setEditPrice(tx.price != null ? fmt(tx.price) : "");
    setEditDate(tx.date.slice(0, 10));
  };

  const handleEditPriceChange = (val: string) => {
    const numeric = val.replace(/[^0-9]/g, "");
    setEditPrice(numeric ? Number(numeric).toLocaleString("ko-KR") : "");
  };

  const handleEdit = async () => {
    if (!editId) return;
    const priceNum = editPrice ? Number(editPrice.replace(/,/g, "")) : null;
    const res = await fetch(`/api/transactions/${editId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ note: editNote, addon: editAddon, price: priceNum, date: editDate }),
    });
    if (!res.ok) {
      alert("수정 실패");
      return;
    }
    setEditId(null);
    load();
  };

  const isGate = (tx: TxItem) => tx.item.subcategory.category.name === "GATE";

  const totalInAmt = transactions.filter((t) => t.type === "IN").reduce((s, t) => s + (t.price ?? 0) * t.quantity, 0);
  const totalOutAmt = transactions.filter((t) => t.type === "OUT").reduce((s, t) => s + (t.price ?? 0) * t.quantity, 0);

  const resetFilters = () => {
    setFilterCat("");
    setFilterSub("");
    setFilterItem("");
    setFilterType("");
    setSubcategories([]);
    setItems([]);
  };

  return (
    <div>
      <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--foreground)", marginBottom: "24px" }}>입출고 현황</h1>

      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
        <select style={inputStyle} value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
          <option value="">전체 대분류</option>
          {categories.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          style={inputStyle}
          value={filterSub}
          disabled={!filterCat}
          onChange={(e) => setFilterSub(e.target.value)}
        >
          <option value="">전체 소분류</option>
          {subcategories.map((s) => (
            <option key={s.id} value={String(s.id)}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          style={inputStyle}
          value={filterItem}
          disabled={!filterSub}
          onChange={(e) => setFilterItem(e.target.value)}
        >
          <option value="">전체 모델</option>
          {items.map((it) => (
            <option key={it.id} value={String(it.id)}>
              {it.name}
            </option>
          ))}
        </select>
        <select style={inputStyle} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">전체 유형</option>
          <option value="IN">입고</option>
          <option value="OUT">출고</option>
        </select>
        <button
          type="button"
          onClick={resetFilters}
          style={{
            padding: "8px 14px",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            background: "white",
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          초기화
        </button>
      </div>

      {transactions.length > 0 && (
        <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
          {[
            { label: "입고 합계", value: totalInAmt, color: "#4f86f7" },
            { label: "출고 합계", value: totalOutAmt, color: "#48bb78" },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              style={{
                background: "white",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                padding: "12px 20px",
                minWidth: "180px",
              }}
            >
              <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "4px" }}>{label}</div>
              <div style={{ fontSize: "18px", fontWeight: 700, color }}>₩{fmt(value)}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ overflowX: "auto", background: "white", borderRadius: "12px", border: "1px solid var(--border)" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>불러오는 중...</div>
        ) : transactions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)", fontSize: "14px" }}>내역이 없습니다.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["날짜", "유형", "대분류", "소분류", "모델", "수량", "단가", "합계금액", "거래처/프로젝트명", "추가모듈", ""].map((h) => (
                  <th key={h} style={thStyle}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => {
                const total = (tx.price ?? 0) * tx.quantity;
                return editId === tx.id ? (
                  <tr key={tx.id} style={{ background: "#f0f4ff" }}>
                    <td style={tdStyle}>
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        style={{ padding: "4px 8px", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "12px" }}
                      />
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
                      <input
                        value={editPrice}
                        onChange={(e) => handleEditPriceChange(e.target.value)}
                        inputMode="numeric"
                        style={{
                          padding: "4px 8px",
                          border: "1px solid var(--border)",
                          borderRadius: "6px",
                          fontSize: "12px",
                          width: "90px",
                        }}
                        placeholder="0"
                      />
                    </td>
                    <td style={tdStyle}>
                      {editPrice ? `₩${fmt(Number(editPrice.replace(/,/g, "")) * tx.quantity)}` : "-"}
                    </td>
                    <td style={tdStyle}>
                      <input
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        style={{ padding: "4px 8px", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "12px", width: "100px" }}
                      />
                    </td>
                    <td style={tdStyle}>
                      {isGate(tx) ? (
                        <input
                          value={editAddon}
                          onChange={(e) => setEditAddon(e.target.value)}
                          style={{ padding: "4px 8px", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "12px", width: "80px" }}
                        />
                      ) : (
                        "-"
                      )}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          type="button"
                          onClick={handleEdit}
                          style={{
                            padding: "4px 10px",
                            background: "var(--primary)",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "12px",
                            cursor: "pointer",
                          }}
                        >
                          저장
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditId(null)}
                          style={{
                            padding: "4px 10px",
                            background: "#f1f5f9",
                            border: "1px solid var(--border)",
                            borderRadius: "6px",
                            fontSize: "12px",
                            cursor: "pointer",
                          }}
                        >
                          취소
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr
                    key={tx.id}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "#f8fafc")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "white")}
                  >
                    <td style={tdStyle}>{tx.date.slice(0, 10)}</td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "3px 8px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: 600,
                          background: tx.type === "IN" ? "#ebf4ff" : "#f0fff4",
                          color: tx.type === "IN" ? "#4f86f7" : "#48bb78",
                        }}
                      >
                        {tx.type === "IN" ? "입고" : "출고"}
                      </span>
                    </td>
                    <td style={tdStyle}>{tx.item.subcategory.category.name}</td>
                    <td style={tdStyle}>{tx.item.subcategory.name || "-"}</td>
                    <td style={tdStyle}>{tx.item.name}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{tx.quantity}</td>
                    <td style={tdStyle}>{tx.price != null ? `₩${fmt(tx.price)}` : "-"}</td>
                    <td style={{ ...tdStyle, fontWeight: 600, color: tx.type === "IN" ? "#4f86f7" : "#48bb78" }}>
                      {tx.price != null ? `₩${fmt(total)}` : "-"}
                    </td>
                    <td style={tdStyle}>{tx.note || "-"}</td>
                    <td style={tdStyle}>{isGate(tx) ? tx.addon || "-" : "-"}</td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          type="button"
                          onClick={() => startEdit(tx)}
                          style={{
                            padding: "4px 10px",
                            background: "#f1f5f9",
                            border: "1px solid var(--border)",
                            borderRadius: "6px",
                            fontSize: "12px",
                            cursor: "pointer",
                          }}
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(tx.id)}
                          style={{
                            padding: "4px 10px",
                            background: "#fff5f5",
                            border: "1px solid #fca5a5",
                            color: "#dc2626",
                            borderRadius: "6px",
                            fontSize: "12px",
                            cursor: "pointer",
                          }}
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
