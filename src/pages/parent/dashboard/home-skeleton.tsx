const BLOCK = "rounded-full bg-skeleton";

export function HomeSkeleton() {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_380px] gap-5" aria-hidden="true">
      <div className="flex flex-col gap-5">
        <div className="flex h-48 items-center gap-6 rounded-3xl bg-surface px-7">
          <div className="flex flex-1 flex-col gap-4">
            <i className={`h-6 w-28 ${BLOCK}`} />
            <i className={`h-7 w-80 ${BLOCK}`} />
            <i className={`h-4 w-60 ${BLOCK}`} />
            <i className={`h-10 w-36 ${BLOCK}`} />
          </div>
          <div className="flex gap-2.5">
            {Array.from({ length: 7 }, (_, index) => (
              <i key={index} className="h-13 w-7.5 rounded-xl bg-skeleton" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="flex h-32 flex-col gap-3 rounded-[20px] bg-surface p-4">
              <i className="size-9 rounded-xl bg-skeleton" />
              <i className={`h-3 w-20 ${BLOCK}`} />
              <i className="h-6 w-24 rounded-lg bg-skeleton" />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-5 rounded-[20px] bg-surface p-4">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="flex items-center gap-4">
              <i className="size-10 rounded-xl bg-skeleton" />
              <i className="size-12 rounded-xl bg-skeleton" />
              <div className="flex flex-col gap-2">
                <i className={`h-3 w-36 ${BLOCK}`} />
                <i className={`h-3 w-24 ${BLOCK}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-5 rounded-[20px] bg-surface p-4">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="flex items-center gap-4">
              <i className="size-10 rounded-xl bg-skeleton" />
              <i className="size-11 rounded-xl bg-skeleton" />
              <div className="flex flex-col gap-2">
                <i className={`h-3 w-36 ${BLOCK}`} />
                <i className={`h-3 w-24 ${BLOCK}`} />
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-4 rounded-[20px] bg-surface p-5">
          <i className={`h-4 w-28 ${BLOCK}`} />
          <i className="h-28 w-full rounded-xl bg-skeleton" />
        </div>
      </div>
    </div>
  );
}
