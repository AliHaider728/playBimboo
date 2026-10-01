export default function Loading() {
  return (
    <main className="mx-auto min-h-[60vh] w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8" aria-label="Loading page">
      <div className="mb-8 h-8 w-56 animate-pulse rounded-xl bg-slate-200" />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
            <div className="aspect-square animate-pulse bg-slate-200" />
            <div className="space-y-3 p-5">
              <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
