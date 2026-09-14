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

const SHOW_WALL_TIME = "21:00:00";
const SHOW_TIME_ZONE = "America/Los_Angeles";
const SHOW_END_OFFSET_MS = 3 * 3_600_000;

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
