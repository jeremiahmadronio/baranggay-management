/**
 * Kapitana blotter / lupon mock data.
 * - Dev: on by default (set VITE_KAPITANA_USE_MOCK=false to call real API).
 * - Prod: off unless VITE_KAPITANA_USE_MOCK=true.
 */
export function useKapitanaMockData(): boolean {
  const v = import.meta.env.VITE_KAPITANA_USE_MOCK;
  if (v === "false") return false;
  if (v === "true") return true;
  return Boolean(import.meta.env.DEV);
}
