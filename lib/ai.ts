import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import type { Candle, Signal } from "./types";

const SignalSchema = z.object({
  action: z.enum(["buy", "sell", "hold"]),
  entry: z.number().nullable(),
  stopLoss: z.number().nullable(),
  takeProfit: z.number().nullable(),
  confidence: z.number().min(0).max(1),
  rationale: z.string().min(1),
});

export async function generateSignal(params: {
  pair: string;
  timeframe: string;
  candles: Candle[];
  indicators: Record<string, number | string | null>;
}): Promise<Signal> {
  const { pair, timeframe, candles, indicators } = params;
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GOOGLE_API_KEY environment variable");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const latest = candles[candles.length - 1];
  const sys = `You are an experienced FX trader. Generate a single JSON object with fields: action (buy|sell|hold), entry, stopLoss, takeProfit, confidence (0..1), rationale. Use conservative risk management. Avoid overtrading. If signal quality is low, output hold.`;
  const content = [
    { role: "user", parts: [{ text: sys }] },
    {
      role: "user",
      parts: [{
        text: JSON.stringify({
          pair,
          timeframe,
          latest,
          indicators,
          candles: candles.slice(-200),
          instructions: {
            output: "strict-json",
            constraints: {
              risk: "prefer R>=1.5 with realistic SL/TP based on ATR",
              quality: process.env.SIGNAL_MIN_CONFIDENCE || "0.6",
            }
          }
        })
      }]
    }
  ];

  const result = await model.generateContent({ contents: content });
  const text = result.response.text().trim();
  const json = extractJson(text);
  const parsed = SignalSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Model returned invalid JSON");
  }
  const minConf = Number(process.env.SIGNAL_MIN_CONFIDENCE || 0.6);
  const s = parsed.data;
  const signal: Signal = {
    pair,
    timeframe,
    action: s.confidence >= minConf ? s.action : "hold",
    entry: s.entry,
    stopLoss: s.stopLoss,
    takeProfit: s.takeProfit,
    confidence: s.confidence,
    rationale: s.rationale,
    generatedAt: new Date().toISOString(),
  };
  return signal;
}

function extractJson(raw: string): unknown {
  try {
    if (raw.startsWith("{")) return JSON.parse(raw);
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch {}
  return {};
}
