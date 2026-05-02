"use client";

import { useState, useEffect, useCallback } from "react";
import { PackageMinus } from "lucide-react";
import CategorySelector from "@/components/CategorySelector";
import { isVirtualOutItemName } from "@/lib/virtual-out-models";

interface AddonOption { id: number; type: string; value: string }

const today = () => new Date().toISOString().slice(0, 10);
const fmt = (n: number) => n.toLocaleString("ko-KR");

const input: React.CSSProperties = {
  width: "100%", padding: "10px 12px", border: "1px solid var(--border)",
  borderRadius: "10px", fontSize: "14px", outline: "none", color: "var(--foreground)",
  background: "#fff",
};
const label: React.CSSProperties = {
  display: "block", fontSize: "12px", fontWeight: 600, letterSpacing: "0.02em",
  color: "var(--muted)", marginBottom: "6px",
};
const smLabel: React.CSSProperties = { ...label, fontSize: "11px", marginBottom: "6px" };

const GREEN = "#16a34a";
const GREEN_DARK = "#15803d";
const ADDON_ACCENT = "#6366f1";

function CardHeader({
  accent, icon: Icon, badge, title, desc,
}: { accent: string; icon: React.ElementType; badge: string; title: string; desc?: string }) {
  return (
    <div style={{ borderBottom: "1px solid var(--border)", padding: "18px 22px", background: "linear-gradient(180deg, #fafffb 0%, #fff 100%)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        <div style={{
          width: "44px", height: "44px", borderRadius: "11px",
          background: accent, display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, boxShadow: "0 2px 8px rgba(22,163,74,0.2)",
        }}>
          <Icon size={21} color="white" strokeWidth={2} />
        </div>
        <div style={{ minWidth: 0 }}>
          <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#94a3b8" }}>{badge}</span>
          <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)", marginTop: "2px", lineHeight: 1.3 }}>{title}</div>
          {desc ? (
            <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "4px", lineHeight: 1.45 }}>{desc}</div>
          ) : null}
        </div>
      </div>
      <div style={{ height: "3px", background: accent, marginTop: "16px", marginLeft: "-22px", marginRight: "-22px", marginBottom: "-18px", borderRadius: "0 0 3px 3px" }} />
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

