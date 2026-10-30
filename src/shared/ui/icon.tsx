import type { CSSProperties } from "react";
import { normalizeSvg, SvgIcon, type SvgIconSource } from "./svg-icon";

const SOURCES = import.meta.glob("@/shared/assets/icons/*.svg", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const ICONS: Record<string, SvgIconSource> = Object.fromEntries(
  Object.entries(SOURCES).map(([path, source]) => [
    path.split("/").pop()?.replace(".svg", "") ?? path,
    normalizeSvg(source),
  ])
);

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
  const icon = ICONS[name];
  if (!icon) return null;
  return <SvgIcon icon={icon} size={size} className={className} style={style} title={title} />;
}
