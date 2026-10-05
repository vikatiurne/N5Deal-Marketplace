const DATE_FORMAT = new Intl.DateTimeFormat("en-IE", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const DATE_TIME_FORMAT = new Intl.DateTimeFormat("en-IE", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(date: Date): string {
  return DATE_FORMAT.format(date);
}

export function formatDateTime(date: Date): string {
  return DATE_TIME_FORMAT.format(date);
}
