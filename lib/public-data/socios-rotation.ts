/** Periodo de seed para rotación estable entre socios activos con mismo ranking (empates). */

export type SocioRotationPeriod = "off" | "daily" | "weekly";

export function getSocioRotationPeriod(): SocioRotationPeriod {
  const v = (process.env.REDALIA_SOCIOS_ROTATION_PERIOD ?? "weekly").trim().toLowerCase();
  if (v === "off" || v === "none" || v === "0" || v === "false") return "off";
  if (v === "daily" || v === "day") return "daily";
  return "weekly";
}

/** ISO week label `YYYY-Www` (lunes como inicio de semana ISO). */
export function isoWeekLabel(d = new Date()): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export function rotationSeedKey(now = new Date()): string {
  const period = getSocioRotationPeriod();
  if (period === "off") return "off";
  if (period === "daily") {
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }
  return isoWeekLabel(now);
}

export function stableHash32(input: string): number {
  let h = 2_166_136_261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16_777_619);
  }
  return h >>> 0;
}
