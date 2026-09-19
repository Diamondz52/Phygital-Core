import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/components/app/AppProvider";

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
      <body><AppProvider>{children}</AppProvider></body>
    </html>
  );
}
