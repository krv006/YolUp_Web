import type { AssignTarget } from "@/modules/homework";

export interface GroupPick {
  excluded: ReadonlySet<string>;
  studentIds: readonly string[];
}

export type GroupPicks = ReadonlyMap<string, GroupPick>;

export function targetOf(courseId: string, pick: GroupPick): AssignTarget {
  return {
    courseId,
    studentIds: pick.excluded.size ? pick.studentIds.filter((id) => !pick.excluded.has(id)) : null,
  };
}

export function targetsOf(picks: GroupPicks): AssignTarget[] {
  return [...picks].map(([courseId, pick]) => targetOf(courseId, pick));
}

export function hasEmptyTarget(targets: readonly AssignTarget[]): boolean {
  return !targets.length || targets.some((target) => target.studentIds !== null && !target.studentIds.length);
}
