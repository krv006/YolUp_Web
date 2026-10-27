import { useQuery } from "@tanstack/react-query";
import { homeworkApi } from "@/modules/homework";
import { Icon } from "@/shared/ui/icon";

const IMAGE_FILE = /\.(png|jpe?g|webp|gif|heic)$/i;

export function SubmissionPreview({ id, fileName }: { id: string; fileName: string }) {
  const isImage = IMAGE_FILE.test(fileName);
  const file = useQuery({
    queryKey: ["homework", "submission-file", id],
    queryFn: async ({ signal }) => {
      const blob = await homeworkApi.downloadSubmission(id, { signal });
      return blob instanceof Blob ? URL.createObjectURL(blob) : null;
    },
    enabled: isImage,
    staleTime: Infinity,
  });

  if (isImage && file.data) return <img src={file.data} alt={fileName} className="size-full object-contain" />;

  return (
    <span className="flex flex-col items-center gap-2 px-6 text-center">
      <Icon name="image" size={32} className="text-icon-tertiary" />
      <small className="max-w-full truncate text-body-sm text-ink-secondary">{fileName}</small>
    </span>
  );
}
