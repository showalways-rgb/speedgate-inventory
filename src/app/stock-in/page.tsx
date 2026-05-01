"use client";

import { useState, useEffect } from "react";
import { Package, Puzzle } from "lucide-react";
import CategorySelector from "@/components/CategorySelector";

interface AddonOption { id: number; type: string; value: string }

const today = () => new Date().toISOString().slice(0, 10);
const fmt = (n: number) => n.toLocaleString("ko-KR");

const input: React.CSSProperties = {
  width: "100%", padding: "10px 12px", border: "1px solid var(--border)",
  borderRadius: "10px", fontSize: "14px", outline: "none", color: "var(--foreground)",
  background: "#fff", transition: "border-color 0.15s",
};
const label: React.CSSProperties = {
  display: "block", fontSize: "12px", fontWeight: 600, letterSpacing: "0.02em",
  color: "var(--muted)", marginBottom: "6px",
};

function CardHeader({
  accent, icon: Icon, badge, title, desc,
}: { accent: string; icon: React.ElementType; badge: string; title: string; desc?: string }) {
  return (
    <div style={{ borderBottom: "1px solid var(--border)", padding: "18px 22px", background: "linear-gradient(180deg, #fafbff 0%, #fff 100%)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        <div style={{
          width: "44px", height: "44px", borderRadius: "11px",
          background: accent, display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, boxShadow: "0 2px 8px rgba(91,110,232,0.15)",
        }}>
          <Icon size={21} color="white" strokeWidth={2} />
        </div>
        <div style={{ minWidth: 0 }}>
          <span style={{
            fontSize: "10px", fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.06em", color: "#94a3b8",
          }}>{badge}</span>
          <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)", marginTop: "2px", lineHeight: 1.3 }}>
            {title}
          </div>
          {desc ? (
            <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "4px", lineHeight: 1.45 }}>
              {desc}
            </div>
          ) : null}
        </div>
      </div>
      <div style={{ height: "3px", background: accent, marginTop: "16px", marginLeft: "-22px", marginRight: "-22px", marginBottom: "-18px", borderRadius: "0 0 3px 3px", opacity: 0.92 }} />
    </div>
  );
}

function sortOptions(opts: AddonOption[]): AddonOption[] {
  const order = ["이동식플레이트", "브라켓", "케이블덕트"];
  return [...opts].sort((a, b) => {
    const ai = order.findIndex((k) => a.value.startsWith(k));
    const bi = order.findIndex((k) => b.value.startsWith(k));
    const ap = ai === -1 ? order.length : ai;
    const bp = bi === -1 ? order.length : bi;
    if (ap !== bp) return ap - bp;
    return a.value.localeCompare(b.value, "ko");
  });
}

