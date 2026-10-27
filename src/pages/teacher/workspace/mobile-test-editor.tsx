import { Fragment, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  QuestionAnswerInput,
  QuestionPrompt,
  draftToStudentQuestion,
  type GroupDraft,
  type KeyFactory,
  type QuestionDraft,
} from "@/modules/quiz";
import type { QuizAnswerValue, QuizGroup } from "@/shared/types";
import { Icon } from "@/shared/ui/icon";
import { MobileActionBar, MobileWarningNote, mobileButton, mobileRoundButton } from "@/shared/ui/mobile-page";
import { Switch } from "@/shared/ui/switch";
import { MobileQuestionCard } from "./mobile-question-card";

export interface MobileTestEditorProps {
  title: string;
  drafts: QuestionDraft[];
  groups: GroupDraft[];
  savedGroups: QuizGroup[];
  locked: boolean;
  wizard: boolean;
  newKey: KeyFactory;
  saving: boolean;
  uploadingAudio: boolean;
  onPatch: (key: string, apply: (draft: QuestionDraft) => QuestionDraft) => void;
  onRemove: (key: string) => void;
  onAddQuestion: () => void;
  onRemoveGroup: (key: string) => void;
  onUploadAudio: (groupId: string, file: File) => void;
  onRemoveAudio: (groupId: string) => void;
  onClose: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
}

type Tab = "edit" | "preview";

