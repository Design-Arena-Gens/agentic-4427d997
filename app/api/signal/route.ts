import { NextRequest } from 'next/server';
import { fetchCandles } from '@lib/marketData';
import { atr, macd, rsi, sma, ema } from '@lib/indicators';
import { generateSignal } from '@lib/ai';
import type { Candle } from '@lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pair = (searchParams.get('pair') || 'EURUSD').toUpperCase();
    const timeframe = (searchParams.get('timeframe') || 'M15').toUpperCase();

    const candles: Candle[] = await fetchCandles(pair, timeframe, 400);
    const closes = candles.map(c => c.close);

    const ind = {
      sma20: last(sma(closes, 20)),
      sma50: last(sma(closes, 50)),
      ema20: last(ema(closes, 20)),
      ema50: last(ema(closes, 50)),
      rsi14: last(rsi(closes, 14)),
      macd: last(macd(closes).macdLine),
      macdSignal: last(macd(closes).signalLine),
      atr14: last(atr(candles, 14)),
    };

    const signal = await generateSignal({ pair, timeframe, candles, indicators: ind });

    return new Response(JSON.stringify(signal, null, 2), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch (e: any) {
    return new Response(e.message || 'Error generating signal', { status: 500 });
  }
}

function last(arr: number[]): number | null {
  const v = arr[arr.length - 1];
  return Number.isFinite(v) ? Number(v) : null;
}
