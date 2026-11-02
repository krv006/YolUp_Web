import { Icon } from "@/shared/ui/icon";

const TILE_TONES = {
  brand: "bg-brand-subtle text-brand",
  green: "bg-accent-green-bg text-accent-green-fg",
};

export function IconTile({ icon, tone = "brand" }: { icon: string; tone?: keyof typeof TILE_TONES }) {
  return (
    <span className={`grid size-12 place-items-center rounded-2xl ${TILE_TONES[tone]}`}>
      <Icon name={icon} size={24} />
    </span>
  );
}

const DOTS = [
  "top-1 left-6 size-1.5 bg-brand",
  "top-7 -left-1 size-2.5 bg-saffron",
  "top-5 right-0 size-2 bg-accent-violet-fg",
  "bottom-12 right-[-14px] size-3 bg-brand",
  "bottom-9 -left-2 size-2 bg-danger",
  "bottom-1 right-6 size-1.5 bg-success",
];

const CELEBRATION_TONES = {
  teal: { ring: "bg-accent-teal-bg", core: "bg-accent-teal-fg" },
  green: { ring: "bg-accent-green-bg", core: "bg-success" },
};

export function Celebration({ icon, tone }: { icon: string; tone: keyof typeof CELEBRATION_TONES }) {
  const colors = CELEBRATION_TONES[tone];
  return (
    <span className="relative mx-auto grid size-[150px] shrink-0 place-items-center" aria-hidden="true">
      <span className={`grid size-[150px] place-items-center rounded-full ${colors.ring}`}>
        <span className={`grid size-[88px] place-items-center rounded-full text-on-action ${colors.core}`}>
          <Icon name={icon} size={40} />
        </span>
      </span>
      {DOTS.map((dot) => (
        <span key={dot} className={`absolute rounded-full ${dot}`} />
      ))}
    </span>
  );
}
