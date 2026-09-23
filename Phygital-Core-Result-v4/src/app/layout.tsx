import type { Metadata } from "next";
import "./globals.css";
import "./enhancements.css";
import { AppProviders } from "@/app/providers";

export const metadata: Metadata = {
  title: "Phygital Core — турниры нового поколения",
  description: "Платформа фиджитал-турниров: команды, соревнования и цифровой спорт.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body><AppProviders>{children}</AppProviders></body>
    </html>
  );
}
