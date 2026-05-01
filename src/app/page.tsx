"use client";

import { useState, useEffect, useMemo } from "react";
import StockChart from "@/components/StockChart";

interface StockItem {
  itemId: number; itemName: string; subcategoryName: string;
  categoryName: string; categoryId: number;
  totalIn: number; totalOut: number; currentStock: number;
  virtualOut?: boolean;
  outOrderCount?: number;
}
interface Category { id: number; name: string }

const ADDON_ORDER = [
  "이동식플레이트(BT-400M)",
  "이동식플레이트(BF-400M)",
  "브라켓(소)_Rots-02",
  "브라켓(대)_KJZ-03",
  "케이블덕트(BT-400용_710mm)",
  "케이블덕트(BT-500용_540mm)",
  "케이블덕트(BF-400용_800mm)",
];

function sortAddonStockByOrder(items: StockItem[]): StockItem[] {
  const indexByName = new Map<string, number>(
    ADDON_ORDER.map((name, i) => [name, i]),
  );
  const tail = ADDON_ORDER.length;
  return [...items].sort((a, b) => {
    const ai = indexByName.has(a.itemName) ? indexByName.get(a.itemName)! : tail;
    const bi = indexByName.has(b.itemName) ? indexByName.get(b.itemName)! : tail;
    if (ai !== bi) return ai - bi;
    return a.itemName.localeCompare(b.itemName, "ko");
  });
}

const card: React.CSSProperties = {
  background: "white", border: "1px solid var(--border)",
  borderRadius: "12px", padding: "24px", marginBottom: "20px",
};

export default function DashboardPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [allStockData, setAllStockData] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [catsRes, stockRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/stock"),
        ]);
        const cats: Category[] = await catsRes.json();
        const stock: StockItem[] = await stockRes.json();
        if (cancelled) return;
        setCategories(cats);
        if (cats.length > 0) setSelectedCatId(cats[0].id);
        setAllStockData(stock);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const stockData = useMemo(() => {
    if (selectedCatId === null) return [];
    return allStockData.filter((item) => item.categoryId === selectedCatId);
  }, [allStockData, selectedCatId]);

  const selectedCat = categories.find((c) => c.id === selectedCatId);

  const chartData = useMemo(() => {
    if (selectedCat?.name === "추가모듈") return sortAddonStockByOrder(stockData);
    return stockData;
  }, [stockData, selectedCat?.name]);

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
          <StockChart data={chartData} />
        )}
      </div>

    </div>
  );
}
