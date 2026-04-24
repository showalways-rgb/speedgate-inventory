"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PackagePlus,
  PackageMinus,
  Package,
  BarChart2,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/",        label: "재고 현황",   icon: LayoutDashboard },
  { href: "/stock-in",  label: "입고",      icon: PackagePlus },
  { href: "/stock-out", label: "출고",      icon: PackageMinus },
  { href: "/status",    label: "입출고 현황", icon: BarChart2 },
  { href: "/inventory", label: "현재고",    icon: Package },
  { href: "/settings",  label: "설정",      icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: "220px",
        minHeight: "100vh",
        background: "var(--sidebar-bg)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          padding: "24px 20px 20px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              background: "#eef2ff",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Package size={18} color="#5b6ee8" />
          </div>
          <span style={{ color: "#2d3748", fontWeight: 700, fontSize: "15px", lineHeight: "1.2" }}>
            스피드게이트
          </span>
        </div>
        <p style={{ color: "var(--muted)", fontSize: "12px", margin: 0, paddingLeft: "42px" }}>
          재고관리 시스템
        </p>
      </div>

      <nav style={{ padding: "12px 10px", flex: 1 }}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 12px",
                borderRadius: "8px",
                marginBottom: "2px",
                color: active ? "#4338ca" : "var(--sidebar-text)",
                background: active ? "#eef2ff" : "transparent",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: active ? 600 : 400,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!active)
                  (e.currentTarget as HTMLElement).style.background = "var(--sidebar-hover)";
              }}
              onMouseLeave={(e) => {
                if (!active)
                  (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div
        style={{
          padding: "16px 20px",
          borderTop: "1px solid var(--border)",
          color: "#a0aec0",
          fontSize: "11px",
        }}
      >
        © 2025 Cian
      </div>
    </aside>
  );
}
