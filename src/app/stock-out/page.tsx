"use client";

import { useState, useEffect } from "react";
import CategorySelector from "@/components/CategorySelector";

interface AddonOption { id: number; type: string; value: string }

const today = () => new Date().toISOString().slice(0, 10);
const fmt = (n: number) => n.toLocaleString("ko-KR");

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", border: "1px solid var(--border)",
  borderRadius: "8px", fontSize: "14px", outline: "none", color: "var(--foreground)",
};
const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "13px", fontWeight: 600,
  color: "var(--muted)", marginBottom: "6px",
};
const smInput: React.CSSProperties = {
  width: "100%", padding: "8px 10px", border: "1px solid var(--border)",
  borderRadius: "8px", fontSize: "13px", outline: "none", color: "var(--foreground)",
};
const smLabel: React.CSSProperties = {
  display: "block", fontSize: "12px", fontWeight: 600,
  color: "var(--muted)", marginBottom: "4px",
};

// ── 추가모듈/세부사양 단독 출고 패널 ──────────────────────────────
function AddonStockOutPanel({
  title, categoryName, options,
}: {
  title: string;
  categoryName: string;
  options: AddonOption[];
}) {
  const [selected, setSelected] = useState("");
  const [customVal, setCustomVal] = useState("");
  const [date, setDate] = useState(today());
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ seqFrom: number; seqTo: number } | null>(null);
  const [error, setError] = useState("");

  const value = customVal || selected;
  const qty = Number(quantity) || 0;
  const unitPrice = Number(price.replace(/,/g, "")) || 0;

  const handlePriceChange = (val: string) => {
    const numeric = val.replace(/[^0-9]/g, "");
    setPrice(numeric ? Number(numeric).toLocaleString("ko-KR") : "");
  };

  const handleSubmit = async () => {
    if (!value.trim()) { setError("값을 선택하거나 직접 입력하세요."); return; }
    if (!qty || qty < 1) { setError("수량을 올바르게 입력해주세요."); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/addon-stock-out", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ categoryName, value: value.trim(), date, quantity: qty, price: unitPrice || null, note: note || null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "오류가 발생했습니다."); return; }
      const counters: { seq: number }[] = data.shippedCounters;
      setResult({ seqFrom: counters[0].seq, seqTo: counters[counters.length - 1].seq });
      setSelected(""); setCustomVal(""); setQuantity("1"); setPrice(""); setNote("");
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px" }}>
      <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "14px" }}>{title} 단독 출고</div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "7px", marginBottom: "12px" }}>
        {options.map(o => (
          <button
            key={o.id}
            onClick={() => { setSelected(o.value); setCustomVal(""); }}
            style={{
              padding: "5px 12px", borderRadius: "20px", fontSize: "13px",
              border: "1px solid",
              borderColor: selected === o.value && !customVal ? "#48bb78" : "var(--border)",
              background: selected === o.value && !customVal ? "#f0fff4" : "white",
              color: selected === o.value && !customVal ? "#276749" : "var(--foreground)",
              fontWeight: selected === o.value && !customVal ? 600 : 400,
              cursor: "pointer", transition: "all 0.15s",
            }}
          >
            {o.value}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: "12px" }}>
        <input
          type="text" style={smInput}
          value={customVal}
          onChange={e => { setCustomVal(e.target.value); setSelected(""); }}
          placeholder="직접 입력"
        />
      </div>

      {value && (
        <div style={{ fontSize: "12px", color: "#276749", marginBottom: "10px", fontWeight: 600 }}>
          출고 대상: {value}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "10px" }}>
        <div>
          <label style={smLabel}>날짜</label>
          <input type="date" style={smInput} value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div>
          <label style={smLabel}>수량</label>
          <input type="number" min={1} style={smInput} value={quantity} onChange={e => setQuantity(e.target.value)} />
        </div>
        <div>
          <label style={smLabel}>단가 (원)</label>
          <input type="text" inputMode="numeric" style={smInput} value={price} onChange={e => handlePriceChange(e.target.value)} placeholder="0" />
        </div>
      </div>

      {unitPrice > 0 && (
        <div style={{ fontSize: "12px", color: "#48bb78", fontWeight: 700, marginBottom: "8px", textAlign: "right" }}>
          합계 ₩{fmt(qty * unitPrice)}
        </div>
      )}

      <div style={{ marginBottom: "12px" }}>
        <input type="text" style={smInput} value={note} onChange={e => setNote(e.target.value)} placeholder="거래처 / 프로젝트명" />
      </div>

      {error && <div style={{ fontSize: "12px", color: "#dc2626", marginBottom: "8px" }}>{error}</div>}
      {result && (
        <div style={{ fontSize: "12px", color: "#065f46", background: "#f0fff4", borderRadius: "6px", padding: "8px 10px", marginBottom: "8px" }}>
          출고 완료! 카운터: <strong>{result.seqFrom} ~ {result.seqTo}</strong>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          width: "100%", padding: "10px", background: "#48bb78", color: "white",
          border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "처리 중..." : "출고 등록"}
      </button>
    </div>
  );
}

