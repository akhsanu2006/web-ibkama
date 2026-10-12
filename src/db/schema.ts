import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/**
 * Skema IBKAMA UMY.
 * Aturan inti: semua data organisasi yang berubah membawa period_id.
 * Periode lama tidak pernah dihapus, hanya diarsipkan.
 */

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const createdAt = () =>
  integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`);

const updatedAt = () =>
  integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date());

// ---------------------------------------------------------------- ORGANISASI
export const organization = sqliteTable("organization", {
  id: text("id").primaryKey().default("main"),
  name: text("name").notNull(),
  shortName: text("short_name").notNull(),
  tagline: text("tagline").notNull(),
  description: text("description").notNull(),
  history: text("history").notNull(),
  vision: text("vision").notNull(),
  /** array string (JSON) */
  missions: text("missions", { mode: "json" }).$type<string[]>().notNull(),
  goals: text("goals").notNull(),
  values: text("values", { mode: "json" })
    .$type<{ title: string; description: string }[]>()
    .notNull(),
  address: text("address"),
  email: text("email"),
  phone: text("phone"),
  whatsapp: text("whatsapp"),
  instagramHandle: text("instagram_handle"),
  instagramUrl: text("instagram_url"),
  waChannelName: text("wa_channel_name"),
  waChannelUrl: text("wa_channel_url"),
  website: text("website"),
  updatedAt: updatedAt(),
});

// ------------------------------------------------------------------- PERIODE
export const periods = sqliteTable(
  "periods",
  {
    id: id(),
    /** contoh: 2026/2027 */
    name: text("name").notNull().unique(),
    startYear: integer("start_year").notNull(),
    endYear: integer("end_year").notNull(),
    /** draft | active | archived */
    status: text("status", { enum: ["draft", "active", "archived"] })
      .notNull()
      .default("draft"),
    description: text("description"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("periods_status_idx").on(t.status)],
);

// ------------------------------------------------------------------ PENGGUNA
export const users = sqliteTable("users", {
  id: id(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "super_admin"] })
    .notNull()
    .default("admin"),
  /** label jabatan admin: ketua_umum, sekretaris, bendahara, ketua_divisi, sekretaris_divisi */
  adminPosition: text("admin_position"),
  /** override izin granular di masa depan: ["program:delete", ...] */
  permissions: text("permissions", { mode: "json" }).$type<string[]>(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  /**
   * Versi sesi: ikut disimpan di token login. Dinaikkan saat logout / ganti password →
   * semua token lama akun ini (di perangkat mana pun) otomatis ditolak.
   */
  sessionVersion: integer("session_version").notNull().default(0),
  /**
   * Periode akses untuk peran Admin: Admin hanya bisa masuk selama periode ini berstatus aktif.
   * Saat periode baru diaktifkan, akses Admin periode lama otomatis berakhir. Diabaikan untuk Super Admin.
   */
  periodId: text("period_id").references(() => periods.id, { onDelete: "set null" }),
  memberId: text("member_id"),
  lastLoginAt: integer("last_login_at", { mode: "timestamp" }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/**
 * Penghitung percobaan gagal (login & verifikasi password lama). Disimpan di DB agar tetap berlaku
 * setelah server restart. key mis. "login-pair:<email>|<ip>", "login-ip:<ip>", "login-email:<email>".
 */
export const authAttempts = sqliteTable("auth_attempts", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  /** awal jendela hitung (ms epoch) */
  windowStart: integer("window_start").notNull(),
  /** terkunci sampai (ms epoch); null = tidak terkunci */
  lockedUntil: integer("locked_until"),
});

// --------------------------------------------------------------------- MEDIA
export const media = sqliteTable(
  "media",
  {
    id: id(),
    kind: text("kind", { enum: ["image", "document", "video"] }).notNull(),
    /** path relatif terhadap direktori storage */
    path: text("path").notNull(),
    originalName: text("original_name").notNull(),
    mime: text("mime").notNull(),
    size: integer("size").notNull(),
    periodId: text("period_id").references(() => periods.id),
    /** public = boleh diakses siapa saja, private = wajib login */
    visibility: text("visibility", { enum: ["public", "private"] })
      .notNull()
      .default("public"),
    /** metadata relasi: member | program | event | archive | document | gallery */
    ownerType: text("owner_type"),
    ownerId: text("owner_id"),
    uploadedBy: text("uploaded_by").references(() => users.id),
    createdAt: createdAt(),
  },
  (t) => [index("media_period_idx").on(t.periodId)],
);

// --------------------------------------------------- DIVISI, JABATAN, ANGGOTA
export const divisions = sqliteTable(
  "divisions",
  {
    id: id(),
    periodId: text("period_id")
      .notNull()
      .references(() => periods.id),
    name: text("name").notNull(),
    description: text("description"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [
    index("divisions_period_idx").on(t.periodId),
    uniqueIndex("divisions_period_name_uq").on(t.periodId, t.name),
  ],
);

/** Jabatan bersifat global (lookup), dapat ditambah dari dashboard. */
export const positions = sqliteTable("positions", {
  id: id(),
  name: text("name").notNull().unique(),
  /** core = inti, division_head, division_secretary, staff */
  category: text("category", {
    enum: ["core", "division_head", "division_secretary", "staff"],
  }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const members = sqliteTable(
  "members",
  {
    id: id(),
    periodId: text("period_id")
      .notNull()
      .references(() => periods.id),
    positionId: text("position_id").references(() => positions.id),
    divisionId: text("division_id").references(() => divisions.id),
    // --- kolom PUBLIK
    name: text("name").notNull(),
    photoMediaId: text("photo_media_id").references(() => media.id),
    studyProgram: text("study_program"),
    cohort: text("cohort"),
    bio: text("bio"),
    status: text("status", { enum: ["active", "inactive"] })
      .notNull()
      .default("active"),
    isPublic: integer("is_public", { mode: "boolean" }).notNull().default(true),
    // --- kolom PRIVAT (hanya admin)
    studentId: text("student_id"),
    email: text("email"),
    phone: text("phone"),
    scholarshipType: text("scholarship_type"),
    internalNotes: text("internal_notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("members_period_idx").on(t.periodId),
    index("members_division_idx").on(t.divisionId),
  ],
);

// ------------------------------------------------------------ PROGRAM KERJA
export const programs = sqliteTable(
  "programs",
  {
    id: id(),
    periodId: text("period_id")
      .notNull()
      .references(() => periods.id),
    divisionId: text("division_id").references(() => divisions.id),
    picMemberId: text("pic_member_id").references(() => members.id),
    name: text("name").notNull(),
    description: text("description"),
    background: text("background"),
    target: text("target"),
    startDate: text("start_date"), // ISO yyyy-mm-dd
    endDate: text("end_date"),
    timeNote: text("time_note"),
    location: text("location"),
    status: text("status", {
      enum: ["planned", "ongoing", "completed", "cancelled"],
    })
      .notNull()
      .default("planned"),
    participantCount: integer("participant_count"),
    output: text("output"),
    reportUrl: text("report_url"),
    supportingUrl: text("supporting_url"),
    /** Arsip, dokumen & dokumentasi program (masing-masing berkas dan/atau tautan) — tampil di detail program publik. */
    archiveMediaId: text("archive_media_id").references(() => media.id),
    archiveUrl: text("archive_url"),
    documentMediaId: text("document_media_id").references(() => media.id),
    documentUrl: text("document_url"),
    documentationMediaId: text("documentation_media_id").references(() => media.id),
    documentationUrl: text("documentation_url"),
    isPublic: integer("is_public", { mode: "boolean" }).notNull().default(true),
    /** Presensi QR per program kerja (pengganti presensi per event). */
    attendanceCode: text("attendance_code"),
    attendanceOpen: integer("attendance_open", { mode: "boolean" }).notNull().default(false),
    /** bukti kehadiran yang wajib diisi peserta saat presensi */
    attendanceRequireSignature: integer("attendance_require_signature", { mode: "boolean" }).notNull().default(true),
    attendanceRequirePhoto: integer("attendance_require_photo", { mode: "boolean" }).notNull().default(true),
    /** presensi otomatis tertutup setelah waktu ini (ms epoch); null = tanpa tutup otomatis */
    attendanceClosesAt: integer("attendance_closes_at"),
    /** true = hanya NIM yang ada di daftar peserta yang boleh presensi */
    attendanceRegisteredOnly: integer("attendance_registered_only", { mode: "boolean" }).notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("programs_period_idx").on(t.periodId),
    // indeks unik terpisah (bukan .unique() kolom): SQLite tak bisa ADD COLUMN ... UNIQUE pada tabel yang sudah ada
    uniqueIndex("programs_attendance_code_uq").on(t.attendanceCode),
  ],
);

/** Daftar peserta terdaftar (opsional) per program → dasar hitung "belum hadir". */
export const programParticipants = sqliteTable(
  "program_participants",
  {
    id: id(),
    programId: text("program_id")
      .notNull()
      .references(() => programs.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    identifier: text("identifier"), // NIM / kode unik
    studyProgram: text("study_program"),
    createdAt: createdAt(),
  },
  (t) => [index("program_participants_program_idx").on(t.programId)],
);

export const programAttendances = sqliteTable(
  "program_attendances",
  {
    id: id(),
    programId: text("program_id")
      .notNull()
      .references(() => programs.id, { onDelete: "cascade" }),
    /** denormalisasi agar rekap per periode cepat */
    periodId: text("period_id")
      .notNull()
      .references(() => periods.id),
    participantId: text("participant_id").references(() => programParticipants.id),
    name: text("name").notNull(),
    /** NIM/identitas; dipakai mencegah presensi ganda */
    identifier: text("identifier").notNull(),
    studyProgram: text("study_program"),
    cohort: text("cohort"),
    note: text("note"),
    /** bukti kehadiran (media PRIVAT — hanya bisa dibuka pengguna yang login) */
    signatureMediaId: text("signature_media_id").references(() => media.id),
    photoMediaId: text("photo_media_id").references(() => media.id),
    /** jejak perangkat (user-agent) untuk audit bila ada kecurigaan titip absen */
    deviceInfo: text("device_info"),
    checkedInAt: integer("checked_in_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    index("program_attendances_program_idx").on(t.programId),
    uniqueIndex("program_attendances_program_identifier_uq").on(t.programId, t.identifier),
  ],
);

// --------------------------------------------------------------------- EVENT
// Catatan (2026-10): modul Event dinonaktifkan dan presensi dipindah ke Program Kerja
// (programs.attendance* + program_participants + program_attendances). Tabel event,
// event_participants, dan attendances dibiarkan (kosong) agar tidak perlu migrasi destruktif.
export const events = sqliteTable(
  "events",
  {
    id: id(),
    periodId: text("period_id")
      .notNull()
      .references(() => periods.id),
    programId: text("program_id").references(() => programs.id),
    name: text("name").notNull(),
    description: text("description"),
    date: text("date").notNull(), // ISO yyyy-mm-dd
    startTime: text("start_time"), // HH:mm
    endTime: text("end_time"),
    location: text("location"),
    organizer: text("organizer"),
    contactPerson: text("contact_person"),
    posterMediaId: text("poster_media_id").references(() => media.id),
    registrationUrl: text("registration_url"),
    status: text("status", {
      enum: ["upcoming", "ongoing", "completed", "cancelled"],
    })
      .notNull()
      .default("upcoming"),
    isPublic: integer("is_public", { mode: "boolean" }).notNull().default(true),
    /** Presensi QR */
    attendanceCode: text("attendance_code").unique(),
    attendanceOpen: integer("attendance_open", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("events_period_idx").on(t.periodId),
    index("events_date_idx").on(t.date),
  ],
);

/** Daftar peserta terdaftar (opsional) → dasar hitung "tidak hadir". */
export const eventParticipants = sqliteTable(
  "event_participants",
  {
    id: id(),
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    identifier: text("identifier"), // NIM / kode unik
    studyProgram: text("study_program"),
    createdAt: createdAt(),
  },
  (t) => [index("event_participants_event_idx").on(t.eventId)],
);

export const attendances = sqliteTable(
  "attendances",
  {
    id: id(),
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    /** denormalisasi agar rekap per periode cepat */
    periodId: text("period_id")
      .notNull()
      .references(() => periods.id),
    participantId: text("participant_id").references(() => eventParticipants.id),
    name: text("name").notNull(),
    /** NIM/identitas; dipakai mencegah presensi ganda */
    identifier: text("identifier").notNull(),
    studyProgram: text("study_program"),
    cohort: text("cohort"),
    note: text("note"),
    checkedInAt: integer("checked_in_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    index("attendances_event_idx").on(t.eventId),
    uniqueIndex("attendances_event_identifier_uq").on(t.eventId, t.identifier),
  ],
);

// ------------------------------------------------ ARSIP, DOKUMEN, DOKUMENTASI
export const archiveCategories = sqliteTable("archive_categories", {
  id: id(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const archiveEntries = sqliteTable(
  "archive_entries",
  {
    id: id(),
    periodId: text("period_id")
      .notNull()
      .references(() => periods.id),
    categoryId: text("category_id")
      .notNull()
      .references(() => archiveCategories.id),
    title: text("title").notNull(),
    description: text("description"),
    /** tautan opsional ke entitas lain */
    programId: text("program_id").references(() => programs.id),
    eventId: text("event_id").references(() => events.id),
    isPublic: integer("is_public", { mode: "boolean" }).notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("archive_entries_period_idx").on(t.periodId),
    index("archive_entries_category_idx").on(t.categoryId),
  ],
);

export const documents = sqliteTable(
  "documents",
  {
    id: id(),
    periodId: text("period_id")
      .notNull()
      .references(() => periods.id),
    categoryId: text("category_id").references(() => archiveCategories.id),
    archiveEntryId: text("archive_entry_id").references(() => archiveEntries.id),
    title: text("title").notNull(),
    description: text("description"),
    /** file unggahan ATAU tautan eksternal (mis. Google Drive) */
    mediaId: text("media_id").references(() => media.id),
    externalUrl: text("external_url"),
    /** public = tampil di publik, internal = hanya admin */
    visibility: text("visibility", { enum: ["public", "internal"] })
      .notNull()
      .default("internal"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("documents_period_idx").on(t.periodId)],
);

export const galleryItems = sqliteTable(
  "gallery_items",
  {
    id: id(),
    periodId: text("period_id")
      .notNull()
      .references(() => periods.id),
    eventId: text("event_id").references(() => events.id),
    programId: text("program_id").references(() => programs.id),
    mediaId: text("media_id")
      .notNull()
      .references(() => media.id),
    title: text("title"),
    caption: text("caption"),
    isPublic: integer("is_public", { mode: "boolean" }).notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [index("gallery_period_idx").on(t.periodId)],
);

// ------------------------------------------------------- RIWAYAT KETUA UMUM
export const leadershipHistory = sqliteTable("leadership_history", {
  id: id(),
  /** satu ketua utama per periode */
  periodId: text("period_id")
    .notNull()
    .unique()
    .references(() => periods.id),
  memberId: text("member_id").references(() => members.id),
  /** snapshot nama agar tetap tampil walau data anggota berubah */
  chairName: text("chair_name").notNull(),
  photoMediaId: text("photo_media_id").references(() => media.id),
  profile: text("profile"),
  periodInfo: text("period_info"),
  achievements: text("achievements"),
  documentationUrl: text("documentation_url"),
  isPublic: integer("is_public", { mode: "boolean" }).notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

// ------------------------------------------------------------------- BERITA
/** Kabar terbaru, prestasi, dan rekognisi anak IBKAMA. Tidak terikat periode (arsip berjalan terus). */
export const news = sqliteTable(
  "news",
  {
    id: id(),
    category: text("category", { enum: ["kabar", "prestasi", "rekognisi"] }).notNull().default("kabar"),
    title: text("title").notNull(),
    /** nama anak IBKAMA / tim yang diberitakan (opsional) */
    personName: text("person_name"),
    /** tingkat capaian, mis. Nasional, Internasional, Universitas (opsional) */
    level: text("level"),
    summary: text("summary"),
    body: text("body"),
    coverMediaId: text("cover_media_id").references(() => media.id),
    /** tanggal kejadian/terbit (yyyy-mm-dd) */
    date: text("date"),
    sourceUrl: text("source_url"),
    isPublic: integer("is_public", { mode: "boolean" }).notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("news_category_idx").on(t.category), index("news_date_idx").on(t.date)],
);

// ------------------------------------------------------- ANGKA PENCAPAIAN
/**
 * Angka yang tampil di band "IBKAMA dalam angka" di beranda.
 * source = manual → pakai value/displayText; selain itu dihitung otomatis dari data.
 */
export const highlights = sqliteTable("highlights", {
  id: id(),
  label: text("label").notNull(),
  source: text("source", { enum: ["manual", "anggota", "prestasi", "rekognisi", "berita", "program_selesai", "periode"] })
    .notNull()
    .default("manual"),
  value: integer("value"),
  /** teks pengganti angka, mis. "∞" (khusus manual) */
  displayText: text("display_text"),
  /** akhiran, mis. "+" atau "%" */
  suffix: text("suffix"),
  sortOrder: integer("sort_order").notNull().default(0),
  isPublic: integer("is_public", { mode: "boolean" }).notNull().default(true),
  createdAt: createdAt(),
});

// --------------------------------------------------------------- MEDIA SITUS
/**
 * Foto/video pengganti untuk slot tetap di halaman publik (video pembuka, logo koin, foto profil, …).
 * Kunci slot didefinisikan di src/content/site-media.ts. Tidak ada baris = pakai berkas bawaan di /public.
 */
export const siteMedia = sqliteTable("site_media", {
  key: text("key").primaryKey(),
  mediaId: text("media_id").notNull().references(() => media.id),
  updatedBy: text("updated_by").references(() => users.id),
  updatedAt: updatedAt(),
});

// ---------------------------------------------------------------- INTEGRASI
export const integrations = sqliteTable("integrations", {
  key: text("key").primaryKey(),
  label: text("label").notNull(),
  /** tautan/embed publik; BUKAN kredensial */
  url: text("url"),
  embedUrl: text("embed_url"),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(false),
  updatedAt: updatedAt(),
});

export type Period = typeof periods.$inferSelect;
export type User = typeof users.$inferSelect;
export type Member = typeof members.$inferSelect;
export type Program = typeof programs.$inferSelect;
export type Event = typeof events.$inferSelect;
export type Organization = typeof organization.$inferSelect;
export type Integration = typeof integrations.$inferSelect;
