"use client";

import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/widgets/page-header";
import { RulesPageContent } from "@/widgets/rules";
export function RulesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Кодекс участника"
        title="Правила"
        description="Всё важное перед выходом на арену."
        visual={<ShieldCheck />}
        variant="rules"
      />
      <RulesPageContent />
    </>
  );
}