// ── 메인 페이지 ──────────────────────────────────────────────────
export default function StockOutPage() {
  const [selected, setSelected] = useState<{ categoryId: number; categoryName: string; subcategoryId: number; itemId: number; itemName: string } | null>(null);
  const [currentStock, setCurrentStock] = useState<number | null>(null);
  const [date, setDate] = useState(today());
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ seqFrom: number; seqTo: number } | null>(null);
  const [error, setError] = useState("");
  const [addonOptions, setAddonOptions] = useState<AddonOption[]>([]);
  const [specOptions, setSpecOptions] = useState<AddonOption[]>([]);

  const qty = Number(quantity) || 0;
  const unitPrice = Number(price.replace(/,/g, "")) || 0;

  useEffect(() => {
    fetch("/api/addon-options?type=ADDON").then(r => r.json()).then(setAddonOptions);
    fetch("/api/addon-options?type=SPEC").then(r => r.json()).then(setSpecOptions);
  }, []);

  useEffect(() => {
    if (!selected?.itemId) { setCurrentStock(null); return; }
    fetch(`/api/stock?categoryId=${selected.categoryId}`)
      .then(r => r.json())
      .then((data: { itemId: number; currentStock: number }[]) => {
        const found = data.find(d => d.itemId === selected.itemId);
        setCurrentStock(found?.currentStock ?? 0);
      });
  }, [selected]);

  const handlePriceChange = (val: string) => {
    const numeric = val.replace(/[^0-9]/g, "");
    setPrice(numeric ? Number(numeric).toLocaleString("ko-KR") : "");
  };

  const handleSubmit = async () => {
    if (!selected?.itemId) { setError("모델을 선택해주세요."); return; }
    if (!qty || qty < 1) { setError("수량을 올바르게 입력해주세요."); return; }
    if (currentStock !== null && qty > currentStock) {
      setError(`재고 부족: 현재고 ${currentStock}개, 요청 ${qty}개`); return;
    }
    if (!date) { setError("날짜를 입력해주세요."); return; }

    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/stock-out", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          itemId: selected.itemId, quantity: qty,
          price: unitPrice || null, note: note || null, date,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "오류가 발생했습니다."); return; }
      const counters: { seq: number }[] = data.shippedCounters;
      setResult({ seqFrom: counters[0].seq, seqTo: counters[counters.length - 1].seq });
      setCurrentStock(prev => (prev ?? 0) - qty);
      setQuantity("1"); setPrice(""); setNote(""); setSelected(null);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--foreground)", marginBottom: "24px" }}>출고 등록 (FIFO)</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", alignItems: "start" }}>
        {/* 왼쪽: 모델 출고 */}
        <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: "12px", padding: "28px" }}>
          <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "16px", color: "var(--foreground)" }}>모델 출고</div>

          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--muted)", marginBottom: "10px" }}>품목 선택</div>
            <CategorySelector
              key={selected === null ? "reset" : "filled"}
              onSelect={setSelected}
            />
          </div>

          {selected && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f0f4ff", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", fontSize: "13px" }}>
              <span style={{ color: "var(--primary)" }}>
                선택: <strong>{selected.categoryName} &gt; {selected.itemName}</strong>
              </span>
              {currentStock !== null && (
                <span style={{ fontWeight: 700, color: currentStock === 0 ? "var(--danger)" : "var(--success)" }}>
                  현재고 {currentStock}
                </span>
              )}
            </div>
          )}

          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>출고일</label>
            <input type="date" style={inputStyle} value={date} onChange={e => setDate(e.target.value)} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
            <div>
              <label style={labelStyle}>수량</label>
              <input type="number" min={1} style={inputStyle} value={quantity} onChange={e => setQuantity(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>단가 (원)</label>
              <input type="text" inputMode="numeric" style={inputStyle} value={price} onChange={e => handlePriceChange(e.target.value)} placeholder="0" />
            </div>
          </div>

          {unitPrice > 0 && (
            <div style={{ background: "#f8fafc", border: "1px solid var(--border)", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "13px", color: "var(--muted)" }}>합계 금액</span>
              <span style={{ fontSize: "16px", fontWeight: 700, color: "#48bb78" }}>₩{fmt(qty * unitPrice)}</span>
            </div>
          )}

          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>거래처 / 프로젝트명</label>
            <input type="text" style={inputStyle} value={note} onChange={e => setNote(e.target.value)} placeholder="거래처명 또는 프로젝트명" />
          </div>

          {error && (
            <div style={{ background: "#fff5f5", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", marginBottom: "16px" }}>
              {error}
            </div>
          )}

          {result && (
            <div style={{ background: "#f0fff4", border: "1px solid #6ee7b7", color: "#065f46", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", marginBottom: "16px" }}>
              출고 완료! 카운터: <strong>{result.seqFrom} ~ {result.seqTo}</strong> (선입선출)
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: "100%", padding: "12px", background: "#48bb78", color: "white",
              border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "처리 중..." : "출고 등록"}
          </button>
        </div>

        {/* 오른쪽: 추가모듈/세부사양 단독 출고 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <AddonStockOutPanel title="추가모듈" categoryName="추가모듈" options={addonOptions} />
          <AddonStockOutPanel title="세부사양" categoryName="세부사양" options={specOptions} />
        </div>
      </div>
    </div>
  );
}
