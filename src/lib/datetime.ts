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
