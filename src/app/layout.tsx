import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "xxGame",
  description: "xxGame front-end app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
