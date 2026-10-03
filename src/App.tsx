import React, { useState, useEffect, useRef } from 'react';

interface MarketData {
  symbol: string;
  name?: string;
  price?: number;
  changePercentage?: number;
  change?: number;
  dayLow?: number;
  dayHigh?: number;
  yearLow?: number;
  yearHigh?: number;
  marketCap?: number;
  priceAvg50?: number;
  priceAvg200?: number;
  volume?: number;
  avgVolume?: number;
  exchange?: string;
  open?: number;
  previousClose?: number;
  eps?: number;
  pe?: number;
  earningsAnnouncement?: string;
  sharesOutstanding?: number;
  timestamp?: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  data?: MarketData[];
}

const INTERNAL_KEY = "PjSzxXD2Nymd4enxdTjnqw4wRQlV3LDc";
const BASE_URL = "https://financialmodelingprep.com/stable";
const COVERED = ['NASDAQ', 'NYSE', 'AMEX', 'CRYPTO', 'FOREX'];
const QUICK = ['AAPL', 'MSFT', 'NVDA', 'SPY', 'BTCUSD', 'EURUSD'];

const money = (n?: number) => {
  if (n === undefined || n === null) return 'n/a';
  const digits = Math.abs(n) < 10 ? 4 : 2;
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: digits });
};

const compact = (n?: number) => {
  if (!n) return 'n/a';
  if (n >= 1e12) return (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  return n.toLocaleString('en-US');
};

const asOf = (ts?: number) =>
  ts ? new Date(ts * 1000).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';

async function getJson(path: string) {
  const response = await fetch(`${BASE_URL}${path}&apikey=${INTERNAL_KEY}`);
  const text = await response.text();
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // The API answers with a plain sentence when a symbol is outside the free plan.
    if (/subscription|premium/i.test(text)) throw new Error('plan');
    throw new Error('network');
  }
}

