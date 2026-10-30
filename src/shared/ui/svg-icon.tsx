import type { CSSProperties } from "react";

export interface SvgIconSource {
  body: string;
  viewBox: string;
}

export function normalizeSvg(source: string): SvgIconSource {
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

export interface SvgIconProps {
  icon: SvgIconSource;
  size?: number;
  className?: string;
  style?: CSSProperties;
  title?: string;
}

export function SvgIcon({ icon, size = 24, className, style, title }: SvgIconProps) {
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
