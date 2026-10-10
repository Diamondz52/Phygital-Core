import { type Metadata } from "next";
import "@/app/styles/globals.css";
import "@/app/styles/enhancements.css";
import "@/app/styles/iteration-v12.css";
import "@/app/styles/feedback.css";
import "@/app/styles/interactions.css";
import "@/app/styles/modals.css";
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
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
