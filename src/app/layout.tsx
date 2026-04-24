import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "스피드게이트 재고관리",
  description: "스피드게이트 부품 재고관리 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <div style={{ display: "flex" }}>
          <Sidebar />
          <main
            style={{
              marginLeft: "220px",
              flex: 1,
              minHeight: "100vh",
              padding: "32px",
              maxWidth: "100%",
              overflowX: "hidden",
            }}
          >
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
