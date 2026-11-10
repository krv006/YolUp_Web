import { useEffect, useState } from "react";
import logoUrl from "@/shared/assets/y-logo.svg";

interface Spot {
  x: number;
  y: number;
  visible: boolean;
}

const FIRST_DELAY_MS = 1500;

function between(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function FloatingWatermark({ label }: { label: string }) {
  const [spot, setSpot] = useState<Spot>({ x: 10, y: 15, visible: false });

  useEffect(() => {
    let timer = 0;
    const show = (visible: boolean) => {
      setSpot((current) =>
        visible ? { x: between(4, 96), y: between(6, 80), visible: true } : { ...current, visible: false }
      );
      timer = window.setTimeout(() => show(!visible), visible ? between(4000, 7000) : between(2000, 4500));
    };
    timer = window.setTimeout(() => show(true), FIRST_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute z-10 flex items-center gap-1.5 whitespace-nowrap text-caption-strong text-ink-inverse/40 transition-opacity duration-1000 select-none [text-shadow:0_1px_2px_rgb(0_0_0/0.35)]"
      style={{
        left: `${spot.x}%`,
        top: `${spot.y}%`,
        opacity: spot.visible ? 1 : 0,
        transform: `translate(-${spot.x}%, -${spot.y}%) rotate(-12deg)`,
      }}
    >
      <img className="size-3.5 opacity-50" src={logoUrl} alt="" draggable={false} />
      {label}
    </span>
  );
}
