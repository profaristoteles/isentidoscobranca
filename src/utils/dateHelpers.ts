/**
 * Parses a Brazilian formatted date string "DD/MM/YYYY" to a Date object.
 */
export function parseVencimento(vencimentoStr: string): Date | null {
  if (!vencimentoStr) return null;
  const parts = vencimentoStr.split('/');
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed month
  const year = parseInt(parts[2], 10);

  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  return new Date(year, month, day);
}

/**
 * Formats a Date object to a Brazilian "DD/MM/YYYY" string.
 */
export function formatDateBR(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

/**
 * Calculates the number of days between the due date and today.
 * Positive value means overdue, negative means future.
 */
export function getDiasAtraso(vencimentoStr: string): number {
  const dueDate = parseVencimento(vencimentoStr);
  if (!dueDate) return 0;

  const today = new Date();
  // Clear time for date-only comparison
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - dueDate.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Returns true when a "DD/MM/YYYY" due date is strictly before today (date-only).
 */
export function isVencido(vencimentoStr: string): boolean {
  return getDiasAtraso(vencimentoStr) > 0;
}
