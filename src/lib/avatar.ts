/** Public avatar service (no copyrighted assets bundled). Uses name so renamed/offline UUIDs still resolve sensibly. */
export function avatarUrl(nameOrUuid: string, size = 64): string {
  return `https://mc-heads.net/avatar/${encodeURIComponent(nameOrUuid)}/${size}`;
}
export function bodyUrl(nameOrUuid: string, size = 180): string {
  return `https://mc-heads.net/body/${encodeURIComponent(nameOrUuid)}/${size}`;
}
