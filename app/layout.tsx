import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./typography.css";

export const metadata: Metadata = {
  title: "FuongThenn",
  description: "Một hộp nhạc sinh nhật tương tác với khu vườn hoa sứ, sân khấu xanh và món quà 3D dành riêng cho FuongThenn.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#eff8ff" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><head><link rel="preload" href="/fonts/lora-variable.ttf" as="font" type="font/ttf" crossOrigin="anonymous" /></head><body>{children}</body></html>;
}
