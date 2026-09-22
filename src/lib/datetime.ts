import cancelledDates from "../data/cancelled.json";

export const NEXT_SHOW_ANCHOR = "2026-07-31";

const SHOW_WALL_TIME = "21:00:00";
const SHOW_TIME_ZONE = "America/Los_Angeles";
export const SHOW_START_OFFSET_MS = 30 * 60_000;
export const SHOW_END_OFFSET_MS = 6 * 3_600_000;

export function wallTimeToInstant(naive: string, timeZone: string): Date {
  const naiveMs = new Date(naive + "Z").getTime();
  let guess = naiveMs;

  for (let i = 0; i < 4; i++) {
    const offsetMs = wallTimeAsUtc(guess, timeZone) - guess;
    const corrected = naiveMs - offsetMs;
    if (corrected === guess) break;
    guess = corrected;
  }

  return new Date(guess);
}

function wallTimeAsUtc(date: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);

  const p: Record<string, string> = {};
  for (const part of parts) p[part.type] = part.value;

  return Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    Number(p.hour),
    Number(p.minute),
    Number(p.second)
  );
}

export function nextShowDate(
  now: Date,
  anchor: string,
  cancelled: readonly string[]
): Date {
  const [year, month, day] = anchor.split("-").map(Number);
  const base = Date.UTC(year, month - 1, day);
  const cancelledSet = new Set(cancelled);

  for (let n = 0; n < 1024; n++) {
    const candidate = new Date(base + n * 14 * 86_400_000);
    const dateStr = candidate.toISOString().slice(0, 10);
    if (cancelledSet.has(dateStr)) continue;

    const instant = wallTimeToInstant(
      `${dateStr}T${SHOW_WALL_TIME}`,
      SHOW_TIME_ZONE
    );
    if (instant.getTime() + SHOW_END_OFFSET_MS > now.getTime()) return instant;
  }

  throw new Error("no future show date within cadence range");
}

const now = new Date();
export const showDate = nextShowDate(now, NEXT_SHOW_ANCHOR, cancelledDates);

export const showDateLabel = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  timeZone: "America/Los_Angeles",
}).format(showDate);
