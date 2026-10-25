import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VIDYA Setu — AICTE APAAR Student Intelligence & Verification Platform",
  description:
    "One Academic Identity. Trusted Records. Transparent Governance. National academic registry, live intake guard, cross-institution duplicate detector, digital credential verification, and PDF forensics.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased scroll-smooth">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col bg-[#F8FAFC] text-[#0F172A] selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
