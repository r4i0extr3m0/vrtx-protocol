export function formatKg(value: number): string {
  return `${value.toFixed(1)} kg`;
}

export function formatVolume(value: number): string {
  return `${Math.round(value).toLocaleString("pt-BR")} kg`;
}
