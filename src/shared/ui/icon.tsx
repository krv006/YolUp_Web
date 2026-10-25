import { useMemo, type CSSProperties } from "react";

const SOURCES = import.meta.glob("@/shared/assets/icons/*.svg", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

interface IconSource {
  body: string;
  viewBox: string;
}

const ICONS: Record<string, IconSource> = Object.fromEntries(
  Object.entries(SOURCES).map(([path, source]) => [
    path.split("/").pop()?.replace(".svg", "") ?? path,
    normalize(source),
  ])
);

function normalize(source: string): IconSource {
  const viewBox = /viewBox="([^"]+)"/.exec(source)?.[1] ?? "0 0 24 24";
  const body = source
    .replace(/<\?xml[^>]*\?>/g, "")
    .replace(/<svg[^>]*>/, "")
    .replace(/<\/svg>/, "")
    .replace(/<metadata>[\s\S]*?<\/metadata>/g, "")
    .replace(/fill="(?!none)[^"]*"/g, 'fill="currentColor"')
    .replace(/stroke="(?!none)[^"]*"/g, 'stroke="currentColor"')
    .trim();
  return { body, viewBox };
}

export type IconName = keyof typeof ICONS & string;

export const ICON_NAMES = Object.keys(ICONS).sort();

export interface IconProps {
  name: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
  title?: string;
}

export function Icon({ name, size = 24, className, style, title }: IconProps) {
  const icon = useMemo(() => ICONS[name], [name]);
  if (!icon) return null;

  return (
    <svg
      width={size}
      height={size}
      viewBox={icon.viewBox}
      fill="currentColor"
      className={className}
      style={style}
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
      dangerouslySetInnerHTML={{ __html: title ? `<title>${title}</title>${icon.body}` : icon.body }}
    />
  );
}
