const NATO = [
  "Alpha",
  "Bravo",
  "Charlie",
  "Delta",
  "Echo",
  "Foxtrot",
  "Golf",
  "Hotel",
  "India",
  "Juliet",
  "Kilo",
  "Lima",
  "Mike",
  "November",
  "Oscar",
  "Papa",
  "Quebec",
  "Romeo",
  "Sierra",
  "Tango",
  "Uniform",
  "Victor",
  "Whiskey",
  "X‑Ray",
  "Yankee",
  "Zulu",
];

export function protocolNameFromLevel(level: number): string {
  const safe = Math.max(1, Math.floor(level || 1));
  const idx = (safe - 1) % NATO.length;
  const cycle = Math.floor((safe - 1) / NATO.length);
  const suffix = cycle > 0 ? ` ${cycle + 1}` : "";
  return `Protocolo ${NATO[idx]}${suffix}`;
}

