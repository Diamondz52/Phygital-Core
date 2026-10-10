"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { SiteHeader } from "@/widgets/header";
import { SiteFooter } from "@/widgets/footer";
export function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);
  return (
    <>
      <SiteHeader />
      <main className={pathname === "/" ? undefined : "public-main-offset"}>{children}</main>
      <SiteFooter />
    </>
  );
}
