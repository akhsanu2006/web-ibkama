/**
 * Data resmi awal IBKAMA UMY (sumber: dokumen "Kebutuhan Data Organisasi").
 * Hanya berisi data yang diberikan pengurus. Tidak ada data fiktif.
 * Setelah seed, semua data ini dapat diubah Super Admin dari dashboard.
 */
export const organizationSeed = {
  id: "main",
  name: "Ikatan Beasiswa Kader Muhammadiyah Universitas Muhammadiyah Yogyakarta",
  shortName: "IBKAMA UMY",
  tagline: "Bersahaja, Berkarya, Berjaya",
  description:
    "IBKAMA UMY (Ikatan Beasiswa Kader Muhammadiyah Universitas Muhammadiyah Yogyakarta) adalah organisasi kemahasiswaan yang menjadi wadah bagi seluruh mahasiswa penerima Beasiswa Kader Muhammadiyah di UMY meliputi beasiswa hafidz Muhammadiyah, beasiswa kader unggulan Muhammadiyah, beasiswa talenta atlet, seni, dan sains, beasiswa tapak suci, beasiswa Qori’. Organisasi ini berfungsi sebagai tempat pembinaan keberlanjutan penerima beasiswa dan pengembangan soft skills, serta aksi sosial untuk mencetak kader Muhammadiyah yang unggul dan berkontribusi nyata bagi masyarakat.",
  history:
    "Ikatan Beasiswa Kader Muhammadiyah Universitas Muhammadiyah Yogyakarta (IBKAMA UMY) hadir sebagai wadah pembinaan dan pengembangan bagi seluruh mahasiswa penerima Beasiswa Kader Muhammadiyah di lingkungan Universitas Muhammadiyah Yogyakarta. Organisasi ini dibentuk sebagai sarana untuk mempererat ukhuwah antar penerima beasiswa, mendukung keberlanjutan prestasi akademik maupun nonakademik, serta memastikan para penerima beasiswa mampu menjaga amanah yang diberikan hingga menyelesaikan masa studinya.\n\nSeiring berkembangnya jumlah dan ragam program beasiswa di UMY, IBKAMA UMY terus bertransformasi menjadi organisasi yang tidak hanya berfokus pada pembinaan penerima beasiswa, tetapi juga pada pengembangan kepemimpinan, peningkatan soft skills, penguatan nilai-nilai Muhammadiyah, serta pelaksanaan berbagai program sosial yang memberikan manfaat bagi masyarakat luas. Melalui semangat kebersamaan dan pengkaderan, IBKAMA UMY berupaya mencetak generasi kader Muhammadiyah yang unggul, berintegritas, dan mampu memberikan kontribusi nyata bagi umat, bangsa, dan persyarikatan.",
  vision:
    "Menjadi wadah pembinaan dan pengembangan kader penerima Beasiswa Muhammadiyah yang unggul, berintegritas, berprestasi, serta mampu memberikan kontribusi nyata bagi masyarakat, bangsa, dan Persyarikatan Muhammadiyah.",
  missions: [
    "Membina dan mendampingi penerima beasiswa agar mampu mempertahankan serta meningkatkan prestasi akademik maupun nonakademik.",
    "Mengembangkan kemampuan kepemimpinan, komunikasi, dan soft skills anggota melalui berbagai program pembinaan yang berkelanjutan.",
    "Mempererat ukhuwah dan jaringan antar penerima beasiswa Muhammadiyah di Universitas Muhammadiyah Yogyakarta.",
    "Menanamkan nilai-nilai Islam dan Kemuhammadiyahan dalam setiap aktivitas organisasi.",
    "Mendorong anggota untuk aktif berkontribusi dalam kegiatan sosial, pendidikan, dan pemberdayaan masyarakat.",
    "Menciptakan lingkungan organisasi yang kolaboratif, inovatif, dan berorientasi pada kebermanfaatan.",
  ],
  goals:
    "Sebagai wadah bagi para penerima beasiswa dalam menjaga status awarding beasiswa agar terus bisa dilanjutkan sampai selesai masa perkuliahan, pengembangan soft skill, memperluas relasi antar penerima beasiswa, dan mencetak kader Muhammadiyah yang berdampak.",
  values: [
    { title: "Integritas", description: "Menjunjung tinggi kejujuran, tanggung jawab, dan amanah dalam setiap tindakan." },
    { title: "Keilmuan", description: "Senantiasa mengembangkan kapasitas intelektual dan budaya belajar sepanjang hayat." },
    { title: "Kaderisasi", description: "Menumbuhkan jiwa kepemimpinan dan semangat pengabdian sebagai kader Muhammadiyah." },
    { title: "Kolaborasi", description: "Membangun sinergi dan kerja sama yang positif antar anggota maupun mitra organisasi." },
    { title: "Kebermanfaatan", description: "Menghadirkan program dan tindakan yang memberikan dampak nyata bagi masyarakat." },
    { title: "Profesionalisme", description: "Bekerja secara terstruktur, disiplin, dan berorientasi pada kualitas." },
    { title: "Kekeluargaan", description: "Menjaga ukhuwah, rasa saling menghargai, dan solidaritas antar anggota." },
  ],
  address:
    "Jl. Brawijaya, Geblagan, Tamantirto, Kec. Kasihan, Kabupaten Bantul, Daerah Istimewa Yogyakarta 55183",
  email: "ibkamaumyogyakarta@gmail.com",
  phone: "+6288806172501",
  whatsapp: "+6288806172501",
  instagramHandle: "@ibkama.umy_",
  instagramUrl: "https://www.instagram.com/ibkama.umy_?",
  waChannelName: "IBKAMA Space",
  waChannelUrl: "https://whatsapp.com/channel/0029Vb7lpSQLI8YYGQUJ8w1B",
  website: null,
};

