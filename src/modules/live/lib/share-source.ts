export type ShareSurface = "monitor" | "window" | "browser";

export interface ShareSourceInfo {
  surface: ShareSurface | null;
  name: string | null;
}

const INTERNAL_LABEL = /^(screen|window|web-contents-media-stream|tab):/i;

function surfaceFromLabel(label: string): ShareSurface | null {
  if (/^screen:/i.test(label)) return "monitor";
  if (/^window:/i.test(label)) return "window";
  if (/^(web-contents-media-stream|tab):/i.test(label)) return "browser";
  return null;
}

export function describeShareTrack(track: MediaStreamTrack | null | undefined): ShareSourceInfo {
  if (!track) return { surface: null, name: null };
  const settings = track.getSettings?.() as (MediaTrackSettings & { displaySurface?: string }) | undefined;
  const label = (track.label ?? "").trim();
  const raw = settings?.displaySurface ?? surfaceFromLabel(label);
  const surface = raw === "monitor" || raw === "window" || raw === "browser" ? raw : null;
  return { surface, name: label && !INTERNAL_LABEL.test(label) ? label : null };
}
