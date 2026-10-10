"use client";

import { Phone } from "lucide-react";
import { PageHeader } from "@/widgets/page-header";
import { ContactsPageContent } from "@/widgets/contacts";
export function ContactsPage() {
  return (
    <>
      <PageHeader
        eyebrow="ОБРАТНАЯ СВЯЗЬ"
        title="Контакты"
        description="Свяжитесь с организаторами удобным способом или оставьте сообщение."
        visual={<Phone />}
        variant="contacts"
      />
      <ContactsPageContent />
    </>
  );
}
