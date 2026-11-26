export const ayahTapActions = ['translation', 'information', 'adjacent', 'generate'] as const;
export type AyahTapAction = typeof ayahTapActions[number];
export function validAyahTapAction(value: unknown): value is AyahTapAction {
  return ayahTapActions.some(action => action === value);
}
export function initialAyahTapAction(): AyahTapAction {
  try {
    const saved = localStorage.getItem('ayahvault-ayah-tap-action');
    if (validAyahTapAction(saved)) return saved;
  } catch { /* The preference still works for this visit. */ }
  return 'translation';
}
