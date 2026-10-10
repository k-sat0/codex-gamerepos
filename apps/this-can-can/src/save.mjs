import { sanitizeState } from './engine.mjs';
export const SAVE_KEY = 'this-can-can-save-v1';
export function readSave(storage, reducedMotion = false) {
  try {
    const raw = JSON.parse(storage.getItem(SAVE_KEY));
    return { state: sanitizeState(raw, reducedMotion), exists: !!raw && raw.version === 1, available: true };
  } catch { return { state: sanitizeState(null, reducedMotion), exists: false, available: false }; }
}
export function writeSave(storage, state) {
  try { storage.setItem(SAVE_KEY, JSON.stringify(state)); return true; } catch { return false; }
}
export function removeSave(storage) { try { storage.removeItem(SAVE_KEY); return true; } catch { return false; } }
