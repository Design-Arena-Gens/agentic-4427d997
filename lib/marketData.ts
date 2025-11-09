import type { Candle } from './types';
import { timeframeToAlphaVantage } from './utils';

export async function fetchCandles(pair: string, timeframe: string, limit = 300): Promise<Candle[]> {
  const key = process.env.ALPHA_VANTAGE_KEY;
  if (!key) throw new Error('Missing ALPHA_VANTAGE_KEY environment variable');
  const [from, to] = [pair.slice(0, 3), pair.slice(3, 6)];
  const interval = timeframeToAlphaVantage(timeframe);
  const url = new URL('https://www.alphavantage.co/query');
  url.searchParams.set('function', 'FX_INTRADAY');
  url.searchParams.set('from_symbol', from);
  url.searchParams.set('to_symbol', to);
  url.searchParams.set('interval', interval);
  url.searchParams.set('apikey', key);
  url.searchParams.set('outputsize', 'full');

  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) throw new Error(`AlphaVantage error: ${res.status}`);
  const data = await res.json();
  const keyName = `Time Series FX (${interval})`;
  const ts = data[keyName];
  if (!ts) throw new Error('AlphaVantage returned no time series data');

  const candles: Candle[] = Object.entries(ts).map(([time, v]: any) => ({
    time,
    open: Number(v['1. open']),
    high: Number(v['2. high']),
    low: Number(v['3. low']),
    close: Number(v['4. close']),
  })) as Candle[];

  candles.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  return candles.slice(-limit);
}
