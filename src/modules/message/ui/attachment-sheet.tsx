import { useRef, type ComponentType } from "react";
import { useTranslation } from "react-i18next";
import { Drawer, DrawerContent, DrawerTitle } from "@/shared/ui/drawer";
import { Camera, ClipboardList, FolderClosed, Image } from "lucide-react";

const DOCUMENT_TYPES =
  ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,application/pdf";

export interface AttachmentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (files: FileList | null) => void;
  onAssignment?: () => void;
  maxSizeMb: number;
}

export function AttachmentSheet({
  open,
  onOpenChange,
  onPick,
  onAssignment,
  maxSizeMb,
}: AttachmentSheetProps) {
  const { t } = useTranslation("chat");
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const documentRef = useRef<HTMLInputElement>(null);

  function handleTile(id: string) {
    if (id === "gallery") galleryRef.current?.click();
    if (id === "camera") cameraRef.current?.click();
    if (id === "document") documentRef.current?.click();
    if (id === "assignment") {
      onOpenChange(false);
      onAssignment?.();
    }
  }

  const tiles: Array<{
    id: string;
    label: string;
    icon: ComponentType<{ size?: number }>;
    tone: string;
  }> = [
    { id: "gallery", label: t("attach.gallery"), icon: Image, tone: "bg-action text-on-action" },
    { id: "camera", label: t("attach.camera"), icon: Camera, tone: "bg-success text-white" },
    {
      id: "document",
      label: t("attach.document"),
      icon: FolderClosed,
      tone: "bg-saffron-strong text-white",
    },
    ...(onAssignment
      ? [
          {
            id: "assignment",
            label: t("attach.assignment"),
            icon: ClipboardList,
            tone: "bg-error text-white",
          },
        ]
      : []),
  ];

  function pick(files: FileList | null) {
    onOpenChange(false);
    onPick(files);
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="px-5 pb-7">
        <DrawerTitle className="px-1 pt-2 font-heading text-h3 text-ink">
          {t("attach.title")}
        </DrawerTitle>
        <p className="px-1 pb-4 text-body-sm text-ink-secondary">
          {t("attach.sizeHint", { size: maxSizeMb })}
        </p>

        <div className="grid grid-cols-4 gap-3 pb-2">
          {tiles.map((tile) => (
            <button
              key={tile.id}
              type="button"
              className="flex flex-col items-center gap-2"
              onClick={() => handleTile(tile.id)}
            >
              <span className={`grid size-14 place-items-center rounded-2xl ${tile.tone}`}>
                <tile.icon size={24} />
              </span>
              <small className="text-caption text-ink-secondary">{tile.label}</small>
            </button>
          ))}
        </div>

        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(event) => {
            pick(event.target.files);
            event.target.value = "";
          }}
        />
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(event) => {
            pick(event.target.files);
            event.target.value = "";
          }}
        />
        <input
          ref={documentRef}
          type="file"
          accept={DOCUMENT_TYPES}
          multiple
          hidden
          onChange={(event) => {
            pick(event.target.files);
            event.target.value = "";
          }}
        />
      </DrawerContent>
    </Drawer>
  );
}
