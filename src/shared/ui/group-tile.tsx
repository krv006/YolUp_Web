const TONES: Record<string, string> = {
  violet: "bg-accent-violet-bg text-accent-violet-fg",
  blue: "bg-accent-blue-bg text-accent-blue-fg",
  emerald: "bg-accent-green-bg text-accent-green-fg",
  amber: "bg-accent-saffron-bg text-accent-saffron-fg",
  rose: "bg-accent-red-bg text-accent-red-fg",
};

const SIZES: Record<"sm" | "md", string> = {
  sm: "size-8 rounded-lg text-caption-strong",
  md: "size-10 rounded-xl text-title-sm",
};

export interface GroupTileProps {
  name: string;
  tone?: string;
  size?: "sm" | "md";
  className?: string;
  /** Guruh rasmi (backenddan kelgan `avatar`). */
  src?: string | null;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "—";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function GroupTile({
  name,
  tone = "blue",
  size = "md",
  className = "",
  src,
}: GroupTileProps) {
  if (src)
    return (
      <img
        className={`shrink-0 object-cover ${SIZES[size]} ${className}`}
        src={src}
        alt=""
        loading="lazy"
      />
    );

  return (
    <span
      className={`grid shrink-0 place-items-center font-heading ${SIZES[size]} ${
        TONES[tone] ?? TONES.blue
      } ${className}`}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
