"use client";

import { useState, useEffect, useCallback } from "react";

interface Category { id: number; name: string }
interface Subcategory { id: number; name: string; categoryId: number }
interface Item { id: number; name: string }
interface AddonOption { id: number; type: string; value: string; order: number }

const inputStyle: React.CSSProperties = {
  padding: "9px 12px", border: "1px solid var(--border)", borderRadius: "8px",
  fontSize: "13px", outline: "none", flex: 1,
};
const btnPrimary: React.CSSProperties = {
  padding: "9px 16px", background: "var(--primary)", color: "white",
  border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
};
const btnDanger: React.CSSProperties = {
  padding: "5px 10px", background: "#fff5f5", border: "1px solid #fca5a5",
  color: "#dc2626", borderRadius: "6px", fontSize: "12px", cursor: "pointer",
};
const sectionTitle: React.CSSProperties = {
  fontSize: "15px", fontWeight: 700, color: "var(--foreground)", marginBottom: "14px",
};
const card: React.CSSProperties = {
  background: "white", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px", marginBottom: "20px",
};

export default function SettingsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<number>(0);
  const [selectedSubId, setSelectedSubId] = useState<number>(0);
  const [newItemName, setNewItemName] = useState("");
  const [addonOptions, setAddonOptions] = useState<AddonOption[]>([]);
  const [specOptions, setSpecOptions] = useState<AddonOption[]>([]);
  const [newAddon, setNewAddon] = useState("");
  const [newSpec, setNewSpec] = useState("");
  const [itemMsg, setItemMsg] = useState("");

  const loadCategories = useCallback(async () => {
    const cats: Category[] = await fetch("/api/categories").then(r => r.json());
    setCategories(cats);
    if (cats.length > 0 && !selectedCatId) setSelectedCatId(cats[0].id);
  }, [selectedCatId]);

  const loadSubcategories = useCallback(async () => {
    if (!selectedCatId) return;
    const subs: Subcategory[] = await fetch(`/api/subcategories?categoryId=${selectedCatId}`).then(r => r.json());
    setSubcategories(subs);
    if (subs.length > 0 && !selectedSubId) setSelectedSubId(subs[0].id);
  }, [selectedCatId, selectedSubId]);

  const loadItems = useCallback(async () => {
    if (!selectedSubId) { setItems([]); return; }
    const its: Item[] = await fetch(`/api/items?subcategoryId=${selectedSubId}`).then(r => r.json());
    setItems(its);
  }, [selectedSubId]);

  const loadAddonOptions = useCallback(async () => {
    const [addons, specs] = await Promise.all([
      fetch("/api/addon-options?type=ADDON").then(r => r.json()),
      fetch("/api/addon-options?type=SPEC").then(r => r.json()),
    ]);
    setAddonOptions(addons);
    setSpecOptions(specs);
  }, []);

  useEffect(() => { loadCategories(); }, []);
  useEffect(() => { loadSubcategories(); }, [selectedCatId]);
  useEffect(() => { loadItems(); }, [selectedSubId]);
  useEffect(() => { loadAddonOptions(); }, []);

  const handleAddItem = async () => {
    if (!newItemName.trim() || !selectedSubId) { setItemMsg("소분류와 모델명을 입력해주세요."); return; }
    const res = await fetch("/api/items", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: newItemName, subcategoryId: selectedSubId }),
    });
    const data = await res.json();
    if (!res.ok) { setItemMsg(data.error ?? "오류 발생"); return; }
    setNewItemName(""); setItemMsg("모델 추가 완료!"); loadItems();
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm("해당 모델을 삭제하시겠습니까?")) return;
    const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { alert(data.error); return; }
    loadItems();
  };

  const handleAddAddon = async (type: string, value: string) => {
    if (!value.trim()) return;
    await fetch("/api/addon-options", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ type, value }),
    });
    type === "ADDON" ? setNewAddon("") : setNewSpec("");
    loadAddonOptions();
  };

  const handleDeleteAddon = async (id: number) => {
    await fetch(`/api/addon-options/${id}`, { method: "DELETE" });
    loadAddonOptions();
  };


  const isShelterCat = categories.find(c => c.id === selectedCatId)?.name === "쉼터";

  return (
    <div>
      <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--foreground)", marginBottom: "24px" }}>설정</h1>

      {/* 모델 관리 */}
      <div style={card}>
        <div style={sectionTitle}>모델 관리</div>
        <div style={{ display: "flex", gap: "10px", marginBottom: "14px", flexWrap: "wrap" }}>
          <select value={selectedCatId} onChange={e => { setSelectedCatId(Number(e.target.value)); setSelectedSubId(0); }}
            style={{ ...inputStyle, flex: "none", minWidth: "120px" }}>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {!isShelterCat && (
            <select value={selectedSubId} onChange={e => setSelectedSubId(Number(e.target.value))}
              style={{ ...inputStyle, flex: "none", minWidth: "120px" }}>
              <option value={0}>소분류 선택</option>
              {subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
        </div>
        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
          <input style={inputStyle} value={newItemName} onChange={e => setNewItemName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAddItem()}
            placeholder="새 모델명 입력" />
          <button style={btnPrimary} onClick={handleAddItem}>추가</button>
        </div>
        {itemMsg && <div style={{ fontSize: "13px", color: "var(--primary)", marginBottom: "12px" }}>{itemMsg}</div>}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {items.map(item => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "6px", background: "#f8fafc", border: "1px solid var(--border)", borderRadius: "8px", padding: "6px 10px" }}>
              <span style={{ fontSize: "13px" }}>{item.name}</span>
              <button onClick={() => handleDeleteItem(item.id)} style={{ ...btnDanger, padding: "2px 6px", fontSize: "11px" }}>삭제</button>
            </div>
          ))}
          {items.length === 0 && <div style={{ fontSize: "13px", color: "var(--muted)" }}>모델이 없습니다.</div>}
        </div>
      </div>

      {/* 추가모듈 옵션 */}
      <div style={card}>
        <div style={sectionTitle}>추가모듈 선택 리스트 (GATE 전용)</div>
        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
          <input style={inputStyle} value={newAddon} onChange={e => setNewAddon(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAddAddon("ADDON", newAddon)}
            placeholder="새 추가모듈 값 입력" />
          <button style={btnPrimary} onClick={() => handleAddAddon("ADDON", newAddon)}>추가</button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {addonOptions.map(o => (
            <div key={o.id} style={{ display: "flex", alignItems: "center", gap: "6px", background: "#f8fafc", border: "1px solid var(--border)", borderRadius: "8px", padding: "6px 10px" }}>
              <span style={{ fontSize: "13px" }}>{o.value}</span>
              <button onClick={() => handleDeleteAddon(o.id)} style={{ ...btnDanger, padding: "2px 6px", fontSize: "11px" }}>삭제</button>
            </div>
          ))}
        </div>
      </div>

      {/* 세부사양 옵션 */}
      <div style={card}>
        <div style={sectionTitle}>세부사양 선택 리스트 (GATE 전용)</div>
        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
          <input style={inputStyle} value={newSpec} onChange={e => setNewSpec(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAddAddon("SPEC", newSpec)}
            placeholder="새 세부사양 값 입력" />
          <button style={btnPrimary} onClick={() => handleAddAddon("SPEC", newSpec)}>추가</button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {specOptions.map(o => (
            <div key={o.id} style={{ display: "flex", alignItems: "center", gap: "6px", background: "#f8fafc", border: "1px solid var(--border)", borderRadius: "8px", padding: "6px 10px" }}>
              <span style={{ fontSize: "13px" }}>{o.value}</span>
              <button onClick={() => handleDeleteAddon(o.id)} style={{ ...btnDanger, padding: "2px 6px", fontSize: "11px" }}>삭제</button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
