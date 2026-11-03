import type { ParentChild } from "@/modules/parent";
import { Avatar } from "@/shared/ui/legacy";

const SIZES = { md: "[&_.avatar]:size-14", sm: "[&_.avatar]:size-13", xl: "[&_.avatar]:size-22", lg: "[&_.avatar]:size-20" };

export function ChildAvatar({ child, size = "md" }: { child: ParentChild; size?: keyof typeof SIZES }) {
  return (
    <span className="relative shrink-0">
      <Avatar name={child.name} src={child.avatarUrl ?? undefined} tone={child.avatarTone} size={size === "xl" || size === "lg" ? "xl" : "md"} className={SIZES[size]} />
      {child.isOnline ? (
        <span className={`absolute rounded-full border-[3px] border-surface bg-success ${size === "xl" || size === "lg" ? "right-1 bottom-1 size-5" : "right-0 bottom-0 size-4"}`} />
      ) : null}
    </span>
  );
}
