import { AdminGate } from "@/features/auth";
import { SiteHeader } from "@/widgets/header";
import { AdminLayout } from "@/widgets/admin-sidebar";
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <AdminGate>
        <AdminLayout>{children}</AdminLayout>
      </AdminGate>
    </>
  );
}
