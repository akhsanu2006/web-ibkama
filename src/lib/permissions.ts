/**
 * Matriks izin: role → resource → action.
 * Semua Server Action wajib memanggil requirePermission() (lib/auth/dal.ts).
 * Kolom users.permissions dapat menambah izin granular per pengguna kelak.
 */
export const RESOURCES = [
  "period", "division", "position", "member", "program", "event", "attendance",
  "archive", "document", "gallery", "leadership", "news", "highlight", "site_media", "user", "organization", "integration",
] as const;
export type Resource = (typeof RESOURCES)[number];
export type Action = "read" | "create" | "update" | "delete" | "export";
export type Role = "admin" | "super_admin";

const ALL: Action[] = ["read", "create", "update", "delete", "export"];

const ADMIN: Partial<Record<Resource, Action[]>> = {
  division: ALL, position: ALL, member: ALL, program: ALL, event: ALL,
  attendance: ["read", "update", "delete", "export"],
  archive: ALL, document: ALL, gallery: ALL, leadership: ALL,
  news: ALL, highlight: ALL, site_media: ALL,
  period: ["read"],
  integration: ["read"],
  organization: ["read"],
};

export const ADMIN_POSITIONS = [
  { value: "ketua_umum", label: "Ketua Umum" },
  { value: "sekretaris", label: "Sekretaris" },
  { value: "bendahara", label: "Bendahara" },
  { value: "ketua_divisi", label: "Kepala Divisi" },
  { value: "sekretaris_divisi", label: "Sekretaris Divisi" },
] as const;

export function can(
  role: Role,
  resource: Resource,
  action: Action,
  extra?: string[] | null,
): boolean {
  if (role === "super_admin") return true;
  if (extra?.includes(`${resource}:${action}`)) return true;
  return ADMIN[resource]?.includes(action) ?? false;
}
