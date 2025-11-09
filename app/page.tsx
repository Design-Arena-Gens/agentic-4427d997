"use client";

import { useState } from 'react';

type Signal = {
  pair: string;
  timeframe: string;
  action: 'buy' | 'sell' | 'hold';
  entry?: number | null;
  stopLoss?: number | null;
  takeProfit?: number | null;
  confidence: number;
  rationale: string;
  generatedAt: string;
};

export default function Page() {
  const [pair, setPair] = useState('EURUSD');
  const [timeframe, setTimeframe] = useState('M15');
  const [capital, setCapital] = useState(1000);
  const [risk, setRisk] = useState(1);
  const [loading, setLoading] = useState(false);
  const [signal, setSignal] = useState<Signal | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    setSignal(null);
    try {
      const res = await fetch(`/api/signal?pair=${encodeURIComponent(pair)}&timeframe=${encodeURIComponent(timeframe)}&capital=${capital}&riskPercent=${risk}`);
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `Request failed: ${res.status}`);
      }
      const data = await res.json();
      setSignal(data);
    } catch (e: any) {
      setError(e.message || 'Failed to generate signal');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Pair</span>
          <input value={pair} onChange={(e) => setPair(e.target.value.toUpperCase())} style={inputStyle} placeholder="EURUSD" />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Timeframe</span>
          <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)} style={inputStyle}>
            <option value="M1">M1</option>
            <option value="M5">M5</option>
            <option value="M15">M15</option>
            <option value="M30">M30</option>
            <option value="H1">H1</option>
            <option value="H4">H4</option>
            <option value="D1">D1</option>
          </select>
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Capital (USD)</span>
          <input type="number" value={capital} onChange={(e) => setCapital(parseFloat(e.target.value))} style={inputStyle} />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Risk per trade (%)</span>
          <input type="number" value={risk} onChange={(e) => setRisk(parseFloat(e.target.value))} style={inputStyle} />
        </label>
      </div>

      <button onClick={generate} disabled={loading} style={buttonStyle}>
        {loading ? 'Generating...' : 'Generate Signal'}
      </button>

      {error && (
        <div style={{ marginTop: 16, color: '#ff8a8a' }}>{error}</div>
      )}

      {signal && (
        <div style={{ marginTop: 16, padding: 16, background: '#0b1220', border: '1px solid #1f2a44', borderRadius: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <Info label="Action" value={signal.action.toUpperCase()} />
            <Info label="Entry" value={num(signal.entry)} />
            <Info label="Stop Loss" value={num(signal.stopLoss)} />
            <Info label="Take Profit" value={num(signal.takeProfit)} />
            <Info label="Confidence" value={`${Math.round(signal.confidence * 100)}%`} />
            <Info label="Generated" value={new Date(signal.generatedAt).toLocaleString()} />
          </div>
          <div style={{ marginTop: 12, whiteSpace: 'pre-wrap', color: '#bcd1ff' }}>{signal.rationale}</div>
          <div style={{ marginTop: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 600 }}>MT5 Runner configuration</div>
            <pre style={preStyle}>{`
# .env (runner)
API_URL=https://agentic-4427d997.vercel.app/api/signal
PAIR=${signal.pair}
TIMEFRAME=${signal.timeframe}
RISK_PERCENT=${risk}
CAPITAL_USD=${capital}
CONFIDENCE_THRESHOLD=0.6
POLL_SECONDS=60
`}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: '#9fb0d3' }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: '#0b1220',
  border: '1px solid #1f2a44',
  borderRadius: 8,
  padding: '10px 12px',
  color: '#e6eefc',
};

const buttonStyle: React.CSSProperties = {
  padding: '10px 14px',
  background: '#3b82f6',
  border: '1px solid #1f2a44',
  borderRadius: 8,
  cursor: 'pointer',
  color: '#fff',
  fontWeight: 600,
};

const preStyle: React.CSSProperties = {
  background: '#050a18',
  border: '1px solid #1f2a44',
  color: '#e6eefc',
  padding: 12,
  borderRadius: 8,
  overflowX: 'auto',
};

function num(n?: number | null) {
  return n == null || Number.isNaN(n) ? '-' : String(n);
}
