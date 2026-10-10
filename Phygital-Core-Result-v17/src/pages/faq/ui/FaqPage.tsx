"use client";

import { MessageSquareText } from "lucide-react";
import { PageHeader } from "@/widgets/page-header";
import { FaqPageContent } from "@/widgets/faq";
export function FaqPage() {
  return (
    <>
      <PageHeader
        eyebrow="ЦЕНТР ПОМОЩИ"
        title="FAQ"
        description="Ответы на основные вопросы."
        visual={<MessageSquareText />}
        variant="faq"
      />
      <FaqPageContent />
    </>
  );
}
