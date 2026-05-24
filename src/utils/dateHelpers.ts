/**
 * Parses a Brazilian formatted date string "DD/MM/YYYY" to a Date object.
 */
export function parseBoletoData(vencimentoStr: string): Date | null {
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
 * Calculates the number of days between the due date and today.
 * Positive value means overdue, negative means future.
 */
export function getDiasAtraso(vencimentoStr: string): number {
  const dueDate = parseBoletoData(vencimentoStr);
  if (!dueDate) return 0;
  
  const today = new Date();
  // Clear time for date-only comparison
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  
  const diffTime = today.getTime() - dueDate.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Checks if a boleto is expired (more than 30 days past due date).
 * Unpaid boletos only (status ABERTO or VENCIDO).
 */
export function isBoletoExpired(vencimentoStr: string, status: string): boolean {
  if (status === 'PAGO' || status === 'NEGOCIADO') return false;
  return getDiasAtraso(vencimentoStr) > 30;
}
