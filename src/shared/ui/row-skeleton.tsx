const BAR = "rounded-full bg-subtle";

export function RowSkeleton() {
  return (
    <span className="flex shrink-0 items-center gap-3" aria-hidden="true">
      <i className="h-9 w-11 shrink-0 rounded-sm bg-subtle" />
      <i className="size-11 shrink-0 rounded-md bg-subtle" />
      <span className="flex flex-col gap-2">
        <i className={`${BAR} h-3.5 w-35`} />
        <i className={`${BAR} h-3 w-22.5`} />
      </span>
    </span>
  );
}
