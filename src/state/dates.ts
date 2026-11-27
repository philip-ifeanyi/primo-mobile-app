const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

/**
 * Dates are held in state as ISO yyyy-mm-dd — a calendar day with no time and
 * no zone, which is what a birthday or an expiry actually is. Parsing them with
 * `new Date(iso)` would read them as UTC midnight and shift the day backwards
 * for anyone west of Greenwich, so the parts are split by hand.
 */
export function toIsoDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function fromIsoDate(iso: string) {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** "1994-03-14" -> "14 March 1994", for the date-of-birth row. */
export function formatLongDate(iso: string | null) {
  if (!iso) return null;
  const date = fromIsoDate(iso);
  return `${date.getDate()} ${MONTHS_LONG[date.getMonth()]} ${date.getFullYear()}`;
}

/** "2022-06-08" -> "08 Jun 2022", for the document issued/expires pair. */
export function formatShortDate(iso: string | null) {
  if (!iso) return null;
  const date = fromIsoDate(iso);
  const day = String(date.getDate()).padStart(2, '0');
  return `${day} ${MONTHS_LONG[date.getMonth()].slice(0, 3)} ${date.getFullYear()}`;
}

/** "12 October", for the next-debit line on the success screen. */
export function formatDayAndMonth(date: Date) {
  return `${date.getDate()} ${MONTHS_LONG[date.getMonth()]}`;
}

/** Today at local midnight, so comparisons never trip over the clock. */
export function today() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function yearsAgo(years: number) {
  const base = today();
  return new Date(base.getFullYear() - years, base.getMonth(), base.getDate());
}
