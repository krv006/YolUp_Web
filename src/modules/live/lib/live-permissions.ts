export const CAMERA_SOURCE = 1;
export const MICROPHONE_SOURCE = 2;
export const SCREEN_SHARE_SOURCE = 3;

interface PublishPermissions {
  canPublish: boolean;
  canPublishSources: number[];
}

export function canPublishSource(
  permissions: PublishPermissions | null | undefined,
  source: number
): boolean {
  if (!permissions?.canPublish) return false;
  return !permissions.canPublishSources.length || permissions.canPublishSources.includes(source);
}

const IDENTITY_PREFIX = "user-";

export function identityUserId(identity: string): string {
  return identity.startsWith(IDENTITY_PREFIX) ? identity.slice(IDENTITY_PREFIX.length) : identity;
}
