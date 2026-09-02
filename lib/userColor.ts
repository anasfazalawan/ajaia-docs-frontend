// Deterministic color per user id so the same person's cursor is the
// same color across sessions, without persisting a color anywhere.
const PALETTE = ['#f97316', '#22c55e', '#3b82f6', '#ec4899', '#a855f7', '#14b8a6', '#eab308'];

export function colorForUserId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}
