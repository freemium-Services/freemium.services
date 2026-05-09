import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Freemium Services | Operational Intelligence Platform",
  description: "The world's largest verified directory of open-source tools and operational workflows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#030712] text-white">
        {children}
      </body>
    </html>
  );
}
