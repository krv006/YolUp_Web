import { parentLogins, type LoginEntry } from "@/modules/parent";

export function kindIcon(entry: LoginEntry): string {
  return parentLogins.loginKind(entry) === "computer" ? "laptop" : "smartphone";
}
