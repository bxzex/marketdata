import React, { useState, useEffect, useRef } from 'react';

interface SymbolData {
  trading_symbol: string;
  registrant_name?: string;
  description?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  data?: SymbolData[];
}

export default function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Welcome to the Market Data terminal. Please enter your Financial Data API Key at the top to begin searching symbols.' }
  ]);
  const [apiKey, setApiKey] = useState('');
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
    if (!input.trim() || isLoading) return;
    if (!apiKey) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Please provide an API Key in the field above to continue.' }]);
      return;
    }

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      let endpoint = 'stock-symbols';
      const lowerInput = userMessage.toLowerCase();
      
      if (lowerInput.includes('etf')) {
        endpoint = 'etf-symbols';
      } else if (lowerInput.includes('international') || lowerInput.includes('foreign') || lowerInput.includes('global')) {
        endpoint = 'international-stock-symbols';
      }

      const response = await fetch(`https://financialdata.net/api/v1/${endpoint}?format=json&key=${apiKey}`);
      
      if (!response.ok) throw new Error('Failed to fetch data');
      
      const rawData = await response.json();
      const filtered = Array.isArray(rawData) ? rawData.slice(0, 10) : [];

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Here are some ${endpoint.replace('-', ' ')} matches:`,
        data: filtered 
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Error: Make sure your API key is valid and you have an active subscription.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#212121] text-[#ececec]">
      {/* Header */}
      <header className="p-4 border-b border-white/10 flex flex-col md:flex-row justify-between items-center bg-[#212121] gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">Market Data</h1>
          <div className="text-[10px] px-2 py-0.5 border border-zinc-700 rounded text-zinc-500 font-mono uppercase tracking-widest">bxzex terminal</div>
        </div>
        <input 
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter FinancialData API Key..."
          className="text-xs bg-[#2f2f2f] border border-white/5 rounded-lg px-3 py-2 w-full md:w-64 focus:outline-none focus:border-white/20"
        />
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                m.role === 'user' 
                  ? 'bg-[#2f2f2f] text-white' 
                  : 'bg-transparent text-[#ececec]'
              }`}>
                <div className="text-sm font-medium mb-1 opacity-50">
                  {m.role === 'assistant' ? 'Market Terminal' : 'You'}
                </div>
                <div className="text-[15px] leading-relaxed whitespace-pre-wrap">
                  {m.content}
                </div>
                {m.data && (
                  <div className="mt-4 grid grid-cols-1 gap-2">
                    {m.data.map((item, idx) => (
                      <div key={idx} className="bg-[#2f2f2f] p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-blue-400">{item.trading_symbol}</span>
                          <span className="text-xs opacity-50">Symbol</span>
                        </div>
                        <div className="text-sm mt-1 opacity-80">
                          {item.registrant_name || item.description || 'No description available'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-transparent text-[#ececec] px-4 py-3">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-white/30 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-white/30 rounded-full animate-bounce [animation-delay:-.3s]"></div>
                  <div className="w-2 h-2 bg-white/30 rounded-full animate-bounce [animation-delay:-.5s]"></div>
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
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search stocks, ETFs, or international symbols..."
              className="w-full bg-[#2f2f2f] border-none rounded-2xl py-4 pl-6 pr-14 focus:ring-1 focus:ring-white/20 text-[#ececec] placeholder-zinc-500 shadow-xl"
            />
            <button 
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-white text-black disabled:opacity-20 hover:bg-zinc-200 transition-all"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 11L12 6L17 11M12 18V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </form>
          
          <div className="mt-6 flex flex-col items-center gap-4">
            <div className="text-[11px] text-zinc-500 text-center">
              developed by bxzex
            </div>
            <div className="flex gap-6">
              <a href="https://github.com/bxzex" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors">
                GitHub
              </a>
              <a href="https://linkedin.com/in/bxzex/" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors">
                LinkedIn
              </a>
              <a href="https://instagram.com/bxzex" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors">
                Instagram
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
