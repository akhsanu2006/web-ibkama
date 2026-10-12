import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/page-header";
import { PeriodForm } from "@/components/admin/period-form";
import { createPeriod } from "@/lib/actions/period";
import { requirePagePermission } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Buat Periode" };

export default async function NewPeriodPage() {
  await requirePagePermission("period", "create");
  return (
    <div>
      <AdminPageHeader title="Buat Periode Baru" description="Periode baru menjadi wadah baru untuk kepengurusan, program, arsip, dan dokumentasi. Data periode sebelumnya tetap tersimpan." />
      <PeriodForm action={createPeriod} submitLabel="Buat Periode" cancelHref="/admin/periode" />
    </div>
  );
}
