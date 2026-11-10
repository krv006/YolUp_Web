export const DISPLAY_CAPTURE_OPTIONS = {
  selfBrowserSurface: "exclude",
  surfaceSwitching: "include",
  systemAudio: "include",
  monitorTypeSurfaces: "include",
} as const;

export function requestScreenCapture(): Promise<MediaStream> {
  return navigator.mediaDevices.getDisplayMedia({
    video: { frameRate: 15, displaySurface: "browser" },
    audio: true,
    ...DISPLAY_CAPTURE_OPTIONS,
  } as DisplayMediaStreamOptions & typeof DISPLAY_CAPTURE_OPTIONS);
}

export function hasLiveVideo(stream: MediaStream | null | undefined): boolean {
  return Boolean(stream?.getVideoTracks().some((track) => track.readyState === "live"));
}
