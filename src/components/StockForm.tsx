"use client";

import { useState, useEffect } from "react";
import { PackagePlus, PackageMinus, Plus, Trash2 } from "lucide-react";

interface Product { id: number; modelName: string; variant: string }
interface Part { id: number; name: string; unit: string }
interface ProductStock { productId: number; quantity: number; product: Product }
interface PartStock { partId: number; quantity: number; part: Part }

// 출고 시 추가할 부품 항목
interface PartItem { partId: number; name: string; unit: string; quantity: number; currentStock: number; auto?: boolean }

// 이동형 선택 시 자동 추가할 부품 접미사 목록 (앞에 모델명이 붙음)
const MOVING_AUTO_SUFFIXES = ["이동형_베이스", "이동형_상판", "이동형_보강_4Set"];

interface Props { type: "IN" | "OUT" }

const VARIANTS = ["Master", "Slave", "Center", "이동형"];

export default function StockForm({ type }: Props) {
  const [tab, setTab] = useState<"product" | "part">("product");

  const isIN = type === "IN";
  const accentColor = isIN ? "#38a169" : "#c5a028";
  const accentBg   = isIN ? "#f0fff4"  : "#fffdf0";

  return (
    <div style={{ maxWidth: "640px", width: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: accentBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {isIN ? <PackagePlus size={22} color={accentColor} /> : <PackageMinus size={22} color={accentColor} />}
        </div>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0, color: "var(--foreground)" }}>
            {isIN ? "입고 등록" : "출고 등록"}
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "13px", marginTop: "2px" }}>
            제품 또는 부품을 선택해 {isIN ? "입고" : "출고"} 처리합니다.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0", marginBottom: "20px", background: "#f1f5f9", borderRadius: "10px", padding: "4px" }}>
        {(["product", "part"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} style={{
            flex: 1, padding: "9px", borderRadius: "7px", border: "none",
            background: tab === t ? "white" : "transparent",
            color: tab === t ? "var(--foreground)" : "var(--muted)",
            fontWeight: tab === t ? 600 : 400, fontSize: "14px", cursor: "pointer",
            boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            transition: "all 0.15s",
          }}>
            {t === "product" ? "제품 (모델)" : "부품"}
          </button>
        ))}
      </div>

      {tab === "product"
        ? <ProductForm type={type} accentColor={accentColor} accentBg={accentBg} />
        : <PartForm    type={type} accentColor={accentColor} accentBg={accentBg} />}
    </div>
  );
}

/* ─────────────── 제품 입출고 폼 ─────────────── */

