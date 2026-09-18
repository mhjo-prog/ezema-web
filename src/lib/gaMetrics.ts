export const GA_DATA_START = "2026-09-01";

export interface GaMetrics {
  quizStartUsers: number;
  quizCompleteUsers: number;
  completionRate: number;   // %
  avgSessionSec: number;
  shareKakao: number;
  shareCopy: number;
  dateRange: { startDate: string; endDate: string };
  dataStart: string;
}

export type GaRange = "1d" | "7d" | "30d" | "monthly" | "all";

export async function fetchGaMetrics(range: GaRange): Promise<GaMetrics | null> {
  try {
    const res = await fetch(`/api/ga-metrics?range=${range}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.error) return null;
    return data as GaMetrics;
  } catch {
    return null;
  }
}

export function formatDuration(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return "-";
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}분 ${String(s).padStart(2, "0")}초`;
}
