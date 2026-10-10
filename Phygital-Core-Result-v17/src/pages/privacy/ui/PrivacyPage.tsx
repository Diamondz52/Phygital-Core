"use client";

import { PageHeader } from "@/widgets/page-header";
import { PrivacyPageContent } from "@/widgets/privacy";
export function PrivacyPage() {
  return (
    <>
      <PageHeader
        eyebrow="ИНФОРМАЦИЯ"
        title="Политика конфиденциальности"
        description="Как мы обрабатываем и защищаем персональные данные."
      />
      <PrivacyPageContent />
    </>
  );
}