export function MobileTestEditor(props: MobileTestEditorProps) {
  const { t } = useTranslation("quiz");
  const { title, drafts, groups, savedGroups, locked, wizard, newKey, saving } = props;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<Tab>("edit");
  const [visible, setVisible] = useState<number | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, QuizAnswerValue>>({});

  function trackScroll() {
    const element = scrollRef.current;
    if (!element || wizard || tab !== "edit") return;
    if (element.scrollTop < 56) {
      setVisible(null);
      return;
    }
    const top = element.getBoundingClientRect().top + 8;
    const cards = [...element.querySelectorAll<HTMLElement>("[data-question-index]")];
    const current = cards.find((card) => card.getBoundingClientRect().bottom > top);
    setVisible(current ? Number(current.dataset.questionIndex) : null);
  }

  const heading = wizard
    ? t("editor.mobile.wizardTitle")
    : visible === null || tab === "preview"
      ? title
      : t("editor.mobile.counter", { current: visible + 1, total: drafts.length });

  const previewDraft = drafts[Math.min(previewIndex, drafts.length - 1)] ?? null;
  const previewPosition = previewDraft ? drafts.indexOf(previewDraft) : 0;

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas bg-auth-gradient font-body text-ink">
      <header className={`flex h-11 shrink-0 items-center gap-3 px-4 box-content ${wizard ? "pt-5.5" : "pt-5"}`}>
          <button
            type="button"
            className={mobileRoundButton}
            aria-label={t("editor.back")}
            onClick={props.onClose}
          >
            <Icon name={wizard ? "chevron-left" : "close"} size={22} />
          </button>
          <h1 className="min-w-0 flex-1 truncate text-center text-title-lg font-semibold">{heading}</h1>
          {wizard ? (
            <button
              type="button"
              className={mobileRoundButton}
              aria-label={t("editor.addQuestion")}
              disabled={locked}
              onClick={props.onAddQuestion}
            >
              <Icon name="quiz" size={22} />
            </button>
          ) : (
            <span className="size-11 shrink-0" aria-hidden="true" />
          )}
      </header>

      <div
        ref={scrollRef}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-6 [&>*]:shrink-0"
        onScroll={trackScroll}
      >
        {wizard ? (
          <span className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full bg-subtle" aria-hidden="true">
            <i className="block h-full w-[56%] rounded-full bg-brand" />
          </span>
        ) : (
          <div className="mt-4 grid h-11 grid-cols-2 rounded-full bg-subtle p-1" role="tablist">
            {(["edit", "preview"] as const).map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={tab === item}
                className={`rounded-full text-body-sm font-medium transition-colors ${
                  tab === item ? "bg-surface text-ink shadow-sm" : "text-ink-secondary"
                }`}
                onClick={() => setTab(item)}
              >
                {t(`editor.mobile.tabs.${item}`)}
              </button>
            ))}
          </div>
        )}

        {tab === "edit" ? (
          <div className={`mt-4 flex flex-col ${wizard ? "gap-4" : "gap-3"}`}>
            {locked ? <MobileWarningNote>{t("editor.lockedNotice")}</MobileWarningNote> : null}

            {drafts.map((draft, index) => {
              const group =
                draft.groupKey && drafts[index - 1]?.groupKey !== draft.groupKey
                  ? groups.find((item) => item.key === draft.groupKey)
                  : null;
              return (
                <Fragment key={draft.key}>
                  {group ? (
                    <GroupCard
                      group={group}
                      saved={savedGroups.find((item) => item.id === group.id) ?? null}
                      locked={locked}
                      uploading={props.uploadingAudio}
                      onRemove={() => props.onRemoveGroup(group.key)}
                      onUpload={(file) => group.id && props.onUploadAudio(group.id, file)}
                      onRemoveAudio={() => group.id && props.onRemoveAudio(group.id)}
                    />
                  ) : null}
                  <MobileQuestionCard
                    draft={draft}
                    index={index}
                    locked={locked}
                    newKey={newKey}
                    onChange={(apply) => props.onPatch(draft.key, apply)}
                    onRemove={() => props.onRemove(draft.key)}
                  />
                </Fragment>
              );
            })}

            {!locked ? (
              <button
                type="button"
                className="flex h-13 items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed border-brand text-title text-brand transition-colors hover:bg-brand-subtle"
                onClick={props.onAddQuestion}
              >
                <Icon name="add" size={20} />
                {t("editor.addQuestion")}
              </button>
            ) : null}
          </div>
        ) : (
          <section className="mt-3.5 flex flex-col rounded-xl border-[1.5px] border-dashed border-brand bg-surface px-4 pt-3.5 pb-4">
            <span className="text-caption-strong text-ink-secondary uppercase">{t("editor.previewTitle")}</span>
            <p className="mt-2 text-body-sm text-ink-secondary">{t("editor.mobile.previewHint")}</p>
            {previewDraft ? (
              <>
                <div className="mt-3 flex h-5 items-center gap-3">
                  <small className="shrink-0 text-body-sm font-medium text-ink">
                    {t("editor.previewCounter", { current: previewPosition + 1, total: drafts.length })}
                  </small>
                  <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-subtle">
                    <i
                      className="block h-full rounded-full bg-brand"
                      style={{ width: `${((previewPosition + 1) / Math.max(drafts.length, 1)) * 100}%` }}
                    />
                  </span>
                  <span className="-my-2 flex shrink-0">
                    <button
                      type="button"
                      className="grid size-7 place-items-center rounded-full text-brand disabled:text-ink-tertiary"
                      aria-label={t("editor.mobile.previous")}
                      disabled={previewPosition === 0}
                      onClick={() => setPreviewIndex(previewPosition - 1)}
                    >
                      <Icon name="chevron-left" size={18} />
                    </button>
                    <button
                      type="button"
                      className="grid size-7 place-items-center rounded-full text-brand disabled:text-ink-tertiary"
                      aria-label={t("editor.mobile.next")}
                      disabled={previewPosition >= drafts.length - 1}
                      onClick={() => setPreviewIndex(previewPosition + 1)}
                    >
                      <Icon name="chevron-right" size={18} />
                    </button>
                  </span>
                </div>
                <div className="mt-3.5 flex flex-col">
                  {CHOICE_TYPES.has(previewDraft.type) ? (
                    <PreviewChoices draft={previewDraft} />
                  ) : (
                    <div className="flex flex-col gap-3">
                      <QuestionPrompt question={draftToStudentQuestion(previewDraft, previewPosition)} />
                      <QuestionAnswerInput
                        question={draftToStudentQuestion(previewDraft, previewPosition)}
                        number={previewPosition + 1}
                        value={answers[previewDraft.key]}
                        onChange={(value) => setAnswers((current) => ({ ...current, [previewDraft.key]: value }))}
                      />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p className="mt-3 text-body-sm text-ink-tertiary">{t("editor.previewEmpty")}</p>
            )}
          </section>
        )}
      </div>

      <MobileActionBar>
        <button
          type="button"
          className={`${mobileButton.secondary} ${wizard ? "flex-none" : ""}`}
          disabled={saving}
          onClick={props.onSaveDraft}
        >
          {t("editor.saveDraft")}
        </button>
        <button type="button" className={mobileButton.primary} disabled={saving} onClick={props.onPublish}>
          <Icon name="send" size={20} />
          {t("editor.publish")}
        </button>
      </MobileActionBar>
    </div>
  );
}

const CHOICE_TYPES = new Set(["single", "multiple", "true_false"]);

