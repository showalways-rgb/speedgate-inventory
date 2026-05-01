"use client";

import { useState, useEffect, useCallback } from "react";
import StockChart from "@/components/StockChart";

interface StockItem {
  itemId: number; itemName: string; subcategoryName: string;
  categoryName: string; categoryId: number;
  totalIn: number; totalOut: number; currentStock: number;
  virtualOut?: boolean;
  outOrderCount?: number;
}
interface Category { id: number; name: string }

const card: React.CSSProperties = {
  background: "white", border: "1px solid var(--border)",
  borderRadius: "12px", padding: "24px", marginBottom: "20px",
};

export default function DashboardPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [stockData, setStockData] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then((cats: Category[]) => {
      setCategories(cats);
      if (cats.length > 0) setSelectedCatId(cats[0].id);
    });
  }, []);

  const loadStock = useCallback(async (catId: number | null) => {
    setLoading(true);
    const url = catId ? `/api/stock?categoryId=${catId}` : "/api/stock";
    const data: StockItem[] = await fetch(url).then(r => r.json());
    setStockData(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (selectedCatId !== null) loadStock(selectedCatId);
  }, [selectedCatId, loadStock]);

  const selectedCat = categories.find(c => c.id === selectedCatId);

  return (
    <div>
      <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--foreground)", marginBottom: "24px" }}>
        재고 현황
      </h1>

      {/* 차트 */}
      <div style={card}>
        {/* 대분류 탭 */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCatId(cat.id)}
              style={{
                padding: "8px 18px", borderRadius: "20px", border: "1px solid",
                borderColor: selectedCatId === cat.id ? "var(--primary)" : "var(--border)",
                background: selectedCatId === cat.id ? "var(--primary)" : "white",
                color: selectedCatId === cat.id ? "white" : "var(--foreground)",
                fontSize: "14px", fontWeight: selectedCatId === cat.id ? 600 : 400,
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--foreground)", marginBottom: "16px" }}>
          {selectedCat?.name ?? ""} 입출고 현황
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)" }}>불러오는 중...</div>
        ) : (
          <StockChart data={stockData} />
        )}
      </div>

    </div>
  );
}