export default function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Type a ticker (AAPL, SPY, BTCUSD) for a quote, or a company name to look up its symbol.' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 1) messagesEndRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, isLoading]);

  const lookup = async (raw: string) => {
    const typed = raw.trim();
    if (!typed || isLoading) return;
    const query = typed.toUpperCase();

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: typed }]);
    setIsLoading(true);

    try {
      const looksLikeTicker = /^[A-Z0-9.\-^=]{1,10}$/.test(query);
      let quotes: MarketData[] = [];
      let planLocked = false;
      if (looksLikeTicker) {
        try {
          quotes = await getJson(`/quote?symbol=${encodeURIComponent(query)}`);
        } catch (err) {
          if ((err as Error).message !== 'plan') throw err;
          planLocked = true;
        }
      }

      if (quotes.length > 0) {
        setMessages(prev => [...prev, { role: 'assistant', content: '', data: quotes }]);
      } else {
        const found = await getJson(`/search-name?query=${encodeURIComponent(typed)}&limit=30`);
        // The plan behind this page only quotes US listings, crypto and forex, so list those.
        const quotable = found.filter((item: any) => COVERED.includes(item.exchange));
        const matches: MarketData[] = quotable.map((item: any) => ({
          symbol: item.symbol,
          name: item.name,
          exchange: item.exchange
        }));
        if (planLocked && matches.length === 0) throw new Error('plan');
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: matches.length > 0
            ? `No quote for "${typed}". Symbols with a matching name:`
            : `Nothing found for "${typed}". Check the spelling or try the ticker.`,
          data: matches
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: (error as Error).message === 'plan'
          ? `No quote available for ${query}. This page covers US stocks and ETFs, major crypto and forex pairs.`
          : 'Could not reach the data service. Check your connection and try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    lookup(input);
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-[#0d1014] text-[#d7dde3]">
      <header className="px-4 py-3 border-b border-[#232a32] flex flex-wrap justify-between items-center gap-x-6 gap-y-2">
        <h1 className="text-[15px] font-semibold text-white">Market Data</h1>
        <div className="flex flex-wrap items-center gap-1 text-[13px]">
          <span className="text-[#8b98a5] mr-1">Quick quote</span>
          {QUICK.map(sym => (
            <button
              key={sym}
              type="button"
              onClick={() => lookup(sym)}
              disabled={isLoading}
              className="num px-2 py-1 rounded text-[#7cc0ff] hover:bg-[#18222d] hover:text-white disabled:text-[#5b6875]"
            >
              {sym}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-5">
          {messages.map((m, i) => (
            m.role === 'user' ? (
              <div key={i} className="num text-[13px] text-[#8b98a5] border-t border-[#232a32] pt-4">
                <span className="text-[#5f6b77]">&gt; </span>{m.content}
              </div>
            ) : (
              <div key={i}>
                {m.content && <p className="text-[14px] leading-relaxed m-0">{m.content}</p>}
                {m.data && m.data.length > 0 && m.data[0].price !== undefined && m.data.map((item, idx) => {
                  const up = (item.change || 0) >= 0;
                  return (
                    <div key={idx} className="mt-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                        <div>
                          <span className="num text-xl font-semibold text-white">{item.symbol}</span>
                          <span className="ml-3 text-[14px] text-[#aab4be]">{item.name}</span>
                        </div>
                        <div className="num">
                          <span className="text-xl font-semibold text-white">{money(item.price)}</span>
                          <span className={`ml-3 text-[14px] ${up ? 'text-[#3fcf8e]' : 'text-[#ff6b6b]'}`}>
                            {up ? '+' : ''}{money(item.change)} ({up ? '+' : ''}{(item.changePercentage ?? 0).toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                      <dl className="num mt-3 grid grid-cols-2 sm:grid-cols-4 gap-x-6 text-[13px] border-t border-[#232a32]">
                        {[
                          ['Open', money(item.open)],
                          ['Prev close', money(item.previousClose)],
                          ['Day range', `${money(item.dayLow)} to ${money(item.dayHigh)}`],
                          ['52-week range', `${money(item.yearLow)} to ${money(item.yearHigh)}`],
                          ['Volume', compact(item.volume)],
                          ['Market cap', compact(item.marketCap)],
                          ['50-day avg', money(item.priceAvg50)],
                          ['200-day avg', money(item.priceAvg200)],
                        ].map(([label, value]) => (
                          <div key={label} className="py-2 border-b border-[#1a2027]">
                            <dt className="font-sans text-[12px] text-[#8b98a5]">{label}</dt>
                            <dd className="m-0 text-[#e6ebef]">{value}</dd>
                          </div>
                        ))}
                      </dl>
                      <p className="mt-2 mb-0 text-[12px] text-[#8b98a5]">
                        {item.exchange}{item.timestamp ? `, as of ${asOf(item.timestamp)}` : ''}. Prices may be delayed.
                      </p>
                    </div>
                  );
                })}
                {m.data && m.data.length > 0 && m.data[0].price === undefined && (
                  <ul className="mt-2 p-0 list-none border-t border-[#232a32]">
                    {m.data.slice(0, 8).map((item, idx) => (
                      <li key={idx} className="border-b border-[#1a2027]">
                        <button
                          type="button"
                          onClick={() => lookup(item.symbol)}
                          disabled={isLoading}
                          className="w-full flex items-baseline gap-4 py-2 text-left text-[14px] hover:bg-[#141b22]"
                        >
                          <span className="num w-24 shrink-0 text-[#7cc0ff]">{item.symbol}</span>
                          <span className="flex-1 min-w-0 truncate">{item.name}</span>
                          <span className="text-[12px] text-[#8b98a5]">{item.exchange}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          ))}
          {isLoading && <p className="text-[14px] text-[#8b98a5] m-0" role="status">Loading…</p>}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="px-4 pt-3 pb-4 border-t border-[#232a32]">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSearch} className="flex gap-2">
            <label htmlFor="symbol" className="sr-only">Ticker or company name</label>
            <input
              id="symbol"
              name="symbol"
              type="text"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ticker or company name"
              className="num flex-1 min-w-0 bg-[#141a20] border border-[#2c3540] rounded px-3 py-2.5 text-[16px] text-white placeholder-[#7c8894]"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-4 rounded bg-[#7cc0ff] text-[#06121d] text-[14px] font-semibold hover:bg-[#a5d4ff] disabled:bg-[#232a32] disabled:text-[#7c8894]"
            >
              Get quote
            </button>
          </form>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-[#8b98a5]">
            <span>© 2026 <a href="https://bxzex.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white">bxzex</a></span>
            <span>Data from Financial Modeling Prep</span>
            <a href="https://github.com/bxzex/marketdata" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white">Source</a>
            <a href="https://buy.stripe.com/9B6eVfd9E6OC3sr7cEaAw03" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white">Support</a>
            <a href="https://linkedin.com/in/bxzex/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white">LinkedIn</a>
            <a href="https://instagram.com/bxzex" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white">Instagram</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
