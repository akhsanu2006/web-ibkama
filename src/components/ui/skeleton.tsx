export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden />;
}
export function CardGridSkeleton({ n = 3 }: { n?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Memuat">
      {Array.from({ length: n }).map((_, i) => <Skeleton key={i} className="h-48" />)}
    </div>
  );
}
