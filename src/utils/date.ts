export function toIsoDate(value: Date = new Date()): string {
  return value.toISOString().slice(0, 10);
}

export function toIsoTimestamp(value: Date = new Date()): string {
  return value.toISOString();
}
