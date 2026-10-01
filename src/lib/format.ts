export function greetingWord(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateTime(value: string | Date) {
  return new Date(value).toLocaleString("en-NG", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Multi-day range as `d MMM – d MMM yyyy` (en-NG). */
export function formatConferenceDates(startsOn: string | Date, endsOn: string | Date) {
  const s = new Date(startsOn);
  const e = new Date(endsOn);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return "";
  const sameDay =
    s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth() && s.getDate() === e.getDate();
  if (sameDay) {
    return s.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
  }
  const startLabel = s.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    ...(s.getFullYear() === e.getFullYear() ? {} : { year: "numeric" as const }),
  });
  const endLabel = e.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
  return `${startLabel} – ${endLabel}`;
}

export function conferenceNightDayCount(startsOn: string | Date, endsOn: string | Date) {
  const s = new Date(startsOn);
  const e = new Date(endsOn);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return null;
  const startUtc = Date.UTC(s.getFullYear(), s.getMonth(), s.getDate());
  const endUtc = Date.UTC(e.getFullYear(), e.getMonth(), e.getDate());
  const days = Math.max(1, Math.floor((endUtc - startUtc) / 86_400_000) + 1);
  return { days, nights: Math.max(0, days - 1) };
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
