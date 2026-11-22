import type { Metadata } from "next";
import "@fontsource/noto-sans-jp/400.css";
import "@fontsource/noto-sans-jp/700.css";
import "@fontsource/montserrat/800.css";
import "./globals.css";

import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "FARMATE",
  description: "農家と大学生をつなぐ短期バイトサービス FARMATE のデモ",
  icons: {
    icon: "/brand/favicon-64.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body className="min-h-screen font-body antialiased">
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