function PreviewChoices({ draft }: { draft: QuestionDraft }) {
  const { t } = useTranslation("quiz");
  const [picked, setPicked] = useState<string[]>([]);
  const options =
    draft.type === "true_false"
      ? [
          { key: "true", text: t("editor.mobile.yes") },
          { key: "false", text: t("editor.mobile.no") },
        ]
      : draft.options;

  return (
    <>
      <strong className="text-title text-ink">{draft.text || t("editor.noText")}</strong>
      <div className="mt-[15px] flex flex-col gap-3">
        {options.map((option, index) => {
          const selected = picked.includes(option.key);
          return (
            <button
              key={option.key}
              type="button"
              aria-pressed={selected}
              className={`flex h-13 items-center gap-3 rounded-lg px-3.5 text-left transition-colors ${
                selected ? "border-[1.5px] border-brand bg-brand-subtle" : "border border-line bg-surface"
              }`}
              onClick={() =>
                setPicked((current) =>
                  draft.type === "multiple"
                    ? current.includes(option.key)
                      ? current.filter((item) => item !== option.key)
                      : [...current, option.key]
                    : [option.key]
                )
              }
            >
              <span
                className={`grid size-7 shrink-0 place-items-center rounded-full text-caption-strong ${
                  selected ? "bg-brand text-on-action" : "bg-subtle text-ink-secondary"
                }`}
              >
                {String.fromCharCode(65 + index)}
              </span>
              <span className="min-w-0 flex-1 truncate text-body text-ink">{option.text}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function GroupCard({
  group,
  saved,
  locked,
  uploading,
  onRemove,
  onUpload,
  onRemoveAudio,
}: {
  group: GroupDraft;
  saved: QuizGroup | null;
  locked: boolean;
  uploading: boolean;
  onRemove: () => void;
  onUpload: (file: File) => void;
  onRemoveAudio: () => void;
}) {
  const { t } = useTranslation("quiz");
  const fileRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [showScript, setShowScript] = useState(false);
  const audioUrl = saved?.audioUrl ?? null;
  const fileName = audioUrl ? decodeURIComponent(audioUrl.split("/").pop()?.split("?")[0] ?? "") : "";

  return (
    <section className="flex flex-col rounded-xl border-[1.5px] border-brand bg-surface px-4 pt-4 pb-4">
      <div className="flex h-11 items-center gap-2.5">
        <Icon name="folder" size={20} className="shrink-0 text-brand" />
        <strong className="min-w-0 flex-1 truncate text-title-sm text-ink">
          {t("editor.mobile.group", { title: group.title || t("groups.title") })}
        </strong>
        <button
          type="button"
          className="grid size-8 shrink-0 place-items-center rounded-full text-icon-secondary transition-colors hover:bg-subtle"
          aria-label={t("groups.removeAria")}
          disabled={locked}
          onClick={onRemove}
        >
          <Icon name="trash" size={20} />
        </button>
      </div>

      {audioUrl ? (
        <div className="mt-3 flex h-16 items-center gap-3 rounded-lg bg-subtle px-3">
          <audio
            ref={audioRef}
            src={audioUrl}
            preload="metadata"
            onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
            onEnded={() => setPlaying(false)}
          />
          <button
            type="button"
            className="grid size-9 shrink-0 place-items-center rounded-md bg-brand text-on-action"
            aria-label={playing ? t("groups.audioPause") : t("groups.audioPlay")}
            onClick={() => {
              const element = audioRef.current;
              if (!element) return;
              if (playing) element.pause();
              else void element.play();
              setPlaying(!playing);
            }}
          >
            <Icon name={playing ? "pause" : "play-fill"} size={20} />
          </button>
          <span className="flex min-w-0 flex-1 flex-col">
            <strong className="truncate text-title-sm text-ink">{fileName}</strong>
            <small className="truncate text-caption font-normal text-ink-secondary">
              {Number.isFinite(duration) && duration > 0
                ? `${Math.floor(duration / 60)}:${String(Math.floor(duration % 60)).padStart(2, "0")}`
                : "—"}
            </small>
          </span>
          <button
            type="button"
            className="grid size-8 shrink-0 place-items-center rounded-full text-icon-secondary transition-colors hover:bg-muted"
            aria-label={t("groups.removeAudio")}
            disabled={locked}
            onClick={onRemoveAudio}
          >
            <Icon name="close" size={20} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="mt-3 flex h-16 items-center justify-center gap-2 rounded-lg border-[1.5px] border-dashed border-brand text-title-sm text-brand disabled:opacity-50"
          disabled={locked || uploading || !group.id}
          onClick={() => fileRef.current?.click()}
        >
          <Icon name="upload" size={20} />
          {group.id ? t("groups.uploadAudio") : t("groups.audioAfterSave")}
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept=".mp3,.m4a,.aac,.ogg,.wav,audio/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onUpload(file);
          event.target.value = "";
        }}
      />

      <label className="mt-3.5 flex items-center gap-3">
        <span className="min-w-0 flex-1 text-body-sm text-ink">{t("groups.transcriptToggle")}</span>
        <Switch size="lg" checked={showScript} onCheckedChange={setShowScript} aria-label={t("groups.transcriptToggle")} />
      </label>
      {showScript ? (
        <p className="mt-2.5 rounded-lg bg-subtle px-3 py-2.5 text-body-sm whitespace-pre-wrap text-ink-secondary">
          {saved?.transcript || t("editor.mobile.noTranscript")}
        </p>
      ) : null}
      <small className="mt-4.5 text-caption font-normal text-ink-secondary">{t("editor.mobile.audioHint")}</small>
    </section>
  );
}
