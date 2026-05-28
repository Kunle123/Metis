const LONDON = "Europe/London";

export function formatIssueHistoryAxisTime(iso: string): {
  displayTime: string;
  day: string;
  time: string;
} {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return { displayTime: iso, day: "—", time: "—" };
  }

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: LONDON,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  const day = get("weekday");
  const hour = get("hour");
  const minute = get("minute");
  const time = `${hour}:${minute}`;

  return {
    day,
    time,
    displayTime: `${day} ${time}`,
  };
}
