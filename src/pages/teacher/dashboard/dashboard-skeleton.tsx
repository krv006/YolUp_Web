function Row() {
  return (
    <span className="flex items-center gap-4 border-b border-line px-5 py-4 last:border-b-0">
      <span className="size-10 shrink-0 animate-pulse rounded-xl bg-muted" />
      <span className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="h-3 w-2/3 animate-pulse rounded-full bg-muted" />
        <span className="h-2.5 w-1/3 animate-pulse rounded-full bg-muted" />
      </span>
    </span>
  );
}

function Card({ rows = 2 }: { rows?: number }) {
  return (
    <span className="flex flex-col overflow-hidden rounded-lg bg-surface">
      {Array.from({ length: rows }, (_, index) => (
        <Row key={index} />
      ))}
    </span>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="flex min-w-0 flex-col gap-6">
        <span className="h-[120px] animate-pulse rounded-xl bg-muted" />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <span
              key={index}
              className="flex flex-col gap-2 rounded-lg bg-surface p-5"
            >
              <span className="h-2.5 w-2/3 animate-pulse rounded-full bg-muted" />
              <span className="h-6 w-1/3 animate-pulse rounded-lg bg-muted" />
              <span className="h-2.5 w-1/2 animate-pulse rounded-full bg-muted" />
            </span>
          ))}
        </div>

        <Card rows={5} />
      </div>

      <div className="flex min-w-0 flex-col gap-6">
        <span className="flex flex-col gap-3">
          <span className="h-4 w-36 animate-pulse rounded-full bg-muted" />
          <Card rows={2} />
        </span>
        <span className="flex flex-col gap-3">
          <span className="h-4 w-36 animate-pulse rounded-full bg-muted" />
          <Card rows={2} />
        </span>
      </div>
    </div>
  );
}
