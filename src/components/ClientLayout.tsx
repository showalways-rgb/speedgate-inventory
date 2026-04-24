"use client";

import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // 모바일에서 사이드바 열릴 때 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = isMobile && sidebarOpen ? "hidden" : "";
  }, [isMobile, sidebarOpen]);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* 모바일 오버레이 */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)",
            zIndex: 40, backdropFilter: "blur(2px)",
          }}
        />
      )}

      {/* 사이드바 */}
      <Sidebar
        isMobile={isMobile}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* 메인 콘텐츠 */}
      <main
        style={{
          marginLeft: isMobile ? 0 : "220px",
          flex: 1,
          minHeight: "100vh",
          maxWidth: "100%",
          overflowX: "hidden",
        }}
      >
        {/* 모바일 상단 헤더 */}
        {isMobile && (
          <div style={{
            position: "sticky", top: 0, zIndex: 30,
            display: "flex", alignItems: "center", gap: "12px",
            padding: "14px 16px",
            background: "white", borderBottom: "1px solid var(--border)",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                width: "36px", height: "36px", borderRadius: "8px",
                border: "1px solid var(--border)", background: "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "var(--foreground)",
              }}
            >
              <Menu size={18} />
            </button>
            <span style={{ fontWeight: 700, fontSize: "16px", color: "var(--foreground)" }}>
              스피드게이트 재고관리
            </span>
          </div>
        )}

        <div style={{ padding: isMobile ? "20px 16px" : "32px" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
