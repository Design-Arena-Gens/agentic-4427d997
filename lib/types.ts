export type Candle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

export type Signal = {
  pair: string;
  timeframe: string;
  action: 'buy' | 'sell' | 'hold';
  entry: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  confidence: number; // 0..1
  rationale: string;
  generatedAt: string;
};
