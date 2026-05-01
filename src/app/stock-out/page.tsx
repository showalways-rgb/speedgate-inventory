"use client";

import { useState, useEffect } from "react";
import CategorySelector from "@/components/CategorySelector";

interface AddonOption { id: number; type: string; value: string }

const today = () => new Date().toISOString().slice(0, 10);

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", border: "1px solid var(--border)",
  borderRadius: "8px", fontSize: "14px", outline: "none", color: "var(--foreground)",
};
const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "13px", fontWeight: 600,
  color: "var(--muted)", marginBottom: "6px",
};

export default function StockOutPage() {
  const [selected, setSelected] = useState<{ categoryId: number; categoryName: string; subcategoryId: number; itemId: number; itemName: string } | null>(null);
  const [currentStock, setCurrentStock] = useState<number | null>(null);
  const [date, setDate] = useState(today());
  const [quantity, setQuantity] = useState("1");
  const [note, setNote] = useState("");
  const [addon, setAddon] = useState("");
  const [spec, setSpec] = useState("");
  const [addonOptions, setAddonOptions] = useState<AddonOption[]>([]);
  const [specOptions, setSpecOptions] = useState<AddonOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ seqFrom: number; seqTo: number } | null>(null);
  const [error, setError] = useState("");

  const isGate = selected?.categoryName === "GATE";

  useEffect(() => {
    if (!selected?.itemId) { setCurrentStock(null); return; }
    fetch(`/api/stock?categoryId=${selected.categoryId}`)
      .then(r => r.json())
      .then((data: { itemId: number; currentStock: number }[]) => {
        const found = data.find(d => d.itemId === selected.itemId);
        setCurrentStock(found?.currentStock ?? 0);
      });
  }, [selected]);

  useEffect(() => {
    if (!isGate) return;
    fetch("/api/addon-options?type=ADDON").then(r => r.json()).then(setAddonOptions);
    fetch("/api/addon-options?type=SPEC").then(r => r.json()).then(setSpecOptions);
  }, [isGate]);

  const handleSubmit = async () => {
    if (!selected?.itemId) { setError("모델을 선택해주세요."); return; }
    const qty = Number(quantity);
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
          itemId: selected.itemId,
          quantity: qty,
          note: note || null,
          addon: isGate ? (addon || null) : null,
          spec: isGate ? (spec || null) : null,
          date,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "오류가 발생했습니다."); return; }
      const counters: { seq: number }[] = data.shippedCounters;
      setResult({ seqFrom: counters[0].seq, seqTo: counters[counters.length - 1].seq });
      setCurrentStock(prev => (prev ?? 0) - qty);
      setQuantity("1"); setNote(""); setAddon(""); setSpec("");
      setSelected(null);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--foreground)", marginBottom: "24px" }}>출고 등록 (FIFO)</h1>

      <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: "12px", padding: "28px", maxWidth: "520px" }}>
        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>품목 선택</div>
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

        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>수량</label>
          <input type="number" min={1} style={inputStyle} value={quantity} onChange={e => setQuantity(e.target.value)} />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>거래처 / 프로젝트명</label>
          <input type="text" style={inputStyle} value={note} onChange={e => setNote(e.target.value)} placeholder="거래처명 또는 프로젝트명" />
        </div>

        {isGate && (
          <>
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>추가모듈 (GATE 전용)</label>
              <select style={inputStyle} value={addon} onChange={e => setAddon(e.target.value)}>
                <option value="">선택 또는 직접 입력</option>
                {addonOptions.map(o => <option key={o.id} value={o.value}>{o.value}</option>)}
              </select>
              <input type="text" style={{ ...inputStyle, marginTop: "6px" }} value={addon} onChange={e => setAddon(e.target.value)} placeholder="직접 입력" />
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>세부사양 (GATE 전용)</label>
              <select style={inputStyle} value={spec} onChange={e => setSpec(e.target.value)}>
                <option value="">선택 또는 직접 입력</option>
                {specOptions.map(o => <option key={o.id} value={o.value}>{o.value}</option>)}
              </select>
              <input type="text" style={{ ...inputStyle, marginTop: "6px" }} value={spec} onChange={e => setSpec(e.target.value)} placeholder="직접 입력" />
            </div>
          </>
        )}

        {error && (
          <div style={{ background: "#fff5f5", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", marginBottom: "16px" }}>
            {error}
          </div>
        )}

        {result && (
          <div style={{ background: "#f0fff4", border: "1px solid #6ee7b7", color: "#065f46", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", marginBottom: "16px" }}>
            출고 완료! 출고 카운터: <strong>{result.seqFrom} ~ {result.seqTo}</strong> (선입선출)
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
    </div>
  );
}
