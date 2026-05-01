"use client";

type AssemblyComp = { role: string; label: string; stock: number };
type AssemblyLink = {
  assembleableSets: number;
  bottleneck: AssemblyComp | null;
  components: AssemblyComp[];
};

interface StockItem {
  itemId: number;
  itemName: string;
  totalIn: number;
  totalOut: number;
  currentStock: number;
  assemblyLink?: AssemblyLink | null;
}

interface Props { data: StockItem[] }

/** 긴 품목명 줄임 — 툴팁에 전체 표시 */
function shortLabel(raw: string, max = 16) {
  if (raw.length <= max) return raw;
  return `${raw.slice(0, Math.floor(max / 2))}…${raw.slice(-4)}`;
}

export default function StockChart({ data }: Props) {
  const hasSkuData = data.some((d) => d.totalIn > 0);
  const hasAssembly = data.some((d) => d.assemblyLink && d.assemblyLink.components.some((c) => c.stock > 0));

  if (!hasSkuData && !hasAssembly) {
    return (
      <div style={{ textAlign: "center", padding: "48px 0", color: "var(--muted)", fontSize: "14px" }}>
        표시할 입고·연동 재고가 없습니다.
      </div>
    );
  }

  const barScaleMax = Math.max(
    ...data.map((d) => d.totalIn),
    ...(data.flatMap((d) => [d.assemblyLink?.assembleableSets ?? 0])),
    1
  );

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ minWidth: "520px" }}>
        <div style={{ display: "flex", gap: "24px", marginBottom: "16px", flexWrap: "wrap" }}>
          {[
            { color: "#a0aec0", label: "완품·모델 현재고(막대)" },
            { color: "#48bb78", label: "완품·모델 출고" },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--muted)" }}>
              <div style={{ width: "12px", height: "12px", background: color, borderRadius: "2px" }} />
              {label}
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#7c3aed" }}>
            <div style={{
              width: "12px", height: "12px", borderRadius: "2px",
              background: "repeating-linear-gradient(135deg,#c4b5fd,#c4b5fd 2px,#ede9fe 2px,#ede9fe 4px)",
            }} />
            파생 세트(부품 연동) 재고 가능
          </div>
        </div>

        {data.map((item) => {
          const asm = item.assemblyLink;
          const hasAsmBar = asm && asm.components.some((c) => c.stock > 0);

          /** 완품 입고 분할 바 */
          const skuBlock =
            item.totalIn > 0 ? (
              (() => {
                const barW = (item.totalIn / barScaleMax) * 100;
                const stockRatio = item.totalIn > 0 ? item.currentStock / item.totalIn : 0;
                const outRatio = item.totalIn > 0 ? item.totalOut / item.totalIn : 0;
                return (
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                    <div style={{ width: `${barW}%`, height: "20px", borderRadius: "4px", overflow: "hidden", display: "flex", minWidth: "4px" }}>
                      {stockRatio > 0 && (
                        <div title={`완품 현재고 ${item.currentStock}`} style={{ width: `${stockRatio * 100}%`, height: "100%", background: "#a0aec0" }} />
                      )}
                      {outRatio > 0 && (
                        <div title={`완품 출고 ${item.totalOut}`} style={{ width: `${outRatio * 100}%`, height: "100%", background: "#48bb78" }} />
                      )}
                    </div>
                    <span style={{ fontSize: "12px", color: "var(--muted)", whiteSpace: "nowrap" }}>
                      {item.currentStock > 0 && <span style={{ color: "#718096" }}>{item.currentStock} </span>}
                      {item.totalOut > 0 && <span style={{ color: "#48bb78" }}>/ {item.totalOut} </span>}
                      <span style={{ color: "#cbd5e1" }}>(총입고 {item.totalIn})</span>
                    </span>
                  </div>
                );
              })()
            ) : (
              <span style={{ fontSize: "12px", color: "#cbd5e0", flexShrink: 0 }}>
                완품 입고 없음
              </span>
            );

          /** 파생 세트(부품 min) 바 — 보라 계열 패턴으로 구분 */
          const asmBar =
            hasAsmBar && asm ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", marginTop: "6px", minWidth: 0 }}>
                <div
                  title={asm.components.map((c) => `${c.role} · ${c.label}: ${c.stock}`).join("\n")}
                  style={{
                    width: `${(Math.max(asm.assembleableSets, 0.5) / barScaleMax) * 100}%`,
                    minWidth: asm.assembleableSets > 0 ? "28px" : "4px",
                    height: "12px",
                    borderRadius: "4px",
                    background: asm.assembleableSets > 0
                      ? "linear-gradient(90deg, #ddd6fe 0%, #a78bfa 100%)"
                      : "#e9d5ff",
                    border: "1px solid #c4b5fd",
                    boxSizing: "border-box",
                  }}
                />
                <span style={{ fontSize: "11px", color: "#6d28d9", whiteSpace: "nowrap", fontWeight: 600 }}>
                  세트 재고 가능 {asm.assembleableSets}
                  {asm.bottleneck && (
                    <span style={{ fontWeight: 500, marginLeft: "6px", color: "#7c3aed" }}>
                      · 병목: {shortLabel(asm.bottleneck.label)}
                    </span>
                  )}
                </span>
              </div>
            ) : null;

          /** 파생 줄 설명 텍스트 (부품 나열) */
          const asmDetail =
            asm && asm.components.length > 0 ? (
              <div
                style={{
                  gridColumn: "2 / -1",
                  marginTop: "4px",
                  fontSize: "11px",
                  color: "#64748b",
                  lineHeight: 1.45,
                  paddingLeft: "8px",
                  borderLeft: "2px solid #ddd6fe",
                }}
              >
                {asm.components.map((c) => `${c.role}「${shortLabel(c.label)}」${c.stock}대`).join(" · ")}
              </div>
            ) : null;

          if (item.totalIn === 0 && !hasAsmBar) {
            return (
              <div key={item.itemId} style={{ marginBottom: "14px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "148px minmax(0,1fr)", gap: "8px", alignItems: "start" }}>
                  <div style={{ fontSize: "13px", color: "var(--foreground)", textAlign: "right", paddingRight: "6px", fontWeight: asm ? 700 : 400 }}>
                    {item.itemName}
                    {asm && <div style={{ fontSize: "10px", color: "#9333ea", fontWeight: 600, marginTop: "4px" }}>파생</div>}
                  </div>
                  <span style={{ fontSize: "12px", color: "#cbd5e0" }}>입고·연동 없음</span>
                </div>
              </div>
            );
          }

          return (
            <div key={item.itemId} style={{ marginBottom: asmBar ? "18px" : "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "148px minmax(0,1fr)", gap: "10px", alignItems: "center" }}>
                <div style={{ fontSize: "13px", color: "var(--foreground)", textAlign: "right", paddingRight: "6px", fontWeight: asm ? 700 : 400, alignSelf: "start", paddingTop: "2px" }}>
                  <span>{item.itemName}</span>
                  {asm && (
                    <div style={{ fontSize: "10px", color: "#9333ea", fontWeight: 600, marginTop: "6px", lineHeight: 1.3 }}>
                      파생 세트 재고 표시 중
                      <span style={{ color: "#a78bfa", fontWeight: 500 }}>(베이스+추가모듈·세부사양 단품과 연계)</span>
                    </div>
                  )}
                </div>
                <div style={{ minWidth: 0 }}>
                  {skuBlock}
                  {asmBar}
                  {asmDetail}
                </div>
              </div>
            </div>
          );
        })}

        <div style={{ marginTop: "16px", fontSize: "11px", color: "#94a3b8", lineHeight: 1.5 }}>
          <strong style={{ color: "#64748b" }}>해석 방법:</strong> BT-400·BF-400 게이트를 출고하면 베이스 재고가 줄고,
          「추가모듈」「세부사양」 단독 출고로 부품 재고도 줄입니다. BF-400M은 Master·Slave·Center 중 가장 적은 재고만큼만 세트로 조립된다고 표시합니다.
        </div>
      </div>
    </div>
  );
}
