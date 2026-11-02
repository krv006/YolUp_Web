import { parentLogins, type LoginEntry } from "@/modules/parent";

export function kindIcon(entry: LoginEntry): string {
  return parentLogins.deviceKind(entry.userAgent) === "computer" ? "laptop" : "smartphone";
}
