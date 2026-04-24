"use client";

import { useEffect, useState } from "react";
import { Settings, Plus, Pencil, Trash2, Check, X, Wrench } from "lucide-react";

interface Part {
  id: number;
  name: string;
  unit: string;
}

export default function SettingsPage() {
  // ---------- 모델 상태 ----------
  const [models, setModels] = useState<string[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [newModel, setNewModel] = useState("");
  const [addModelLoading, setAddModelLoading] = useState(false);
  const [addModelError, setAddModelError] = useState("");
  const [editingModel, setEditingModel] = useState<string | null>(null);
  const [editModelValue, setEditModelValue] = useState("");
  const [editModelError, setEditModelError] = useState("");
  const [deleteModelConfirm, setDeleteModelConfirm] = useState<string | null>(null);
  const [deleteModelError, setDeleteModelError] = useState("");

  // ---------- 부품 상태 ----------
  const [parts, setParts] = useState<Part[]>([]);
  const [partsLoading, setPartsLoading] = useState(true);
  const [newPartName, setNewPartName] = useState("");
  const [newPartUnit, setNewPartUnit] = useState("EA");
  const [addPartLoading, setAddPartLoading] = useState(false);
  const [addPartError, setAddPartError] = useState("");
  const [editingPart, setEditingPart] = useState<number | null>(null);
  const [editPartName, setEditPartName] = useState("");
  const [editPartUnit, setEditPartUnit] = useState("");
  const [editPartError, setEditPartError] = useState("");
  const [deletePartConfirm, setDeletePartConfirm] = useState<number | null>(null);
  const [deletePartError, setDeletePartError] = useState("");

  // ---------- fetch ----------
  const fetchModels = () => {
    setModelsLoading(true);
    fetch("/api/models")
      .then((r) => r.json())
      .then((d) => { setModels(d); setModelsLoading(false); });
  };

  const fetchParts = () => {
    setPartsLoading(true);
    fetch("/api/parts")
      .then((r) => r.json())
      .then((d) => { setParts(d); setPartsLoading(false); });
  };

  useEffect(() => { fetchModels(); fetchParts(); }, []);

  // ---------- 모델 핸들러 ----------
  const handleAddModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModel.trim()) return;
    setAddModelLoading(true);
    setAddModelError("");
    const res = await fetch("/api/models", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelName: newModel.trim() }),
    });
    const data = await res.json();
    if (!res.ok) { setAddModelError(data.error); }
    else { setNewModel(""); fetchModels(); }
    setAddModelLoading(false);
  };

  const handleRenameModel = async (oldName: string) => {
    if (!editModelValue.trim() || editModelValue.trim() === oldName) {
      setEditingModel(null); return;
    }
    setEditModelError("");
    const res = await fetch("/api/models/rename", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldName, newName: editModelValue.trim() }),
    });
    const data = await res.json();
    if (!res.ok) { setEditModelError(data.error); }
    else { setEditingModel(null); fetchModels(); }
  };

  const handleDeleteModel = async (modelName: string) => {
    setDeleteModelError("");
    const res = await fetch(`/api/models/${encodeURIComponent(modelName)}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { setDeleteModelError(data.error); setDeleteModelConfirm(null); }
    else { setDeleteModelConfirm(null); fetchModels(); }
  };

  // ---------- 부품 핸들러 ----------
  const handleAddPart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartName.trim()) return;
    setAddPartLoading(true);
    setAddPartError("");
    const res = await fetch("/api/parts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newPartName.trim(), unit: newPartUnit.trim() || "EA" }),
    });
    const data = await res.json();
    if (!res.ok) { setAddPartError(data.error); }
    else { setNewPartName(""); setNewPartUnit("EA"); fetchParts(); }
    setAddPartLoading(false);
  };

  const handleRenamePart = async (partId: number) => {
    if (!editPartName.trim()) { setEditingPart(null); return; }
    setEditPartError("");
    const res = await fetch(`/api/parts/${partId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editPartName.trim(), unit: editPartUnit.trim() || "EA" }),
    });
    const data = await res.json();
    if (!res.ok) { setEditPartError(data.error); }
    else { setEditingPart(null); fetchParts(); }
  };

  const handleDeletePart = async (partId: number) => {
    setDeletePartError("");
    const res = await fetch(`/api/parts/${partId}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { setDeletePartError(data.error); setDeletePartConfirm(null); }
    else { setDeletePartConfirm(null); fetchParts(); }
  };

  return (
    <div style={{ maxWidth: "640px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
        <div style={iconBox("#eef2ff")}>
          <Settings size={22} color="#5b6ee8" />
        </div>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0, color: "var(--foreground)" }}>
            설정
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "13px", marginTop: "2px" }}>
            모델 및 부품을 추가·수정·삭제합니다.
          </p>
        </div>
      </div>

      {/* ===== 모델 관리 ===== */}
      <SectionHeader icon={<Settings size={16} color="#5b6ee8" />} bg="#eef2ff" title="모델 관리" />

      <div style={card}>
        <h2 style={cardTitle}>새 모델 추가</h2>
        <form onSubmit={handleAddModel} style={{ display: "flex", gap: "10px" }}>
          <input
            type="text"
            value={newModel}
            onChange={(e) => { setNewModel(e.target.value); setAddModelError(""); }}
            placeholder="예: SG-700"
            style={inputStyle(!!addModelError)}
          />
          <SubmitBtn disabled={addModelLoading || !newModel.trim()} loading={addModelLoading} color="#5b6ee8">
            <Plus size={15} /> {addModelLoading ? "추가 중..." : "추가"}
          </SubmitBtn>
        </form>
        {addModelError && <ErrMsg>{addModelError}</ErrMsg>}
        <p style={hintStyle}>추가하면 Master / Slave / Center 파생 모델 3개가 자동 생성됩니다.</p>
      </div>

      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        <div style={listHeader}>
          <span style={{ fontSize: "14px", fontWeight: 600 }}>등록된 모델</span>
          <Badge>{models.length}개</Badge>
        </div>
        <ItemList
          loading={modelsLoading}
          empty="등록된 모델이 없습니다."
          items={models}
          renderItem={(model, i, arr) => (
            <li key={model} style={listItem(i, arr.length)}>
              {editingModel === model ? (
                <EditRow
                  value={editModelValue}
                  onChange={(v) => { setEditModelValue(v); setEditModelError(""); }}
                  onSave={() => handleRenameModel(model)}
                  onCancel={() => { setEditingModel(null); setEditModelError(""); }}
                  error={editModelError}
                />
              ) : deleteModelConfirm === model ? (
                <DeleteConfirm
                  label={model}
                  error={deleteModelError}
                  onConfirm={() => handleDeleteModel(model)}
                  onCancel={() => { setDeleteModelConfirm(null); setDeleteModelError(""); }}
                />
              ) : (
                <ViewRow
                  label={model}
                  badge="Master · Slave · Center"
                  onEdit={() => { setEditingModel(model); setEditModelValue(model); setEditModelError(""); setDeleteModelConfirm(null); }}
                  onDelete={() => { setDeleteModelConfirm(model); setDeleteModelError(""); setEditingModel(null); }}
                />
              )}
            </li>
          )}
        />
      </div>

      {/* ===== 부품 관리 ===== */}
      <div style={{ marginTop: "40px" }}>
        <SectionHeader icon={<Wrench size={16} color="#c5a028" />} bg="#fffdf0" title="부품 관리" />
      </div>

      <div style={card}>
        <h2 style={cardTitle}>새 부품 추가</h2>
        <form onSubmit={handleAddPart} style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <input
            type="text"
            value={newPartName}
            onChange={(e) => { setNewPartName(e.target.value); setAddPartError(""); }}
            placeholder="부품명 예: 전원 케이블"
            style={{ ...inputStyle(!!addPartError), flex: "2 1 160px" }}
          />
          <input
            type="text"
            value={newPartUnit}
            onChange={(e) => setNewPartUnit(e.target.value)}
            placeholder="단위"
            style={{ ...inputStyle(false), flex: "0 0 70px", textAlign: "center" }}
          />
          <SubmitBtn disabled={addPartLoading || !newPartName.trim()} loading={addPartLoading} color="#c5a028">
            <Plus size={15} /> {addPartLoading ? "추가 중..." : "추가"}
          </SubmitBtn>
        </form>
        {addPartError && <ErrMsg>{addPartError}</ErrMsg>}
        <p style={hintStyle}>단위를 비워두면 기본값 EA로 저장됩니다.</p>
      </div>

      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        <div style={listHeader}>
          <span style={{ fontSize: "14px", fontWeight: 600 }}>등록된 부품</span>
          <Badge>{parts.length}개</Badge>
        </div>
        <ItemList
          loading={partsLoading}
          empty="등록된 부품이 없습니다."
          items={parts}
          renderItem={(part, i, arr) => (
            <li key={part.id} style={listItem(i, arr.length)}>
              {editingPart === part.id ? (
                <div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <input
                      autoFocus
                      value={editPartName}
                      onChange={(e) => { setEditPartName(e.target.value); setEditPartError(""); }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRenamePart(part.id);
                        if (e.key === "Escape") setEditingPart(null);
                      }}
                      style={{ ...inputStyle(!!editPartError), flex: "2 1 140px" }}
                    />
                    <input
                      value={editPartUnit}
                      onChange={(e) => setEditPartUnit(e.target.value)}
                      placeholder="단위"
                      style={{ ...inputStyle(false), flex: "0 0 60px", textAlign: "center" }}
                    />
                    <button onClick={() => handleRenamePart(part.id)} style={iconBtn("#dcfce7", "#16a34a")} title="저장">
                      <Check size={15} />
                    </button>
                    <button onClick={() => { setEditingPart(null); setEditPartError(""); }} style={iconBtn("#f1f5f9", "#64748b")} title="취소">
                      <X size={15} />
                    </button>
                  </div>
                  {editPartError && <ErrMsg>{editPartError}</ErrMsg>}
                </div>
              ) : deletePartConfirm === part.id ? (
                <DeleteConfirm
                  label={part.name}
                  error={deletePartError}
                  onConfirm={() => handleDeletePart(part.id)}
                  onCancel={() => { setDeletePartConfirm(null); setDeletePartError(""); }}
                />
              ) : (
                <ViewRow
                  label={part.name}
                  badge={part.unit}
                  onEdit={() => {
                    setEditingPart(part.id);
                    setEditPartName(part.name);
                    setEditPartUnit(part.unit);
                    setEditPartError("");
                    setDeletePartConfirm(null);
                  }}
                  onDelete={() => {
                    setDeletePartConfirm(part.id);
                    setDeletePartError("");
                    setEditingPart(null);
                  }}
                />
              )}
            </li>
          )}
        />
      </div>
    </div>
  );
}

// ─────────────────── 공용 UI 컴포넌트 ───────────────────

function SectionHeader({ icon, bg, title }: { icon: React.ReactNode; bg: string; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
      <div style={{ width: "28px", height: "28px", borderRadius: "7px", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icon}
      </div>
      <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--foreground)" }}>{title}</span>
    </div>
  );
}

function ItemList<T>({
  loading, empty, items, renderItem,
}: {
  loading: boolean;
  empty: string;
  items: T[];
  renderItem: (item: T, index: number, arr: T[]) => React.ReactNode;
}) {
  if (loading) return <div style={{ padding: "28px", textAlign: "center", color: "var(--muted)", fontSize: "14px" }}>로딩 중...</div>;
  if (items.length === 0) return <div style={{ padding: "28px", textAlign: "center", color: "var(--muted)", fontSize: "14px" }}>{empty}</div>;
  return <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>{items.map((item, i) => renderItem(item, i, items))}</ul>;
}

function ViewRow({ label, badge, onEdit, onDelete }: { label: string; badge: string; onEdit: () => void; onDelete: () => void }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <span style={{ fontWeight: 600, fontSize: "14px" }}>{label}</span>
        <span style={{ marginLeft: "10px", fontSize: "11px", color: "var(--muted)", background: "#f1f5f9", padding: "2px 7px", borderRadius: "4px" }}>
          {badge}
        </span>
      </div>
      <div style={{ display: "flex", gap: "6px" }}>
        <button onClick={onEdit} style={iconBtn("#eef2ff", "#5b6ee8")} title="수정"><Pencil size={14} /></button>
        <button onClick={onDelete} style={iconBtn("#fff0f0", "#e05c5c")} title="삭제"><Trash2 size={14} /></button>
      </div>
    </div>
  );
}

function EditRow({ value, onChange, onSave, onCancel, error }: {
  value: string; onChange: (v: string) => void;
  onSave: () => void; onCancel: () => void; error: string;
}) {
  return (
    <div>
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <input
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onSave(); if (e.key === "Escape") onCancel(); }}
          style={{ ...inputStyle(!!error), flex: 1 }}
        />
        <button onClick={onSave} style={iconBtn("#dcfce7", "#16a34a")} title="저장"><Check size={15} /></button>
        <button onClick={onCancel} style={iconBtn("#f1f5f9", "#64748b")} title="취소"><X size={15} /></button>
      </div>
      {error && <ErrMsg>{error}</ErrMsg>}
    </div>
  );
}

function DeleteConfirm({ label, error, onConfirm, onCancel }: {
  label: string; error: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div>
      <p style={{ fontSize: "13px", color: "var(--foreground)", margin: "0 0 10px" }}>
        <strong>{label}</strong>을(를) 삭제하시겠습니까?{" "}
        <span style={{ color: "var(--muted)" }}>(거래 내역이 있으면 삭제 불가)</span>
      </p>
      {error && <ErrMsg style={{ marginBottom: "8px" }}>{error}</ErrMsg>}
      <div style={{ display: "flex", gap: "8px" }}>
        <button onClick={onConfirm} style={{ padding: "6px 14px", borderRadius: "6px", border: "none", background: "#e05c5c", color: "white", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
          삭제 확인
        </button>
        <button onClick={onCancel} style={{ padding: "6px 14px", borderRadius: "6px", border: "1px solid var(--border)", background: "white", fontSize: "13px", cursor: "pointer" }}>
          취소
        </button>
      </div>
    </div>
  );
}

function SubmitBtn({ children, disabled, color }: { children: React.ReactNode; disabled: boolean; loading?: boolean; color: string }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px", borderRadius: "8px", border: "none", background: disabled ? "#94a3b8" : color, color: "white", fontSize: "14px", fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}
    >
      {children}
    </button>
  );
}

function ErrMsg({ children, style: s }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <p style={{ color: "#c53030", fontSize: "13px", marginTop: "8px", marginBottom: 0, ...s }}>{children}</p>;
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span style={{ fontSize: "12px", color: "var(--muted)", background: "#f1f5f9", padding: "2px 8px", borderRadius: "4px" }}>{children}</span>;
}

// ─────────────────── 스타일 상수 ───────────────────

const card: React.CSSProperties = {
  background: "var(--card-bg)",
  border: "1px solid var(--border)",
  borderRadius: "12px",
  padding: "20px",
  marginBottom: "12px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
};

const cardTitle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 600,
  margin: "0 0 14px",
  color: "var(--foreground)",
};

const listHeader: React.CSSProperties = {
  padding: "14px 20px",
  borderBottom: "1px solid var(--border)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const hintStyle: React.CSSProperties = {
  color: "var(--muted)",
  fontSize: "12px",
  marginTop: "8px",
  marginBottom: 0,
};

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    flex: 1,
    padding: "8px 11px",
    borderRadius: "8px",
    border: `1px solid ${hasError ? "#fca5a5" : "var(--border)"}`,
    fontSize: "14px",
    outline: "none",
    background: "white",
    color: "var(--foreground)",
  };
}

function iconBox(bg: string): React.CSSProperties {
  return { width: "44px", height: "44px", borderRadius: "10px", background: bg, display: "flex", alignItems: "center", justifyContent: "center" };
}

function iconBtn(bg: string, color: string): React.CSSProperties {
  return { width: "30px", height: "30px", borderRadius: "6px", border: "none", background: bg, color, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 };
}

function listItem(i: number, total: number): React.CSSProperties {
  return { borderBottom: i < total - 1 ? "1px solid var(--border)" : "none", padding: "13px 20px", background: "white" };
}
