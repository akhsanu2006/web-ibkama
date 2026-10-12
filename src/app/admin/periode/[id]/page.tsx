import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/page-header";
import { PeriodForm } from "@/components/admin/period-form";
import { db, schema } from "@/db";
import { updatePeriod } from "@/lib/actions/period";
import { requirePagePermission } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Ubah Periode" };

export default async function EditPeriodPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePagePermission("period", "update");
  const { id } = await params;
  const [period] = await db.select().from(schema.periods).where(eq(schema.periods.id, id));
  if (!period) notFound();

  return (
    <div>
      <AdminPageHeader title={`Ubah Periode ${period.name}`} description="Mengubah nama/keterangan tidak memengaruhi data yang sudah terhubung ke periode ini." />
      <PeriodForm action={updatePeriod.bind(null, id)} defaults={period} submitLabel="Simpan Perubahan" cancelHref="/admin/periode" />
    </div>
  );
}
