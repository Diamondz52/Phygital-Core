import type { Metadata } from "next";
import "./globals.css";
import "./enhancements.css";
import "./iteration-v12.css";
import "./feedback.css";
import "./interactions.css";
import "./modals.css";
import { AppProviders } from "@/app/providers";

export const metadata: Metadata = {
  title: "Phygital Core — турниры нового поколения",
  description: "Платформа фиджитал-турниров: команды, соревнования и цифровой спорт.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
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
