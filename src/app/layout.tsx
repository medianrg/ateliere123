import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ateliere123",
  description: "Prezență, abonamente și comunicare cu părinții — Ateliere123",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ro" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900">
        {children}
      </body>
    </html>
  );
}
