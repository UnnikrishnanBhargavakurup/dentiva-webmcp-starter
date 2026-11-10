import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dentiva — A little care. A brighter smile.",
  description:
    "A fictional dental clinic with local appointment booking. A Skillbum learning project.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
