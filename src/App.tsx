import React, { useState, useEffect, useRef } from 'react';

interface MarketData {
  symbol: string;
  name?: string;
  price?: number;
  changesPercentage?: number;
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

export default function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Welcome to the FMP Market Terminal. Search for any stock symbol (AAPL), ETF, or international market data.' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = input.trim().toUpperCase();
    if (!query || isLoading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: query }]);
    setIsLoading(true);

    try {
      // Use the modern /stable endpoints
      let endpoint = `/quote?symbol=${query}`;
      let isSearch = false;

      // Smart routing: if it's long or has spaces, use search
      if (query.length > 5 || query.includes(' ') || query === 'ETF') {
        endpoint = `/search-symbol?query=${query}`;
        isSearch = true;
      }

      const response = await fetch(`${BASE_URL}${endpoint}&apikey=${INTERNAL_KEY}`);
      if (!response.ok) throw new Error('Network response was not ok');
      
      const rawData = await response.json();
      let displayData: MarketData[] = [];

      if (isSearch) {
        displayData = (rawData || []).map((item: any) => ({
          symbol: item.symbol,
          name: item.name,
          exchange: item.stockExchange
        }));
      } else {
        // /stable/quote returns an array of objects
        displayData = Array.isArray(rawData) ? rawData : (rawData ? [rawData] : []);
      }

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: displayData.length > 0 
          ? `Found data for ${query}:` 
          : `No results found for "${query}".`,
        data: displayData 
      }]);

    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Failed to retrieve data. Please check the symbol or try again later.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#212121] text-[#ececec] font-sans">
      {/* Header */}
      <header className="p-4 border-b border-white/10 flex justify-between items-center bg-[#212121] sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <div className="w-4 h-4 rounded-sm border-2 border-emerald-500/50"></div>
          </div>
          <h1 className="text-lg font-medium tracking-tight">FMP Terminal</h1>
        </div>
        <div className="text-[10px] px-2 py-0.5 border border-zinc-800 rounded text-zinc-600 font-mono uppercase tracking-widest">bxzex-v2</div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-8">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] rounded-2xl ${
                m.role === 'user' 
                  ? 'bg-[#2f2f2f] px-4 py-2 text-white border border-white/5' 
                  : 'bg-transparent text-[#ececec]'
              }`}>
                {m.role === 'assistant' && (
                  <div className="text-[11px] font-bold mb-2 text-emerald-500 uppercase tracking-tighter">System</div>
                )}
                <div className="text-[15px] leading-relaxed whitespace-pre-wrap">
                  {m.content}
                </div>
                {m.data && m.data.length > 0 && (
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {m.data.map((item, idx) => (
                      <div key={idx} className="bg-[#2f2f2f]/50 p-4 rounded-xl border border-white/5 hover:border-emerald-500/30 transition-all group">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-bold text-lg text-white group-hover:text-emerald-400 transition-colors">{item.symbol}</span>
                            <div className="text-[10px] text-zinc-500 font-medium truncate max-w-[140px]">{item.name || 'Company'}</div>
                          </div>
                          {item.price !== undefined && (
                            <div className="text-right">
                              <div className="font-bold text-white">${item.price.toFixed(2)}</div>
                              <div className={`text-[10px] font-bold ${(item.change || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {(item.change || 0) >= 0 ? '+' : ''}{item.change?.toFixed(2)} ({item.changesPercentage?.toFixed(2)}%)
                              </div>
                            </div>
                          )}
                        </div>
                        {item.marketCap && (
                          <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-2 gap-2 text-[10px]">
                            <div>
                              <div className="text-zinc-500 uppercase">Market Cap</div>
                              <div className="text-zinc-300 font-medium">${(item.marketCap / 1e9).toFixed(2)}B</div>
                            </div>
                            <div>
                              <div className="text-zinc-500 uppercase">Volume</div>
                              <div className="text-zinc-300 font-medium">{(item.volume || 0).toLocaleString()}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-transparent text-[#ececec] py-2">
                <div className="flex space-x-1.5">
                  <div className="w-1.5 h-1.5 bg-emerald-500/40 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-emerald-500/40 rounded-full animate-bounce [animation-delay:-.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-emerald-500/40 rounded-full animate-bounce [animation-delay:-.5s]"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="p-4 md:p-8 bg-[#212121]">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSearch} className="relative group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter symbol (e.g. BTCUSD, AAPL, MSFT)..."
              className="w-full bg-[#2f2f2f] border border-white/5 rounded-2xl py-4 pl-6 pr-14 focus:outline-none focus:border-emerald-500/30 text-[#ececec] placeholder-zinc-600 shadow-2xl transition-all"
            />
            <button 
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-white text-black disabled:opacity-10 hover:bg-emerald-400 hover:text-black transition-all"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 11L12 6L17 11M12 18V7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </form>
          
          <div className="mt-8 flex flex-col items-center gap-4">
            <div className="text-[10px] text-zinc-600 font-medium tracking-widest uppercase">
              developed by bxzex
            </div>
            <div className="flex gap-8">
              <a href="https://github.com/bxzex" target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-emerald-400 text-xs font-medium transition-colors">
                GITHUB
              </a>
              <a href="https://linkedin.com/in/bxzex/" target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-emerald-400 text-xs font-medium transition-colors">
                LINKEDIN
              </a>
              <a href="https://instagram.com/bxzex" target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-emerald-400 text-xs font-medium transition-colors">
                INSTAGRAM
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
