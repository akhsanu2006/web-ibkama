import type { Resource as Perm } from "@/lib/permissions";

export type LookupKey = "period" | "division" | "position" | "member" | "category" | "program";

export type Field = {
  name: string;
  label: string;
  type: "text" | "textarea" | "date" | "time" | "number" | "select" | "checkbox" | "url" | "email" | "image" | "file";
  required?: boolean;
  help?: string;
  placeholder?: string;
  /** opsi statis */
  options?: { value: string; label: string }[];
  /** opsi dari tabel lain */
  lookup?: LookupKey;
  /** lebar kolom di form (1 = setengah, 2 = penuh) */
  span?: 1 | 2;
  /** hanya tampil untuk peran ini */
  privateField?: boolean;
  default?: string | boolean | number;
  /** khusus type "image": izinkan memilih PDF (halaman pertama diubah jadi JPG di browser sebelum diunggah) */
  acceptPdf?: boolean;
};

export type Column = {
  name: string;
  label: string;
  kind?: "text" | "status" | "bool" | "lookup" | "date" | "image";
  lookup?: LookupKey;
};

export type ResourceDef = {
  /** slug URL: /admin/[slug] */
  slug: string;
  /** kunci tabel di db/schema */
  table: string;
  permission: Perm;
  label: string;        // "Program Kerja"
  singular: string;     // "Program Kerja"
  addLabel: string;     // "Tambah Program Kerja"
  description: string;
  periodScoped: boolean;
  columns: Column[];
  fields: Field[];
  /** kolom untuk pencarian teks */
  searchColumn?: string;
  /** kolom pengurut daftar */
  orderBy?: { column: string; dir: "asc" | "desc" };
  /** pesan kosong */
  emptyHint: string;
  /** true = modul dinonaktifkan: hilang dari dashboard, halaman 404, simpan/hapus ditolak. Data lama tetap ada. */
  disabled?: boolean;
};
