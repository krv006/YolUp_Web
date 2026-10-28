export interface CourseLook {
  tone?: string;
  image?: string | null;
  students: number;
  teacher: string;
}

export interface LessonTone {
  bar: string;
  surface: string;
  text: string;
  chip: string;
}

const TONES: LessonTone[] = [
  { bar: "bg-brand", surface: "bg-brand-subtle", text: "text-ink", chip: "bg-brand" },
  { bar: "bg-danger", surface: "bg-danger-bg", text: "text-ink", chip: "bg-danger" },
  { bar: "bg-success", surface: "bg-accent-green-bg", text: "text-ink", chip: "bg-success" },
  { bar: "bg-warning", surface: "bg-warning-bg", text: "text-ink", chip: "bg-warning" },
  {
    bar: "bg-accent-violet-fg",
    surface: "bg-accent-violet-bg",
    text: "text-ink",
    chip: "bg-accent-violet-fg",
  },
  { bar: "bg-ink-tertiary", surface: "bg-subtle", text: "text-ink", chip: "bg-ink-tertiary" },
];

export function lessonTone(courseId: string): LessonTone {
  let sum = 0;
  for (let index = 0; index < courseId.length; index += 1) sum += courseId.charCodeAt(index);
  return TONES[sum % TONES.length];
}
