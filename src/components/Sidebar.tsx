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
  X,
} from "lucide-react";

const navItems = [
  { href: "/",          label: "재고 현황",   icon: LayoutDashboard },
  { href: "/stock-in",  label: "입고",        icon: PackagePlus },
  { href: "/stock-out", label: "출고",        icon: PackageMinus },
  { href: "/status",    label: "입출고 현황", icon: BarChart2 },
  { href: "/inventory", label: "현재고",      icon: Package },
  { href: "/settings",  label: "설정",        icon: Settings },
];

interface SidebarProps {
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isMobile = false, isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  const sidebarStyle: React.CSSProperties = isMobile
    ? {
        position: "fixed",
        top: 0, left: 0, bottom: 0,
        width: "260px",
        background: "var(--sidebar-bg)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        zIndex: 50,
        transform: isOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.25s ease",
        boxShadow: isOpen ? "4px 0 20px rgba(0,0,0,0.12)" : "none",
      }
    : {
        width: "220px",
        minHeight: "100vh",
        background: "var(--sidebar-bg)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0, left: 0, bottom: 0,
        zIndex: 50,
      };

  return (
    <aside style={sidebarStyle}>
      <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "36px", height: "36px", background: "#eef2ff",
              borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Package size={20} color="#5b6ee8" />
            </div>
            <span style={{ color: "#2d3748", fontWeight: 700, fontSize: "16px", lineHeight: 1.3 }}>
              재고관리 시스템
            </span>
          </div>
          {isMobile && (
            <button onClick={onClose} style={{
              width: "30px", height: "30px", borderRadius: "6px",
              border: "none", background: "#f1f5f9", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--muted)",
            }}>
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <nav style={{ padding: "12px 10px", flex: 1 }}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={isMobile ? onClose : undefined}
              style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "11px 12px", borderRadius: "8px", marginBottom: "2px",
                color: active ? "#4338ca" : "var(--sidebar-text)",
                background: active ? "#eef2ff" : "transparent",
                textDecoration: "none",
                fontSize: "14px", fontWeight: active ? 600 : 400,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.background = "var(--sidebar-hover)";
              }}
              onMouseLeave={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)", color: "#a0aec0", fontSize: "11px" }}>
        © 2025 Cian
      </div>
    </aside>
  );
}
