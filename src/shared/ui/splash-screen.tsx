import logoUrl from "@/shared/assets/y-logo.svg";

const DOT = "size-2 shrink-0 rounded-full bg-brand-strong";

export function SplashScreen({ label = "Yuklanmoqda" }: { label?: string }) {
  return (
    <div
      className="relative flex min-h-dvh w-full flex-col items-center justify-center bg-canvas bg-auth-gradient"
      role="status"
      aria-label={label}
    >
      <img className="size-34 select-none" src={logoUrl} alt="" draggable={false} />

      <span className="absolute bottom-[9.8%] flex items-center gap-[5px]" aria-hidden="true">
        <i className={`${DOT} [animation:splash-dot_1s_ease-in-out_0ms_infinite]`} />
        <i className={`${DOT} [animation:splash-dot_1s_ease-in-out_150ms_infinite]`} />
        <i className={`${DOT} [animation:splash-dot_1s_ease-in-out_300ms_infinite]`} />
      </span>
    </div>
  );
}
