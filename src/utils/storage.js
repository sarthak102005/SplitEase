import { STORAGE_KEY, SCHEMA_VERSION } from '../constants';

const DEFAULT_STATE = {
  schemaVersion: SCHEMA_VERSION,
  expenses:      [],
  repayments:    [],
  settlements:   [],
  dismissedReminders: {},   // { [monthKey]: true }
};

function migrateIfNeeded(raw) {
  // Future migrations go here. For now just return as-is.
  return { ...DEFAULT_STATE, ...raw, schemaVersion: SCHEMA_VERSION };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_STATE };
    return migrateIfNeeded(parsed);
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state:', e);
  }
}

export function clearState() {
  localStorage.removeItem(STORAGE_KEY);
}
