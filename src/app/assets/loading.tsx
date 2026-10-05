export default function AssetsLoading() {
  return (
    <div className="flex flex-col gap-6" aria-label="Loading asset listings">
      <div className="flex flex-col gap-2">
        <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-32 animate-pulse rounded-md bg-muted" />
      </div>

      <div className="h-40 animate-pulse rounded-lg border border-border bg-surface" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="flex h-56 flex-col gap-3 rounded-lg border border-border bg-surface p-6"
          >
            <div className="flex gap-2">
              <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
              <div className="h-5 w-10 animate-pulse rounded-full bg-muted" />
            </div>
            <div className="h-6 w-3/4 animate-pulse rounded-md bg-muted" />
            <div className="h-4 w-full animate-pulse rounded-md bg-muted" />
            <div className="mt-auto flex items-center justify-between">
              <div className="h-6 w-24 animate-pulse rounded-md bg-muted" />
              <div className="h-4 w-12 animate-pulse rounded-md bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
