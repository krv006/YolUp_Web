export interface ScheduleFeedItemDto {
  type: "lesson" | "quiz";
  id: string | number;
  title?: string | null;
  course?: string | number | null;
  course_title?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  status?: string | null;
}

export interface ScheduleFeedDto {
  results?: ScheduleFeedItemDto[] | null;
}

export interface ScheduleQuizItem {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  startsAt: string;
  endsAt: string | null;
}

export function mapScheduleQuizItems(dto: ScheduleFeedDto): ScheduleQuizItem[] {
  return (dto.results ?? []).flatMap((item) =>
    item.type === "quiz" && item.starts_at
      ? [
          {
            id: String(item.id),
            courseId: item.course == null ? "" : String(item.course),
            courseTitle: item.course_title ?? "",
            title: item.title ?? "",
            startsAt: item.starts_at,
            endsAt: item.ends_at ?? null,
          },
        ]
      : []
  );
}
