import { ROOMMATE_IDS } from '../constants';

/**
 * Format paise (integer) as ₹XX.XX
 */
export function formatPaise(paise) {
  const abs = Math.abs(paise);
  const rupees = Math.floor(abs / 100);
  const p = abs % 100;
  const sign = paise < 0 ? '-' : '';
  return `${sign}₹${rupees.toLocaleString('en-IN')}.${String(p).padStart(2, '0')}`;
}

/**
 * Parse a rupee string like "100.50" into integer paise.
 * Returns NaN for invalid input.
 */
export function parseRupeesToPaise(str) {
  const trimmed = str.trim();
  if (!trimmed) return NaN;
  const n = parseFloat(trimmed);
  if (!isFinite(n) || n <= 0) return NaN;
  // Round to nearest paise
  return Math.round(n * 100);
}

/**
 * Split amountPaise equally among the given roommateIds (defaults to all 3).
 * Distributes remainder paise deterministically so shares always sum to total.
 *
 * Returns { [roommateId]: shareInPaise }  — non-participating roommates get 0.
 */
export function splitEqually(amountPaise, roommateIds = ROOMMATE_IDS) {
  const n = roommateIds.length;
  const base = Math.floor(amountPaise / n);
  const remainder = amountPaise % n;

  const result = {};
  // Zero out everyone first so callers can always read any roommate id
  ROOMMATE_IDS.forEach(id => { result[id] = 0; });
  roommateIds.forEach((id, i) => {
    result[id] = base + (i < remainder ? 1 : 0);
  });
  return result;
}

/**
 * Calculate net balances across all expenses + repayments.
 *
 * balance > 0  → they are owed money (creditor)
 * balance < 0  → they owe money    (debtor)
 *
 * @param {Array} expenses   – { id, amountPaise, paidByRoommateId }[]
 * @param {Array} repayments – { id, fromRoommateId, toRoommateId, amountPaise, status }[]
 * @returns {{ [roommateId]: number }}  all in paise
 */
export function computeBalances(expenses, repayments) {
  const balances = Object.fromEntries(ROOMMATE_IDS.map(id => [id, 0]));

  for (const exp of expenses) {
    // Use the expense's splitAmong list, falling back to all three for legacy expenses
    const participants = exp.splitAmong && exp.splitAmong.length > 0 ? exp.splitAmong : ROOMMATE_IDS;
    const shares = splitEqually(exp.amountPaise, participants);
    // Payer gets credit for full amount
    balances[exp.paidByRoommateId] += exp.amountPaise;
    // Only participants owe their share
    for (const id of participants) {
      balances[id] -= shares[id];
    }
  }

  // Apply actual paid repayments
  for (const rep of repayments) {
    if (rep.status === 'paid') {
      balances[rep.fromRoommateId] += rep.amountPaise; // debtor paid
      balances[rep.toRoommateId]   -= rep.amountPaise; // creditor received
    }
  }

  return balances;
}

/**
 * Generate minimal set of transfers using greedy matching.
 * Returns [{ from, to, amountPaise }]
 */
export function suggestTransfers(balances) {
  // Work with mutable copies (paise integers)
  const bal = { ...balances };
  const transfers = [];

  const debtors  = () => ROOMMATE_IDS.filter(id => bal[id] < 0).sort((a, b) => bal[a] - bal[b]);
  const creditors = () => ROOMMATE_IDS.filter(id => bal[id] > 0).sort((a, b) => bal[b] - bal[a]);

  const MAX_ITER = 100;
  let iter = 0;

  while (iter++ < MAX_ITER) {
    const ds = debtors();
    const cs = creditors();
    if (!ds.length || !cs.length) break;

    const debtor   = ds[0];
    const creditor = cs[0];
    const amount   = Math.min(-bal[debtor], bal[creditor]);

    if (amount <= 0) break;

    transfers.push({ from: debtor, to: creditor, amountPaise: amount });
    bal[debtor]   += amount;
    bal[creditor] -= amount;
  }

  return transfers;
}

/**
 * Derive the monthKey (YYYY-MM) from an ISO date string.
 */
export function monthKey(dateStr) {
  // dateStr e.g. "2025-01-25"
  return dateStr.slice(0, 7);
}

/**
 * Settlement date for a given monthKey (YYYY-MM).
 * Returns a Date object (local timezone, midnight).
 */
export function settlementDate(mk) {
  const [year, month] = mk.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate(); // day 0 of next month = last day of month
  const day = month === 2 ? 28 : Math.min(30, lastDay);
  return new Date(year, month - 1, day);
}

/**
 * Check if today is on or after the settlement date for monthKey.
 */
export function isPastSettlement(mk) {
  const sd = settlementDate(mk);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today >= sd;
}

/**
 * Today's YYYY-MM-DD string (local timezone).
 */
export function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Current monthKey.
 */
export function currentMonthKey() {
  return todayStr().slice(0, 7);
}

/**
 * Format "YYYY-MM" as "January 2025".
 */
export function formatMonthKey(mk) {
  const [year, month] = mk.split('-').map(Number);
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

/**
 * Format a date string "YYYY-MM-DD" as "25 Jan 2025".
 */
export function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Generate a simple unique ID.
 */
export function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
