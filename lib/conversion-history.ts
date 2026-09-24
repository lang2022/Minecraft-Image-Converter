export type ConversionHistoryEntry = {
  id: string;
  fileName: string;
  size: number;
  dithering: boolean;
  excludedCategories?: string[];
  timestamp: number;
  width: number;
  height: number;
  blockIds: string[];
  materialList: Array<{ id: string; name: string; count: number }>;
};

const STORAGE_KEY = 'mc-converter-history-v1';
const MAX_ENTRIES = 5;

export function loadConversionHistory(): ConversionHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is ConversionHistoryEntry =>
        entry && typeof entry.id === 'string' && Array.isArray(entry.blockIds) && Array.isArray(entry.materialList),
    );
  } catch {
    return [];
  }
}

export function saveConversionToHistory(entry: Omit<ConversionHistoryEntry, 'id' | 'timestamp'>): ConversionHistoryEntry[] {
  const next: ConversionHistoryEntry[] = [
    { ...entry, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, timestamp: Date.now() },
    ...loadConversionHistory(),
  ].slice(0, MAX_ENTRIES);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or unavailable — history is best-effort, never break conversion.
  }
  return next;
}

export function removeConversionFromHistory(id: string): ConversionHistoryEntry[] {
  const next = loadConversionHistory().filter((entry) => entry.id !== id);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Best-effort.
  }
  return next;
}
