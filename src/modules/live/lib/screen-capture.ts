export function requestScreenCapture(): Promise<MediaStream> {
  return navigator.mediaDevices.getDisplayMedia({
    video: { frameRate: 15, displaySurface: "browser" },
    audio: true,
    systemAudio: "include",
    selfBrowserSurface: "exclude",
  } as DisplayMediaStreamOptions & {
    selfBrowserSurface?: "include" | "exclude";
    systemAudio?: "include" | "exclude";
  });
}

export function hasLiveVideo(stream: MediaStream | null | undefined): boolean {
  return Boolean(stream?.getVideoTracks().some((track) => track.readyState === "live"));
}
