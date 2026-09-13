const TIME_ZONE = "Asia/Kolkata";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const timeFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

const moneyFormat = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

type DateInput = Date | string;

const asDate = (value: DateInput) => (value instanceof Date ? value : new Date(value));

/** 13 Sep 2026, in the library's time zone. */
export function formatDate(value: DateInput) {
  // en-GB abbreviates September as "Sept"; the record slips use "Sep".
  return dateFormat.format(asDate(value)).replace("Sept", "Sep");
}

/** 13 Sep 2026, 12:00 pm. */
export function formatDateTime(value: DateInput) {
  return `${formatDate(value)}, ${timeFormat.format(asDate(value))}`;
}

/** Rs 50.00. */
export function formatMoney(value: number | string) {
  return `Rs ${moneyFormat.format(Number(value))}`;
}

/** 1st, 2nd, 3rd, 4th; 11th and 21st take their own rules. */
export function formatOrdinal(value: number) {
  const mod100 = value % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${value}th`;
  const mod10 = value % 10;
  if (mod10 === 1) return `${value}st`;
  if (mod10 === 2) return `${value}nd`;
  if (mod10 === 3) return `${value}rd`;
  return `${value}th`;
}

const PERIODS = {
  STANDARD: "Regular loan",
  HIGH_DEMAND: "High demand",
  SHORT_LOAN: "Short loan",
} as const;

export type PeriodRule = keyof typeof PERIODS;

export function formatPeriod(rule: PeriodRule) {
  return PERIODS[rule];
}
