/**
 * Mengubah halaman pertama PDF menjadi berkas JPG — dijalankan di BROWSER saja (impor dinamis),
 * sehingga server tetap hanya menerima & menyimpan gambar.
 */
export async function pdfFirstPageToJpeg(pdf: File, maxSide = 1600): Promise<File> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

  const task = pdfjs.getDocument({ data: new Uint8Array(await pdf.arrayBuffer()) });
  const doc = await task.promise;
  try {
    const page = await doc.getPage(1);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: Math.min(4, maxSide / Math.max(base.width, base.height)) });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff"; // latar putih untuk PDF transparan
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // intent "print": tidak bergantung requestAnimationFrame, jadi tetap selesai walau tab sedang tidak terlihat.
    await page.render({ canvas, canvasContext: ctx, viewport, intent: "print" }).promise;
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.9));
    if (!blob) throw new Error("Gagal mengubah PDF menjadi gambar.");
    return new File([blob], pdf.name.replace(/\.pdf$/i, "") + ".jpg", { type: "image/jpeg" });
  } finally {
    await task.destroy();
  }
}