export default function StockOutPage() {
  const [selected, setSelected] = useState<{ categoryId: number; categoryName: string; subcategoryId: number; itemId: number; itemName: string } | null>(null);
  const [currentStock, setCurrentStock] = useState<number | null>(null);
  const [date, setDate] = useState(today());
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");
  const [addon, setAddon] = useState("");
  const [loading, setLoading] = useState(false);
  type CompanionRange = { name: string; seqFrom: number; seqTo: number };
  type StockOutResult =
    | { kind: "fifo"; seqFrom: number; seqTo: number; companions: CompanionRange[] }
    | { kind: "virtual"; qty: number; companions: CompanionRange[] };
  const [result, setResult] = useState<StockOutResult | null>(null);
  const [error, setError] = useState("");
  const [addonOptions, setAddonOptions] = useState<AddonOption[]>([]);

  const qty = Number(quantity) || 0;
  const unitPrice = Number(price.replace(/,/g, "")) || 0;

  useEffect(() => {
    fetch("/api/addon-options?type=ADDON").then(r => r.json()).then(setAddonOptions);
  }, []);

  const handlePriceChange = useCallback((val: string) => {
    const numeric = val.replace(/[^0-9]/g, "");
    setPrice(numeric ? Number(numeric).toLocaleString("ko-KR") : "");
  }, []);

  useEffect(() => {
    if (!selected?.itemId) {
      setCurrentStock(null);
      setPrice("");
      return;
    }
    let cancelled = false;
    const catId = selected.categoryId;
    const itemId = selected.itemId;
    Promise.all([
      fetch(`/api/stock?categoryId=${catId}`).then((r) => r.json()),
      fetch(`/api/stock-out/fifo-price?itemId=${itemId}`).then((r) => r.json()),
    ]).then(([stockData, priceData]: [{ itemId: number; currentStock: number }[], { price?: number | null }]) => {
      if (cancelled) return;
      const found = stockData.find((d) => d.itemId === itemId);
      setCurrentStock(found?.currentStock ?? 0);
      if (priceData != null && priceData.price != null) {
        handlePriceChange(String(priceData.price));
      } else {
        setPrice("");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [selected, handlePriceChange]);

  const handleSubmit = async () => {
    if (!selected?.itemId) { setError("모델을 선택해주세요."); return; }
    if (!qty || qty < 1) { setError("수량을 올바르게 입력해주세요."); return; }
    const virtual = isVirtualOutItemName(selected.itemName);
    if (!virtual && currentStock !== null && qty > currentStock) {
      setError(`재고 부족: 현재고 ${currentStock}개, 요청 ${qty}개`);
      return;
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
          price: unitPrice || null,
          note: note || null,
          addon: addon.trim() || null,
          date,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "오류가 발생했습니다."); return; }
      const companions: CompanionRange[] = (data.companionShipped ?? []).map(
        (r: { name: string; seqFrom: number; seqTo: number }) => ({
          name: r.name,
          seqFrom: r.seqFrom,
          seqTo: r.seqTo,
        })
      );
      if (data.virtualOut) {
        setResult({ kind: "virtual", qty, companions });
        setCurrentStock(prev => Math.max(0, (prev ?? 0) - qty));
      } else {
        const counters: { seq: number }[] = data.shippedCounters ?? [];
        if (counters.length === 0) {
          setError("출고 응답에 모델 카운터 정보가 없습니다.");
          return;
        }
        setResult({
          kind: "fifo",
          seqFrom: counters[0].seq,
          seqTo: counters[counters.length - 1].seq,
          companions,
        });
        setCurrentStock(prev => (prev ?? 0) - qty);
      }
      setQuantity("1"); setPrice(""); setNote(""); setAddon("");
      setSelected(null);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "640px" }}>
      <div style={{ marginBottom: "22px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--foreground)", letterSpacing: "-0.02em", margin: 0 }}>출고 등록</h1>
      </div>

      <div className="stock-card">
        <CardHeader accent={GREEN} icon={PackageMinus} badge="출고" title="모델 출고" />
        <div style={{ padding: "22px 24px 24px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>품목 선택</div>
          <CategorySelector key={selected === null ? "reset" : "filled"} onSelect={setSelected} />

          {selected && (
            <div style={{
              marginTop: "14px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "8px",
              background: "linear-gradient(135deg, #ecfdf5 0%, #dcfce7 100%)",
              borderRadius: "10px", padding: "12px 14px", border: "1px solid #86efac",
            }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: GREEN_DARK }}>
                {selected.categoryName} <span style={{ opacity: 0.5 }}>›</span> {selected.itemName}
              </span>
              {currentStock !== null && (
                <span style={{ fontWeight: 800, color: currentStock === 0 ? "var(--danger)" : GREEN, fontSize: "14px" }}>
                  현재고 {currentStock}
                </span>
              )}
            </div>
          )}

          <div style={{ height: "1px", background: "var(--border)", margin: "20px 0" }} />

          <div style={{ marginBottom: "14px" }}>
            <label style={label}>출고일</label>
            <input type="date" style={input} value={date} onChange={e => setDate(e.target.value)} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
            <div><label style={label}>수량</label><input type="number" min={1} style={input} value={quantity} onChange={e => setQuantity(e.target.value)} /></div>
            <div><label style={label}>단가 (원)</label><input type="text" inputMode="numeric" style={input} value={price} onChange={e => handlePriceChange(e.target.value)} placeholder="선택 입력" /></div>
          </div>

          {unitPrice > 0 && (
            <div style={{ background: "#f8fafc", border: "1px solid var(--border)", borderRadius: "10px", padding: "12px 16px", marginBottom: "14px", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "13px", color: "var(--muted)" }}>합계 금액</span>
              <span style={{ fontSize: "17px", fontWeight: 800, color: GREEN }}>₩{fmt(qty * unitPrice)}</span>
            </div>
          )}

          <div style={{ marginBottom: "14px" }}>
            <label style={label}>거래처 / 프로젝트명</label>
            <input type="text" style={input} value={note} onChange={e => setNote(e.target.value)} placeholder="거래처명 또는 프로젝트명" />
          </div>

          <div style={{ marginBottom: "14px" }}>
            <label style={{ ...smLabel, color: ADDON_ACCENT }}>추가모듈</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
              {sortOptions(addonOptions).map(o => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setAddon(prev => prev === o.value ? "" : o.value)}
                  style={{
                    padding: "5px 12px", borderRadius: "999px", fontSize: "12px",
                    border: `1px solid ${addon === o.value ? ADDON_ACCENT : "var(--border)"}`,
                    background: addon === o.value ? `${ADDON_ACCENT}15` : "white",
                    color: addon === o.value ? ADDON_ACCENT : "var(--foreground)",
                    fontWeight: addon === o.value ? 600 : 500,
                    cursor: "pointer",
                  }}
                >
                  {o.value}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", borderRadius: "10px", padding: "11px 14px", fontSize: "13px", marginBottom: "14px" }}>{error}</div>
          )}

          {result && (
            <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", borderRadius: "10px", padding: "11px 14px", fontSize: "13px", marginBottom: "14px", lineHeight: 1.5 }}>
              {result.kind === "fifo" ? (
                <>
                  출고 완료 · 모델 카운터 <strong>{result.seqFrom} ~ {result.seqTo}</strong>
                  {result.companions.map((c) => (
                    <span key={`${c.name}-${c.seqFrom}`}>
                      <br />
                      <span style={{ opacity: 0.95 }}>· {c.name}</span> 카운터 <strong>{c.seqFrom} ~ {c.seqTo}</strong>
                    </span>
                  ))}
                </>
              ) : (
                <>
                  출고 완료 · <strong>{result.qty}</strong>대
                  {result.companions.map((c) => (
                    <span key={`${c.name}-${c.seqFrom}`}>
                      <br />
                      <span style={{ opacity: 0.95 }}>· {c.name}</span> 카운터 <strong>{c.seqFrom} ~ {c.seqTo}</strong>
                    </span>
                  ))}
                </>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: "100%", padding: "14px", background: GREEN, color: "white",
              border: "none", borderRadius: "11px", fontSize: "15px", fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.75 : 1,
              boxShadow: "0 4px 14px rgba(22, 163, 74, 0.35)",
            }}
          >
            {loading ? "처리 중…" : "출고 등록"}
          </button>
        </div>
      </div>
    </div>
  );
}
