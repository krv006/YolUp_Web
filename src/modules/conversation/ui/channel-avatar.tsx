import { Icon } from "@/shared/ui/icon";

export interface ChannelAvatarProps {
  src?: string | null;
  className?: string;
  iconSize?: number;
}

export function ChannelAvatar({ src, className = "size-12 rounded-lg", iconSize = 24 }: ChannelAvatarProps) {
  if (src) return <img src={src} alt="" className={`shrink-0 bg-subtle object-cover ${className}`} />;
  return (
    <span className={`grid shrink-0 place-items-center bg-brand-subtle text-brand ${className}`}>
      <Icon name="campaign" size={iconSize} />
    </span>
  );
}