/** Kategori arsip bawaan (dapat ditambah dari dashboard). */
export const archiveCategorySeed = [
  { name: "Kepengurusan", slug: "kepengurusan" },
  { name: "Program Kerja", slug: "program-kerja" },
  { name: "Dokumentasi", slug: "dokumentasi" },
  { name: "Dokumen", slug: "dokumen" },
];

/** Jabatan struktural yang disebut dalam kebutuhan (bukan nama orang). */
export const positionSeed = [
  { name: "Ketua Umum", category: "core" as const, sortOrder: 1 },
  { name: "Wakil Ketua", category: "core" as const, sortOrder: 2 },
  { name: "Sekretaris", category: "core" as const, sortOrder: 3 },
  { name: "Bendahara", category: "core" as const, sortOrder: 4 },
  { name: "Kepala Divisi", category: "division_head" as const, sortOrder: 5 },
  { name: "Sekretaris Divisi", category: "division_secretary" as const, sortOrder: 6 },
  { name: "Anggota Divisi", category: "staff" as const, sortOrder: 7 },
];

/**
 * Band "IBKAMA dalam Angka" bawaan: angka otomatis dari data + satu angka manual yang SENGAJA kosong
 * (diisi pengurus dari dashboard — angka kosong/0 tidak ditampilkan, jadi tidak ada angka karangan).
 */
export const highlightSeed = [
  { label: "Anak IBKAMA lintas angkatan", source: "anggota" as const, sortOrder: 1 },
  { label: "Prestasi yang telah diraih", source: "prestasi" as const, sortOrder: 2 },
  { label: "Ketua umum di berbagai organisasi UMY", source: "manual" as const, sortOrder: 3 },
  { label: "Semangat bersahaja, berkarya, berjaya", source: "manual" as const, displayText: "∞", sortOrder: 4 },
];

/** Integrasi: hanya tautan resmi yang diberikan yang terisi. */
export const integrationSeed = [
  { key: "instagram", label: "Instagram", url: "https://www.instagram.com/ibkama.umy_?", enabled: true },
  { key: "whatsapp", label: "WhatsApp", url: "https://wa.me/6288806172501", enabled: true },
  { key: "wa_channel", label: "WhatsApp Channel — IBKAMA Space", url: "https://whatsapp.com/channel/0029Vb7lpSQLI8YYGQUJ8w1B", enabled: true },
  { key: "google_forms", label: "Google Forms", url: null, enabled: false },
  { key: "google_calendar", label: "Google Calendar", url: null, enabled: false },
  { key: "google_drive", label: "Google Drive", url: null, enabled: false },
];

/**
 * Divisi bawaan yang otomatis dibuat untuk setiap periode baru (atas permintaan pengurus).
 * Tetap dapat diubah/ditambah/dihapus per periode dari menu Divisi.
 */
export const defaultDivisions = [
  { name: "Pimpinan Harian", sortOrder: 1 },
  { name: "Divisi Internal", sortOrder: 2 },
  { name: "Divisi Eksternal", sortOrder: 3 },
  { name: "Divisi Media dan Komunikasi", sortOrder: 4 },
];
