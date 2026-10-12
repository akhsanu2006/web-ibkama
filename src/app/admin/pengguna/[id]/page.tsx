import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/page-header";
import { UserForm } from "@/components/admin/user-form";
import { updateUser } from "@/lib/actions/users";
import { requirePagePermission } from "@/lib/auth/dal";
import { adminPeriod, getUserById } from "@/lib/queries/admin";

export const metadata: Metadata = { title: "Ubah Pengguna" };

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePagePermission("user", "update");
  const { id } = await params;
  const user = await getUserById(id);
  if (!user) notFound();
  const active = (await adminPeriod()).all.find((p) => p.status === "active") ?? null;

  return (
    <div>
      <AdminPageHeader title={`Ubah Pengguna: ${user.name}`} />
      <UserForm action={updateUser.bind(null, id)} defaults={user} mode="edit" submitLabel="Simpan Perubahan" cancelHref="/admin/pengguna" activePeriodName={active?.name ?? null} />
    </div>
  );
}
