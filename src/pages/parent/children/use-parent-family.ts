import { useState } from "react";
import {
  useChildrenSummary,
  useParentLinks,
  useSelectedChild,
  type ChildPeriodSummary,
  type ChildrenSummaryDto,
  type FamilyPeriod,
  type ParentChild,
} from "@/modules/parent";

export interface FamilyChild {
  child: ParentChild;
  loading: boolean;
  restricted: boolean;
  groups: number | null;
  attendance: number | null;
  attended: number;
  score: number | null;
  lastVisit: { course: string; at: string } | null;
  period: ChildPeriodSummary;
}

function toFamilyChild(child: ParentChild, row: ChildrenSummaryDto | undefined, loading: boolean): FamilyChild {
  return {
    child,
    loading,
    restricted: Boolean(row?.restricted),
    groups: row?.groups_count ?? child.coursesCount,
    attendance: row?.attendance?.month_percent ?? null,
    attended: row?.attendance?.attended_total ?? 0,
    score: row?.score.average ?? null,
    lastVisit: row?.last_visit ? { course: row.last_visit.course_title, at: row.last_visit.joined_at } : null,
    period: {
      attendance: row?.attendance?.period_percent ?? null,
      homework: { submitted: row?.homework.period_submitted ?? 0, total: row?.homework.period_total ?? 0 },
      score: row?.score.period_average ?? null,
    },
  };
}

export function useParentFamily(period: FamilyPeriod) {
  const [now] = useState(() => Date.now());
  const { children, childrenQuery, selectedChildId, selectChild } = useSelectedChild();
  const links = useParentLinks();
  const summary = useChildrenSummary(period, children.length > 0);
  const byId = new Map((summary.data ?? []).map((row) => [row.student_id, row]));
  const rows = children.map((child) => toFamilyChild(child, byId.get(child.id), summary.isLoading));
  const pending = (links.data ?? [])
    .filter((link) => link.status === "pending")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  function retry() {
    for (const query of [childrenQuery, links, summary]) void query.refetch();
  }

  return {
    now,
    loading: childrenQuery.isLoading || links.isLoading,
    failed: (childrenQuery.isError && !childrenQuery.data) || (links.isError && !links.data) || summary.isError,
    retry,
    rows,
    pending,
    selectedChildId,
    selectChild,
  };
}
