/* eslint-disable react-refresh/only-export-components */
import type { ComponentProps, ReactNode } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

export const Dropdown = DropdownMenu.Root;
export const DropdownTrigger = DropdownMenu.Trigger;

export function DropdownContent({
  children,
  align = "end",
  className = "",
  sideOffset = 8,
  alignOffset = 0,
}: {
  children: ReactNode;
  align?: "start" | "center" | "end";
  className?: string;
  sideOffset?: number;
  alignOffset?: number;
}) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        className={`dropdown-content ${className}`}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
      >
        {children}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  );
}

export function DropdownItem({
  children,
  destructive = false,
  ...props
}: ComponentProps<typeof DropdownMenu.Item> & { destructive?: boolean }) {
  return (
    <DropdownMenu.Item className={`dropdown-item ${destructive ? "destructive" : ""}`} {...props}>
      {children}
    </DropdownMenu.Item>
  );
}
