import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'AI Forex Bot',
  description: 'Gemini-powered forex signal generator and MT5 bridge',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'Inter, system-ui, Arial, sans-serif', background: '#0b1220', color: '#e6eefc' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px' }}>
          <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700 }}>AI Forex Bot</h1>
            <a href="https://agentic-4427d997.vercel.app" style={{ color: '#8ab4ff' }}>Production URL</a>
          </header>
          <div style={{ background: '#0f172a', border: '1px solid #1f2a44', borderRadius: 12, padding: 24 }}>{children}</div>
          <footer style={{ marginTop: 24, color: '#9fb0d3', fontSize: 12 }}>
            This tool does not provide financial advice. Trading involves risk. Use at your own discretion.
          </footer>
        </div>
      </body>
    </html>
  );
}
