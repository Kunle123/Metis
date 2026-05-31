const LONDON = "Europe/London";

function londonParts(d: Date, include: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: LONDON, ...include }).formatToParts(d);
}

function partValue(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  return parts.find((p) => p.type === type)?.value ?? "";
}

/** Timeline axis + card label, e.g. "Mon 11 May · 05:42". */
export function formatIssueHistoryAxisTime(iso: string): {
  displayTime: string;
  day: string;
  time: string;
} {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return { displayTime: iso, day: "—", time: "—" };
  }

  const parts = londonParts(d, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const weekday = partValue(parts, "weekday");
  const dayNum = partValue(parts, "day");
  const month = partValue(parts, "month");
  const hour = partValue(parts, "hour");
  const minute = partValue(parts, "minute");
  const time = `${hour}:${minute}`;
  const day = `${weekday} ${dayNum} ${month}`;

  return {
    day,
    time,
    displayTime: `${day} · ${time}`,
  };
}

/** Drawer and record metadata, e.g. "Monday 11 May 2026, 05:42 BST". */
export function formatIssueHistoryDetailTimestamp(iso: Date | string): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "—";

  const parts = londonParts(d, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZoneName: "short",
  });

  const weekday = partValue(parts, "weekday");
  const dayNum = partValue(parts, "day");
  const month = partValue(parts, "month");
  const year = partValue(parts, "year");
  const hour = partValue(parts, "hour");
  const minute = partValue(parts, "minute");
  const zone = partValue(parts, "timeZoneName");

  return `${weekday} ${dayNum} ${month} ${year}, ${hour}:${minute} ${zone}`;
}