function AddonStockInPanel({
  title, badge, accent, Icon, categoryName, options, submitLabel,
}: {
  title: string;
  badge: string;
  accent: string;
  Icon: React.ElementType;
  categoryName: string;
  options: AddonOption[];
  submitLabel: string;
}) {
  const [selected, setSelected] = useState("");
  const [date, setDate] = useState(today());
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ seqFrom: number; seqTo: number } | null>(null);
  const [error, setError] = useState("");

  const value = selected;
  const qty = Number(quantity) || 0;
  const unitPrice = Number(price.replace(/,/g, "")) || 0;

  const handlePriceChange = (val: string) => {
    const numeric = val.replace(/[^0-9]/g, "");
    setPrice(numeric ? Number(numeric).toLocaleString("ko-KR") : "");
  };

  const handleSubmit = async () => {
    if (!value.trim()) { setError("항목을 선택해주세요."); return; }
    if (!qty || qty < 1) { setError("수량을 올바르게 입력해주세요."); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/addon-stock-in", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ categoryName, value: value.trim(), date, quantity: qty, price: unitPrice || null, note: note || null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "오류가 발생했습니다."); return; }
      const counters: { seq: number }[] = data.counters;
      setResult({ seqFrom: counters[0].seq, seqTo: counters[counters.length - 1].seq });
      setSelected(""); setQuantity("1"); setPrice(""); setNote("");
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stock-card">
      <CardHeader accent={accent} icon={Icon} badge={badge} title={title} />
      <div style={{ padding: "22px 24px 24px" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>항목 선택</div>
        {options.length === 0 ? (
          <span style={{ fontSize: "12px", color: "#cbd5e1", display: "block", marginBottom: "14px" }}>목록 없음</span>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "7px", marginBottom: "14px" }}>
            {sortOptions(options).map(o => (
              <button
                key={o.id}
                type="button"
                onClick={() => setSelected(o.value)}
                style={{
                  padding: "6px 13px", borderRadius: "999px", fontSize: "12px",
                  border: `1px solid ${selected === o.value ? accent : "var(--border)"}`,
                  background: selected === o.value ? `${accent}18` : "white",
                  color: selected === o.value ? accent : "var(--foreground)",
                  fontWeight: selected === o.value ? 600 : 500,
                  cursor: "pointer", transition: "all 0.12s",
                }}
              >
                {o.value}
              </button>
            ))}
          </div>
        )}

        <div style={{ height: "1px", background: "var(--border)", margin: "20px 0" }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
          <div>
            <label style={label}>입고일</label>
            <input type="date" style={input} value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
          <div>
            <label style={label}>수량</label>
            <input type="number" min={1} style={input} value={quantity} onChange={e => setQuantity(e.target.value)} />
          </div>
          <div>
            <label style={label}>단가 (원)</label>
            <input type="text" inputMode="numeric" style={input} value={price} onChange={e => handlePriceChange(e.target.value)} placeholder="선택 입력" />
          </div>
        </div>

        {unitPrice > 0 && (
          <div style={{
            background: "#f8fafc", border: "1px solid var(--border)", borderRadius: "10px",
            padding: "12px 16px", marginBottom: "14px", display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontSize: "13px", color: "var(--muted)" }}>합계 금액</span>
            <span style={{ fontSize: "17px", fontWeight: 800, color: accent }}>₩{fmt(qty * unitPrice)}</span>
          </div>
        )}

        <div style={{ marginBottom: "14px" }}>
          <label style={label}>거래처 / 프로젝트명</label>
          <input type="text" style={input} value={note} onChange={e => setNote(e.target.value)} placeholder="거래처명 또는 프로젝트명" />
        </div>

        {error && (
          <div style={{ marginTop: "10px", fontSize: "12px", color: "#b91c1c", background: "#fef2f2", padding: "8px 10px", borderRadius: "8px", border: "1px solid #fecaca" }}>{error}</div>
        )}
        {result && (
          <div style={{ marginTop: "10px", fontSize: "12px", color: "#065f46", background: "#ecfdf5", borderRadius: "8px", padding: "10px 12px", border: "1px solid #a7f3d0" }}>
            입고 완료 · 카운터 <strong>{result.seqFrom} ~ {result.seqTo}</strong>
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: "100%", marginTop: "14px", padding: "11px", background: accent, color: "white",
            border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.75 : 1,
            boxShadow: `0 2px 8px ${accent}55`,
          }}
        >
          {loading ? "처리 중..." : submitLabel}
        </button>
      </div>
    </div>
  );
}

export default function StockInPage() {
  const [selected, setSelected] = useState<{ categoryId: number; categoryName: string; subcategoryId: number; itemId: number; itemName: string } | null>(null);
  const [date, setDate] = useState(today());
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ seqFrom: number; seqTo: number } | null>(null);
  const [error, setError] = useState("");
  const [addonOptions, setAddonOptions] = useState<AddonOption[]>([]);

  const qty = Number(quantity) || 0;
  const unitPrice = Number(price.replace(/,/g, "")) || 0;

  useEffect(() => {
    fetch("/api/addon-options?type=ADDON").then(r => r.json()).then(setAddonOptions);
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
          itemId: selected.itemId, quantity: qty,
          price: unitPrice || null, note: note || null, date,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "오류가 발생했습니다."); return; }
      const counters: { seq: number }[] = data.counters;
      setResult({ seqFrom: counters[0].seq, seqTo: counters[counters.length - 1].seq });
      setQuantity("1"); setPrice(""); setNote(""); setSelected(null);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "22px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--foreground)", letterSpacing: "-0.02em", margin: 0 }}>입고 등록</h1>
      </div>

      <div className="stock-register-grid">
        <div className="stock-card">
          <CardHeader accent="var(--primary)" icon={Package} badge="Primary" title="모델 입고" />
          <div style={{ padding: "22px 24px 24px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>품목 선택</div>
            <CategorySelector key={selected === null ? "reset" : "filled"} onSelect={setSelected} />

            {selected && (
              <div style={{
                marginTop: "14px", background: "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)",
                borderRadius: "10px", padding: "12px 14px", fontSize: "13px", color: "#3730a3", fontWeight: 600,
                border: "1px solid #c7d2fe",
              }}>
                {selected.categoryName} <span style={{ opacity: 0.5 }}>›</span> {selected.itemName}
              </div>
            )}

            <div style={{ height: "1px", background: "var(--border)", margin: "20px 0" }} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
              <div>
                <label style={label}>입고일</label>
                <input type="date" style={input} value={date} onChange={e => setDate(e.target.value)} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
              <div>
                <label style={label}>수량</label>
                <input type="number" min={1} style={input} value={quantity} onChange={e => setQuantity(e.target.value)} />
              </div>
              <div>
                <label style={label}>단가 (원)</label>
                <input type="text" inputMode="numeric" style={input} value={price} onChange={e => handlePriceChange(e.target.value)} placeholder="선택 입력" />
              </div>
            </div>

            {unitPrice > 0 && (
              <div style={{
                background: "#f8fafc", border: "1px solid var(--border)", borderRadius: "10px",
                padding: "12px 16px", marginBottom: "14px", display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ fontSize: "13px", color: "var(--muted)" }}>합계 금액</span>
                <span style={{ fontSize: "17px", fontWeight: 800, color: "var(--primary)" }}>₩{fmt(qty * unitPrice)}</span>
              </div>
            )}

            <div style={{ marginBottom: "14px" }}>
              <label style={label}>거래처 / 프로젝트명</label>
              <input type="text" style={input} value={note} onChange={e => setNote(e.target.value)} placeholder="거래처명 또는 프로젝트명" />
            </div>

            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", borderRadius: "10px", padding: "11px 14px", fontSize: "13px", marginBottom: "14px" }}>{error}</div>
            )}

            {result && (
              <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", borderRadius: "10px", padding: "11px 14px", fontSize: "13px", marginBottom: "14px" }}>
                입고 완료 · 카운터 <strong>{result.seqFrom} ~ {result.seqTo}</strong>
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width: "100%", padding: "11px", background: "var(--primary)", color: "white",
                border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.75 : 1,
                boxShadow: "0 2px 8px rgba(91, 110, 232, 0.33)",
              }}
            >
              {loading ? "처리 중…" : "모델 입고 등록"}
            </button>
          </div>
        </div>

        <div className="stock-side-stack">
          <AddonStockInPanel
            title="추가모듈 입고"
            badge="Standalone"
            accent="#6366f1"
            Icon={Puzzle}
            categoryName="추가모듈"
            options={addonOptions}
            submitLabel="추가모듈 입고 등록"
          />
        </div>
      </div>
    </div>
  );
}
