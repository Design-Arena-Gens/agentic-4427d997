export function toFixedNumber(n: number | null | undefined, dp = 5): number | null {
  if (n == null || Number.isNaN(n)) return null;
  return Number(n.toFixed(dp));
}

export function timeframeToAlphaVantage(interval: string): string {
  switch (interval) {
    case 'M1': return '1min';
    case 'M5': return '5min';
    case 'M15': return '15min';
    case 'M30': return '30min';
    case 'H1': return '60min';
    default: return '60min';
  }
}
