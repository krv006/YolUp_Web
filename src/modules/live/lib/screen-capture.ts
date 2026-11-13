export const DISPLAY_CAPTURE_OPTIONS = {
  selfBrowserSurface: "exclude",
  surfaceSwitching: "include",
  systemAudio: "include",
  monitorTypeSurfaces: "include",
} as const;

export const SCREEN_SHARE_RESOLUTION = { width: 1280, height: 720, frameRate: 15 } as const;

export const SCREEN_SHARE_PUBLISH = {
  simulcast: false,
  screenShareEncoding: { maxBitrate: 1_500_000, maxFramerate: 15 },
} as const;

export function requestScreenCapture(): Promise<MediaStream> {
  return navigator.mediaDevices.getDisplayMedia({
    video: {
      width: { max: SCREEN_SHARE_RESOLUTION.width },
      height: { max: SCREEN_SHARE_RESOLUTION.height },
      frameRate: { ideal: SCREEN_SHARE_RESOLUTION.frameRate, max: SCREEN_SHARE_RESOLUTION.frameRate },
      displaySurface: "browser",
    },
    audio: true,
    ...DISPLAY_CAPTURE_OPTIONS,
  } as DisplayMediaStreamOptions & typeof DISPLAY_CAPTURE_OPTIONS);
}

export function hasLiveVideo(stream: MediaStream | null | undefined): boolean {
  return Boolean(stream?.getVideoTracks().some((track) => track.readyState === "live"));
}
