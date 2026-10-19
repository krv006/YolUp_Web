import { HomeworkWorkspace, useAssignmentCreateStore } from "@/widgets/homework-workspace";

export function AssignmentsPage() {
  const open = useAssignmentCreateStore((state) => state.open);
  const setOpen = useAssignmentCreateStore((state) => state.setOpen);

  return <HomeworkWorkspace createOpen={open} onCreateOpenChange={setOpen} />;
}
