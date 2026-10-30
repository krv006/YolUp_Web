
export const MIC_TRACK = "microphone";

interface VideoGrant {
  canPublish?: boolean;
  canPublishSources?: string[];
}

function readVideoGrant(token: string | undefined): VideoGrant | null {
  const payload = token?.split(".")[1];
  if (!payload) return null;
  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")), (
      character
    ) => character.charCodeAt(0));
    const claims = JSON.parse(new TextDecoder().decode(bytes)) as { video?: VideoGrant };
    return claims.video ?? null;
  } catch {
    return null;
  }
}

export function tokenAllowsTrack(token: string | undefined, source: string): boolean {
  const grant = readVideoGrant(token);
  if (!grant) return true;
  if (grant.canPublish === false) return false;
  const sources = grant.canPublishSources;
  return !sources?.length || sources.includes(source);
}
