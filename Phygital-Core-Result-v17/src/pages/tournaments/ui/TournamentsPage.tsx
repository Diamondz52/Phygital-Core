"use client";

import { Trophy } from "lucide-react";
import { PageHeader } from "@/widgets/page-header";
import { TournamentsPageContent } from "@/widgets/tournaments";
export function TournamentsPage() {
  return (
    <>
      <PageHeader
        eyebrow="СОРЕВНОВАНИЯ НОВОГО ПОКОЛЕНИЯ"
        title="Турниры"
        description="Все доступные турниры на одной странице."
        visual={<Trophy />}
      />
      <TournamentsPageContent />
    </>
  );
}
