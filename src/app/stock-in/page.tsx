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

export default function StockInPage() {
  const [selected, setSelected] = useState<{ categoryId: number; categoryName: string; subcategoryId: number; itemId: number; itemName: string } | null>(null);
  const [date, setDate] = useState(today());
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");
  const [addon, setAddon] = useState("");
  const [spec, setSpec] = useState("");
  const [addonOptions, setAddonOptions] = useState<AddonOption[]>([]);
  const [specOptions, setSpecOptions] = useState<AddonOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ seqFrom: number; seqTo: number } | null>(null);
  const [error, setError] = useState("");

  const isGate = selected?.categoryName === "GATE";
  const qty = Number(quantity) || 0;
  const unitPrice = Number(price.replace(/,/g, "")) || 0;
  const totalAmount = qty * unitPrice;

  useEffect(() => {
    fetch("/api/addon-options?type=ADDON").then(r => r.json()).then(setAddonOptions);
    fetch("/api/addon-options?type=SPEC").then(r => r.json()).then(setSpecOptions);
  }, []);

  const handlePriceChange = (val: string) => {
    const numeric = val.replace(/[^0-9]/g, "");
    setPrice(numeric ? Number(numeric).toLocaleString("ko-KR") : "");
  };

  const handleSubmit = async () => {
    if (!selected?.itemId) { setError("모델을 선택해주세요."); return; }
    if (!qty || qty < 1) { setError("수량을 올바르게 입력해주세요."); return; }
    if (!date) { setError("날짜를 입력해주세요."); return; }

    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          itemId: selected.itemId,
          quantity: qty,
          price: unitPrice || null,
          note: note || null,
          addon: isGate ? (addon || null) : null,
          spec: isGate ? (spec || null) : null,
          date,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "오류가 발생했습니다."); return; }
      const counters: { seq: number }[] = data.counters;
      setResult({ seqFrom: counters[0].seq, seqTo: counters[counters.length - 1].seq });
      setQuantity("1"); setPrice(""); setNote(""); setAddon(""); setSpec("");
      setSelected(null);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--foreground)", marginBottom: "24px" }}>입고 등록</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", alignItems: "start" }}>
        {/* 왼쪽: 메인 폼 */}
        <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: "12px", padding: "28px" }}>
          {/* 품목 선택 */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>품목 선택</div>
            <CategorySelector
              key={selected === null ? "reset" : "filled"}
              onSelect={setSelected}
            />
          </div>

          {selected && (
            <div style={{ background: "#f0f4ff", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", fontSize: "13px", color: "var(--primary)" }}>
              선택: <strong>{selected.categoryName} &gt; {selected.itemName}</strong>
            </div>
          )}

          {/* 날짜 */}
          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>입고일</label>
            <input type="date" style={inputStyle} value={date} onChange={e => setDate(e.target.value)} />
          </div>

          {/* 수량 + 단가 */}
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

          {/* 합계 */}
          {unitPrice > 0 && (
            <div style={{ background: "#f8fafc", border: "1px solid var(--border)", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "13px", color: "var(--muted)" }}>합계 금액</span>
              <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--primary)" }}>₩{fmt(totalAmount)}</span>
            </div>
          )}

          {/* 거래처 */}
          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>거래처 / 프로젝트명</label>
            <input type="text" style={inputStyle} value={note} onChange={e => setNote(e.target.value)} placeholder="거래처명 또는 프로젝트명" />
          </div>

          {/* GATE 전용: 선택된 값 표시 */}
          {isGate && (addon || spec) && (
            <div style={{ background: "#f0f4ff", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", fontSize: "13px" }}>
              {addon && <div>추가모듈: <strong>{addon}</strong></div>}
              {spec && <div>세부사양: <strong>{spec}</strong></div>}
            </div>
          )}

          {error && (
            <div style={{ background: "#fff5f5", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", marginBottom: "16px" }}>
              {error}
            </div>
          )}

          {result && (
            <div style={{ background: "#f0fff4", border: "1px solid #6ee7b7", color: "#065f46", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", marginBottom: "16px" }}>
              입고 완료! 카운터 번호: <strong>{result.seqFrom} ~ {result.seqTo}</strong>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: "100%", padding: "12px", background: "var(--primary)", color: "white",
              border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "처리 중..." : "입고 등록"}
          </button>
        </div>

        {/* 오른쪽: 추가모듈 / 세부사양 선택 패널 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* 추가모듈 */}
          <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px" }}>
            <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>추가모듈</div>
            <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "14px" }}>GATE 품목일 때 적용됩니다</div>

            {/* 직접 입력 */}
            <div style={{ marginBottom: "12px" }}>
              <input
                type="text" style={{ ...inputStyle, fontSize: "13px" }}
                value={addon}
                onChange={e => setAddon(e.target.value)}
                placeholder="직접 입력"
                disabled={!isGate}
              />
            </div>

            {/* 선택 리스트 */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {addonOptions.length === 0 && (
                <span style={{ fontSize: "12px", color: "#cbd5e0" }}>설정에서 리스트를 추가하세요</span>
              )}
              {addonOptions.map(o => (
                <button
                  key={o.id}
                  disabled={!isGate}
                  onClick={() => setAddon(prev => prev === o.value ? "" : o.value)}
                  style={{
                    padding: "6px 12px", borderRadius: "20px", fontSize: "13px",
                    border: "1px solid",
                    borderColor: addon === o.value ? "var(--primary)" : "var(--border)",
                    background: addon === o.value ? "#eef2ff" : "white",
                    color: addon === o.value ? "var(--primary)" : "var(--foreground)",
                    fontWeight: addon === o.value ? 600 : 400,
                    cursor: isGate ? "pointer" : "not-allowed",
                    opacity: isGate ? 1 : 0.4,
                    transition: "all 0.15s",
                  }}
                >
                  {o.value}
                </button>
              ))}
            </div>
          </div>

          {/* 세부사양 */}
          <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px" }}>
            <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>세부사양</div>
            <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "14px" }}>GATE 품목일 때 적용됩니다</div>

            {/* 직접 입력 */}
            <div style={{ marginBottom: "12px" }}>
              <input
                type="text" style={{ ...inputStyle, fontSize: "13px" }}
                value={spec}
                onChange={e => setSpec(e.target.value)}
                placeholder="직접 입력"
                disabled={!isGate}
              />
            </div>

            {/* 선택 리스트 */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {specOptions.length === 0 && (
                <span style={{ fontSize: "12px", color: "#cbd5e0" }}>설정에서 리스트를 추가하세요</span>
              )}
              {specOptions.map(o => (
                <button
                  key={o.id}
                  disabled={!isGate}
                  onClick={() => setSpec(prev => prev === o.value ? "" : o.value)}
                  style={{
                    padding: "6px 12px", borderRadius: "20px", fontSize: "13px",
                    border: "1px solid",
                    borderColor: spec === o.value ? "var(--primary)" : "var(--border)",
                    background: spec === o.value ? "#eef2ff" : "white",
                    color: spec === o.value ? "var(--primary)" : "var(--foreground)",
                    fontWeight: spec === o.value ? 600 : 400,
                    cursor: isGate ? "pointer" : "not-allowed",
                    opacity: isGate ? 1 : 0.4,
                    transition: "all 0.15s",
                  }}
                >
                  {o.value}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
