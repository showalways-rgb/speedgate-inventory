"use client";

import { useState, useEffect } from "react";

interface Category { id: number; name: string }
interface Subcategory { id: number; name: string; categoryId: number }
interface Item { id: number; name: string; unit: string }

interface Props {
  onSelect: (info: { categoryId: number; categoryName: string; subcategoryId: number; itemId: number; itemName: string }) => void;
  initialCategoryId?: number;
  initialSubcategoryId?: number;
  initialItemId?: number;
}

const sel: React.CSSProperties = {
  width: "100%", padding: "10px 12px", border: "1px solid var(--border)",
  borderRadius: "8px", fontSize: "14px", background: "white",
  color: "var(--foreground)", cursor: "pointer", outline: "none",
};

export default function CategorySelector({ onSelect, initialCategoryId, initialSubcategoryId, initialItemId }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [categoryId, setCategoryId] = useState<number>(initialCategoryId ?? 0);
  const [subcategoryId, setSubcategoryId] = useState<number>(initialSubcategoryId ?? 0);
  const [itemId, setItemId] = useState<number>(initialItemId ?? 0);

  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(setCategories);
  }, []);

  useEffect(() => {
    if (!categoryId) { setSubcategories([]); setSubcategoryId(0); setItems([]); setItemId(0); return; }
    fetch(`/api/subcategories?categoryId=${categoryId}`).then(r => r.json()).then((subs: Subcategory[]) => {
      setSubcategories(subs);
      // 쉼터는 소분류 없음 (name="") → 자동 선택
      if (subs.length === 1 && subs[0].name === "") {
        setSubcategoryId(subs[0].id);
      } else {
        setSubcategoryId(0); setItems([]); setItemId(0);
      }
    });
  }, [categoryId]);

  useEffect(() => {
    if (!subcategoryId) { setItems([]); setItemId(0); return; }
    fetch(`/api/items?subcategoryId=${subcategoryId}`).then(r => r.json()).then((its: Item[]) => {
      setItems(its);
      setItemId(0);
    });
  }, [subcategoryId]);

  useEffect(() => {
    if (!categoryId || !subcategoryId || !itemId) return;
    const cat = categories.find(c => c.id === categoryId);
    const item = items.find(i => i.id === itemId);
    if (cat && item) onSelect({ categoryId, categoryName: cat.name, subcategoryId, itemId, itemName: item.name });
  }, [itemId]);

  const isShelter = categories.find(c => c.id === categoryId)?.name === "쉼터";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div>
        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--muted)", marginBottom: "6px" }}>대분류</label>
        <select style={sel} value={categoryId} onChange={e => setCategoryId(Number(e.target.value))}>
          <option value={0}>선택하세요</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {categoryId > 0 && !isShelter && (
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--muted)", marginBottom: "6px" }}>소분류</label>
          <select style={sel} value={subcategoryId} onChange={e => setSubcategoryId(Number(e.target.value))}>
            <option value={0}>선택하세요</option>
            {subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      )}

      {(subcategoryId > 0) && (
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--muted)", marginBottom: "6px" }}>모델</label>
          <select style={sel} value={itemId} onChange={e => setItemId(Number(e.target.value))}>
            <option value={0}>선택하세요</option>
            {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}
