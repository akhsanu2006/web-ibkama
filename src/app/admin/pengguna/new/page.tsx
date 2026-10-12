import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/page-header";
import { UserForm } from "@/components/admin/user-form";
import { createUser } from "@/lib/actions/users";
import { requirePagePermission } from "@/lib/auth/dal";
import { adminPeriod } from "@/lib/queries/admin";

export const metadata: Metadata = { title: "Tambah Pengguna" };

export default async function NewUserPage() {
  await requirePagePermission("user", "create");
  const active = (await adminPeriod()).all.find((p) => p.status === "active") ?? null;
  return (
    <div>
      <AdminPageHeader title="Tambah Pengguna" description="Buat akun Admin atau Super Admin baru. Kredensial tidak pernah tersimpan di kode sumber." />
      <UserForm action={createUser} mode="create" submitLabel="Buat Akun" cancelHref="/admin/pengguna" activePeriodName={active?.name ?? null} />
    </div>
  );
}
