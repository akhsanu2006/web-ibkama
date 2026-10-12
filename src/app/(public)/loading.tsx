import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-6 pb-20 pt-40" role="status" aria-label="Memuat halaman">
      <Skeleton className="h-10 w-2/3" /><Skeleton className="mt-4 h-5 w-1/2" />
      <div className="mt-12 grid gap-5 md:grid-cols-3">{[0,1,2].map((i) => <Skeleton key={i} className="h-52" />)}</div>
    </div>
  );
}
