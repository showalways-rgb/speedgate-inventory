"use client";

import { useState } from "react";

export default function AiSearch() {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setAnswer("");
    try {
      const res = await fetch("/api/ai-search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      setAnswer(data.answer ?? data.error ?? "오류가 발생했습니다.");
    } catch {
      setAnswer("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px" }}>
      <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "12px" }}>
        Claude AI 검색
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSearch()}
          placeholder="예: 2025년 BT-400 출고 대수를 알려줘!"
          style={{
            flex: 1, padding: "10px 14px", border: "1px solid var(--border)",
            borderRadius: "8px", fontSize: "14px", outline: "none",
          }}
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          style={{
            padding: "10px 20px", background: "var(--primary)", color: "white",
            border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
            whiteSpace: "nowrap",
          }}
        >
          {loading ? "검색 중..." : "검색"}
        </button>
      </div>
      {answer && (
        <div style={{
          marginTop: "12px", padding: "14px 16px", background: "#f0f4ff",
          borderRadius: "8px", fontSize: "14px", color: "var(--foreground)",
          lineHeight: 1.6, whiteSpace: "pre-wrap",
        }}>
          <span style={{ fontWeight: 600, color: "var(--primary)" }}>답변: </span>{answer}
        </div>
      )}
    </div>
  );
}