function ProductForm({ type, accentColor, accentBg }: { type: "IN"|"OUT"; accentColor: string; accentBg: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [modelNames, setModelNames] = useState<string[]>([]);
  const [productStocks, setProductStocks] = useState<ProductStock[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [partStocks, setPartStocks] = useState<PartStock[]>([]);

  const [selectedModel, setSelectedModel] = useState("");
  const [selectedVariant, setSelectedVariant] = useState("");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  // 부품 추가 (출고 전용)
  const [partItems, setPartItems] = useState<PartItem[]>([]);
  const [selPartId, setSelPartId] = useState("");
  const [selPartQty, setSelPartQty] = useState("");

  const isOUT = type === "OUT";

  useEffect(() => {
    // 누락된 파생모델(이동형 등) 자동 보완 후 데이터 로드
    fetch("/api/ensure-variants", { method: "POST" }).then(() =>
      Promise.all([
        fetch("/api/products").then(r => r.json()),
        fetch("/api/models").then(r => r.json()),
        fetch("/api/product-stock").then(r => r.json()),
        fetch("/api/parts").then(r => r.json()),
        fetch("/api/part-stock").then(r => r.json()),
      ]).then(([p, m, s, pa, ps]) => {
        setProducts(p); setModelNames(m); setProductStocks(s);
        setParts(pa); setPartStocks(ps);
      })
    );
  }, []);

  // 이동형 선택 시 부품 자동 추가/제거
  const [missingAutoParts, setMissingAutoParts] = useState<string[]>([]);

  useEffect(() => {
    if (!isOUT) return;
    const qty = parseInt(quantity) || 0;

    if (selectedVariant === "이동형" && selectedModel) {
      // 모델명_접미사 형태로 부품명 생성
      const autoPartNames = MOVING_AUTO_SUFFIXES.map(suffix => `${selectedModel}_${suffix}`);
      const missing = autoPartNames.filter(name => !parts.find(p => p.name === name));
      setMissingAutoParts(missing);

      if (qty > 0) {
        const autoItems: PartItem[] = autoPartNames.flatMap(name => {
          const part = parts.find(p => p.name === name);
          if (!part) return [];
          const stock = partStocks.find(s => s.partId === part.id)?.quantity ?? 0;
          return [{ partId: part.id, name: part.name, unit: part.unit, quantity: qty, currentStock: stock, auto: true }];
        });
        setPartItems(prev => {
          const manual = prev.filter(p => !p.auto);
          return [...autoItems, ...manual];
        });
      }
    } else {
      setMissingAutoParts([]);
      setPartItems(prev => prev.filter(p => !p.auto));
    }
  }, [selectedVariant, selectedModel, quantity, parts, partStocks, isOUT]);

  const selectedProduct = products.find(p => p.modelName === selectedModel && p.variant === selectedVariant);
  const currentStock = productStocks.find(s => s.productId === selectedProduct?.id)?.quantity ?? 0;

  const selectedPartForAdd = parts.find(p => p.id === parseInt(selPartId));
  const selPartCurrentStock = partStocks.find(s => s.partId === selectedPartForAdd?.id)?.quantity ?? 0;

  const addPartItem = () => {
    if (!selectedPartForAdd || !selPartQty || parseInt(selPartQty) < 1) return;
    // 이미 추가된 부품이면 수량 합산
    const exists = partItems.find(p => p.partId === selectedPartForAdd.id);
    if (exists) {
      setPartItems(prev => prev.map(p =>
        p.partId === selectedPartForAdd.id
          ? { ...p, quantity: p.quantity + parseInt(selPartQty) }
          : p
      ));
    } else {
      setPartItems(prev => [...prev, {
        partId: selectedPartForAdd.id,
        name: selectedPartForAdd.name,
        unit: selectedPartForAdd.unit,
        quantity: parseInt(selPartQty),
        currentStock: selPartCurrentStock,
      }]);
    }
    setSelPartId(""); setSelPartQty("");
  };

  const removePartItem = (partId: number) => {
    setPartItems(prev => prev.filter(p => p.partId !== partId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantity) return;
    if (!selectedProduct) {
      setMessage({ ok: false, text: "선택한 모델/파생모델을 찾을 수 없습니다. 페이지를 새로고침 해주세요." });
      return;
    }
    setLoading(true); setMessage(null);

    // 1. 제품 입출고 등록
    const res = await fetch("/api/product-transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: selectedProduct.id, type, quantity: parseInt(quantity), note: note || null, date }),
    });
    const data = await res.json();

    if (!res.ok) {
      setMessage({ ok: false, text: data.error });
      setLoading(false); return;
    }

    // 2. 부품 출고 등록 (출고 시에만) — 제품 트랜잭션 ID를 함께 전달
    if (isOUT && partItems.length > 0) {
      const productTxId: number | undefined = data?.id;
      const partResults = await Promise.all(
        partItems.map(item =>
          fetch("/api/part-transactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ partId: item.partId, type: "OUT", quantity: item.quantity, note: note || null, date, productTransactionId: productTxId }),
          }).then(r => r.json().then(d => ({ ok: r.ok, data: d, item })))
        )
      );

      const failed = partResults.filter(r => !r.ok);
      if (failed.length > 0) {
        const errMsg = failed.map(f => `${f.item.name}: ${f.data.error}`).join(", ");
        setMessage({ ok: false, text: `제품 출고는 완료됐으나 부품 오류: ${errMsg}` });
        setLoading(false); return;
      }
    }

    const delta = parseInt(quantity);
    setProductStocks(prev => {
      const exists = prev.find(s => s.productId === selectedProduct.id);
      const newQty = type === "IN" ? currentStock + delta : currentStock - delta;
      if (exists) return prev.map(s => s.productId === selectedProduct.id ? { ...s, quantity: newQty } : s);
      return [...prev, { productId: selectedProduct.id, quantity: newQty, product: selectedProduct }];
    });

    const partSummary = partItems.length > 0
      ? ` | 부품 ${partItems.length}종 함께 출고`
      : "";
    setMessage({ ok: true, text: `${type === "IN" ? "입고" : "출고"} 완료: ${selectedProduct.modelName} ${selectedProduct.variant} ${delta}대 (${date})${partSummary}` });
    setQuantity(""); setNote(""); setPartItems([]);
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} style={formCard}>
      {/* 모델명 */}
      <Field label="모델명">
        <select value={selectedModel} onChange={e => { setSelectedModel(e.target.value); setSelectedVariant(""); }} required style={selectSt}>
          <option value="">선택하세요</option>
          {modelNames.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </Field>

      {/* 파생 모델 */}
      <Field label="파생 모델">
        <div style={{ display: "flex", gap: "8px" }}>
          {VARIANTS.map(v => {
            const active = selectedVariant === v;
            return (
              <button key={v} type="button" disabled={!selectedModel}
                onClick={() => setSelectedVariant(v)}
                style={{
                  flex: 1, padding: "9px 4px", borderRadius: "8px",
                  border: `1.5px solid ${active ? accentColor : "var(--border)"}`,
                  background: active ? accentBg : "white",
                  color: active ? (type === "IN" ? "#276749" : "#92400e") : "var(--foreground)",
                  fontWeight: active ? 700 : 400, fontSize: "13px",
                  cursor: selectedModel ? "pointer" : "not-allowed",
                  opacity: selectedModel ? 1 : 0.4,
                }}
              >{v}</button>
            );
          })}
        </div>
      </Field>

      {/* 현재 제품 재고 */}
      {selectedProduct && (
        <div style={stockInfo(currentStock < 3)}>
          현재 재고: <strong style={{ color: currentStock < 3 ? "#e05c5c" : "var(--foreground)" }}>{currentStock}대</strong>
          {type === "OUT" && currentStock === 0 && <span style={{ color: "#e05c5c", marginLeft: "8px" }}>⚠ 재고 없음</span>}
        </div>
      )}

      {/* 날짜 */}
      <Field label="날짜">
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          required style={{ ...inputSt, width: "180px" }} />
      </Field>

      {/* 수량 */}
      <Field label="수량 (대)">
        <input type="number" min="1" value={quantity}
          onChange={e => setQuantity(e.target.value)}
          placeholder="수량 입력" required style={{ ...inputSt, width: "140px" }} />
      </Field>

      {/* 현장명 */}
      <Field label="현장명 (선택)">
        <input type="text" value={note} onChange={e => setNote(e.target.value)}
          placeholder="현장명을 입력하세요" style={inputSt} />
      </Field>

      {/* 이동형 미등록 부품 경고 */}
      {isOUT && selectedVariant === "이동형" && selectedModel && missingAutoParts.length > 0 && (
        <div style={{ padding: "11px 14px", borderRadius: "8px", fontSize: "13px", background: "#fff7ed", border: "1px solid #fed7aa", color: "#9a3412" }}>
          ⚠ 아래 부품이 등록되어 있지 않아 자동 추가되지 않습니다:<br />
          <strong>{missingAutoParts.join(", ")}</strong><br />
          <span style={{ fontSize: "12px" }}>설정 → 부품 관리에서 먼저 등록해주세요.</span>
        </div>
      )}

      {/* ── 부품 추가 (출고 전용) ── */}
      {isOUT && (
        <div style={{ borderTop: "1px dashed var(--border)", paddingTop: "18px" }}>
          <p style={{ fontSize: "13px", fontWeight: 700, margin: "0 0 12px", color: "var(--foreground)" }}>
            부품 동시 출고 <span style={{ fontWeight: 400, color: "var(--muted)", fontSize: "12px" }}>(선택)</span>
          </p>

          {/* 부품 선택 입력 */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ flex: "2 1 160px" }}>
              <label style={{ display: "block", fontSize: "12px", color: "var(--muted)", marginBottom: "5px" }}>부품 선택</label>
              <select value={selPartId} onChange={e => setSelPartId(e.target.value)} style={selectSt}>
                <option value="">부품을 선택하세요</option>
                {parts.map(p => {
                  const stock = partStocks.find(s => s.partId === p.id)?.quantity ?? 0;
                  return <option key={p.id} value={p.id}>{p.name} (재고: {stock}{p.unit})</option>;
                })}
              </select>
            </div>
            <div style={{ flex: "0 0 100px" }}>
              <label style={{ display: "block", fontSize: "12px", color: "var(--muted)", marginBottom: "5px" }}>수량</label>
              <input type="number" min="1" value={selPartQty}
                onChange={e => setSelPartQty(e.target.value)}
                placeholder="수량"
                style={{ ...inputSt, width: "100%" }}
              />
            </div>
            <button type="button" onClick={addPartItem}
              disabled={!selPartId || !selPartQty}
              style={{
                display: "flex", alignItems: "center", gap: "5px",
                padding: "9px 14px", borderRadius: "8px", border: "none",
                background: selPartId && selPartQty ? "#eef2ff" : "#f1f5f9",
                color: selPartId && selPartQty ? "#4338ca" : "#a0aec0",
                fontSize: "13px", fontWeight: 600, cursor: selPartId && selPartQty ? "pointer" : "not-allowed",
                whiteSpace: "nowrap", flexShrink: 0,
              }}>
              <Plus size={14} /> 추가
            </button>
          </div>

          {/* 추가된 부품 목록 */}
          {partItems.length > 0 && (
            <div style={{ marginTop: "12px", border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden" }}>
              <div style={{ padding: "8px 12px", background: "#f7f8fc", borderBottom: "1px solid var(--border)", fontSize: "12px", color: "var(--muted)", fontWeight: 600 }}>
                추가된 부품 ({partItems.length}종)
              </div>
              {partItems.map(item => {
                const isOver = item.quantity > item.currentStock;
                return (
                  <div key={item.partId} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "10px 12px", borderBottom: "1px solid var(--border)",
                    background: item.auto ? "#fffdf0" : isOver ? "#fff5f5" : "white",
                  }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: "13px" }}>{item.name}</span>
                      {item.auto && (
                        <span style={{ marginLeft: "6px", fontSize: "10px", background: "#fef9c3", color: "#854d0e", padding: "1px 5px", borderRadius: "3px", fontWeight: 600 }}>자동</span>
                      )}
                      <span style={{ marginLeft: "8px", fontSize: "12px", color: "var(--muted)" }}>
                        재고 {item.currentStock}{item.unit}
                      </span>
                      {isOver && <span style={{ marginLeft: "6px", fontSize: "11px", color: "#c53030" }}>⚠ 재고 부족</span>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontWeight: 700, fontSize: "14px", color: "#c53030" }}>
                        −{item.quantity}{item.unit}
                      </span>
                      {!item.auto && (
                        <button type="button" onClick={() => removePartItem(item.partId)}
                          style={{ width: "26px", height: "26px", borderRadius: "5px", border: "none", background: "#fff0f0", color: "#e05c5c", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {message && <MsgBox ok={message.ok}>{message.text}</MsgBox>}

      <SubmitBtn loading={loading} color={accentColor}>
        {loading ? "처리 중..." : `${type === "IN" ? "입고" : "출고"} 등록${isOUT && partItems.length > 0 ? ` (+부품 ${partItems.length}종)` : ""}`}
      </SubmitBtn>
    </form>
  );
}

/* ─────────────── 부품 입출고 폼 ─────────────── */

function PartForm({ type, accentColor, accentBg }: { type: "IN"|"OUT"; accentColor: string; accentBg: string }) {
  const [parts, setParts] = useState<Part[]>([]);
  const [partStocks, setPartStocks] = useState<PartStock[]>([]);

  const [selectedPartId, setSelectedPartId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const isIN = type === "IN";

  useEffect(() => {
    Promise.all([
      fetch("/api/parts").then(r => r.json()),
      fetch("/api/part-stock").then(r => r.json()),
    ]).then(([p, s]) => { setParts(p); setPartStocks(s); });
  }, []);

  const selectedPart = parts.find(p => p.id === parseInt(selectedPartId));
  const currentStock = partStocks.find(s => s.partId === selectedPart?.id)?.quantity ?? 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPart || !quantity) return;
    setLoading(true); setMessage(null);

    const res = await fetch("/api/part-transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partId: selectedPart.id, type, quantity: parseInt(quantity), note: note || null, date }),
    });
    const data = await res.json();

    if (!res.ok) {
      setMessage({ ok: false, text: data.error });
    } else {
      const delta = parseInt(quantity);
      setPartStocks(prev => {
        const exists = prev.find(s => s.partId === selectedPart.id);
        const newQty = isIN ? currentStock + delta : currentStock - delta;
        if (exists) return prev.map(s => s.partId === selectedPart.id ? { ...s, quantity: newQty } : s);
        return [...prev, { partId: selectedPart.id, quantity: newQty, part: selectedPart }];
      });
      setMessage({ ok: true, text: `${isIN ? "입고" : "출고"} 완료: ${selectedPart.name} ${delta}${selectedPart.unit} (${date})` });
      setQuantity(""); setNote("");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} style={formCard}>
      <Field label="부품">
        <select value={selectedPartId} onChange={e => setSelectedPartId(e.target.value)} required style={selectSt}>
          <option value="">부품을 선택하세요</option>
          {parts.map(p => <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>)}
        </select>
      </Field>

      {selectedPart && (
        <div style={stockInfo(currentStock < 5)}>
          현재 재고: <strong style={{ color: currentStock < 5 ? "#e05c5c" : "var(--foreground)" }}>
            {currentStock}{selectedPart.unit}
          </strong>
          {type === "OUT" && currentStock === 0 && <span style={{ color: "#e05c5c", marginLeft: "8px" }}>⚠ 재고 없음</span>}
        </div>
      )}

      <Field label="날짜">
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          required style={{ ...inputSt, width: "180px" }} />
      </Field>

      <Field label={`수량 (${selectedPart?.unit ?? "EA"})`}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input type="number" min="1" value={quantity}
            onChange={e => setQuantity(e.target.value)}
            placeholder="수량 입력" required style={{ ...inputSt, width: "140px" }} />
          {selectedPart && (
            <span style={{ padding: "0 12px", height: "38px", display: "flex", alignItems: "center",
              background: "#f1f5f9", border: "1px solid var(--border)", borderRadius: "8px",
              fontSize: "13px", color: "var(--muted)" }}>
              {selectedPart.unit}
            </span>
          )}
        </div>
      </Field>

      <Field label="현장명 (선택)">
        <input type="text" value={note} onChange={e => setNote(e.target.value)}
          placeholder="현장명을 입력하세요" style={inputSt} />
      </Field>

      {message && <MsgBox ok={message.ok}>{message.text}</MsgBox>}

      <SubmitBtn loading={loading} color={accentColor}>
        {loading ? "처리 중..." : `${type === "IN" ? "입고" : "출고"} 등록`}
      </SubmitBtn>
    </form>
  );
}

/* ─────────────── 공용 UI 헬퍼 ─────────────── */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--foreground)", marginBottom: "7px" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function MsgBox({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <div style={{ padding: "11px 14px", borderRadius: "8px", fontSize: "13px",
      background: ok ? "#f0fff4" : "#fff5f5",
      border: `1px solid ${ok ? "#9ae6b4" : "#feb2b2"}`,
      color: ok ? "#276749" : "#c53030" }}>
      {children}
    </div>
  );
}

function SubmitBtn({ loading, color, children }: { loading: boolean; color: string; children: React.ReactNode }) {
  return (
    <button type="submit" disabled={loading}
      style={{ padding: "12px", borderRadius: "8px", border: "none",
        background: loading ? "#94a3b8" : color, color: "white",
        fontSize: "15px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
      {children}
    </button>
  );
}

function stockInfo(isLow: boolean): React.CSSProperties {
  return { padding: "11px 14px", borderRadius: "8px", fontSize: "13px", color: "var(--muted)",
    background: isLow ? "#fff5f5" : "#f7f8fc", border: `1px solid ${isLow ? "#feb2b2" : "var(--border)"}` };
}

/* ─────────────── 스타일 상수 ─────────────── */

const formCard: React.CSSProperties = {
  background: "var(--card-bg)", border: "1px solid var(--border)",
  borderRadius: "12px", padding: "24px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  display: "flex", flexDirection: "column", gap: "18px",
};

const selectSt: React.CSSProperties = {
  width: "100%", padding: "9px 12px", borderRadius: "8px",
  border: "1px solid var(--border)", fontSize: "14px",
  color: "var(--foreground)", background: "white", outline: "none", cursor: "pointer",
};

const inputSt: React.CSSProperties = {
  flex: 1, padding: "9px 12px", borderRadius: "8px",
  border: "1px solid var(--border)", fontSize: "14px",
  color: "var(--foreground)", background: "white", outline: "none",
};
