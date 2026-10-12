import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/sidebar";
import { Flash } from "@/components/admin/flash";
import { requireUser } from "@/lib/auth/dal";
import { can, RESOURCES } from "@/lib/permissions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const allowed = RESOURCES.filter((r) => can(user.role, r, "read", user.permissions));

  return (
    <AdminShell user={{ name: user.name, role: user.role, adminPosition: user.adminPosition }} allowed={allowed}>
      {children}
      <Suspense fallback={null}>
        <Flash />
      </Suspense>
    </AdminShell>
  );
}
