import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Trash2,
  TrendingUp,
  AlertTriangle,
  Package,
  Layers,
  ShoppingBag,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const GeminiInsightsDashboard: React.FC = () => {
  const { products, sales, currentUser } = usePOS();
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome-1',
      role: 'assistant',
      content: `Hello ${currentUser.name}! I am your **FreshMart Retail AI Assistant**, running server-side with Gemini.\n\nI have real-time access to your store's **${products.length} products** and **${sales.length} transaction records**.\n\nTap any question below or type your inquiry:`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickQuestions = [
    { label: '🔥 Which items are trending right now?', query: 'Which items are trending right now in our store based on sales data?' },
    { label: '⚠️ What items are running low and need reorder?', query: 'What items are running low or out of stock, and what should we reorder?' },
    { label: '📉 Which products are slow-moving or at risk?', query: 'Which grocery products have low sales velocity and might be at risk of expiring?' },
    { label: '🏷️ Suggest a weekend bundle deal', query: 'Suggest a high-margin promotional bundle deal combining top sellers and fresh produce.' },
    { label: '💡 How to boost average basket size?', query: 'Give me 3 actionable cashier upselling tips to increase our store average basket size.' },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend || inputText).trim();
    if (!messageContent || isTyping) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: messageContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText('');
    setIsTyping(true);

    try {
      // Gather real-time store snapshot for server-side Gemini grounding
      const storeContext = {
        totalProducts: products.length,
        lowStockItems: products
          .filter((p) => p.stockQuantity <= p.lowStockThreshold)
          .map((p) => ({ name: p.name, stock: p.stockQuantity, threshold: p.lowStockThreshold })),
        outOfStockItems: products.filter((p) => p.stockQuantity === 0).map((p) => p.name),
        topSellingItems: [...products]
          .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
          .slice(0, 6)
          .map((p) => ({ name: p.name, sales: p.salesCount || 0, price: p.price })),
        recentSalesCount: sales.length,
        totalSalesRevenue: sales.reduce((acc, s) => acc + s.totalAmount, 0),
        activeStaffRole: currentUser.role,
        activeStaffName: currentUser.name,
      };

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          storeContext,
        }),
      });

      const data = await res.json();
      const replyContent =
        data.reply ||
        (data.success ? 'Analysis complete.' : 'Unable to connect to AI engine at this time.');

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: replyContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Server connection note: ${err.message || 'Unable to communicate with server-side AI'}. Please check that the server is running on port 3000.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: `Chat history cleared. How can I assist your grocery operations today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 h-[calc(100vh-140px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600/10 dark:bg-emerald-500/15 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">FreshMart AI Assistant</h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                Server-Side Gemini
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Live store analytics • Trending products • Inventory reordering • Zero client key exposure
            </p>
          </div>
        </div>

        <button
          onClick={clearChat}
          title="Clear Conversation"
          className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-xs flex items-center space-x-1.5"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">Clear Chat</span>
        </button>
      </div>

      {/* Chat Messages Stream */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  isUser
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xs'
                    : 'bg-emerald-600 text-white shadow-xs'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Content Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-tr-xs'
                    : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-tl-xs shadow-xs'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">
                  {m.content.split('\n').map((line, idx) => {
                    // Render bold headings gracefully
                    if (line.startsWith('### ') || line.startsWith('## ')) {
                      return (
                        <p key={idx} className="font-bold text-sm text-emerald-600 dark:text-emerald-400 mt-2 mb-1">
                          {line.replace(/^#+\s*/, '')}
                        </p>
                      );
                    }
                    if (line.startsWith('• ') || line.startsWith('- ')) {
                      return (
                        <div key={idx} className="flex items-start space-x-2 my-0.5">
                          <span className="text-emerald-500 font-bold">•</span>
                          <span>{line.substring(2)}</span>
                        </div>
                      );
                    }
                    return <p key={idx} className={line === '' ? 'h-2' : 'my-0.5'}>{line}</p>;
                  })}
                </div>
                <span
                  className={`block text-[10px] mt-1.5 ${
                    isUser ? 'text-zinc-400 dark:text-zinc-500 text-right' : 'text-zinc-400'
                  }`}
                >
                  {m.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center space-x-3 text-zinc-400 text-xs">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-2.5 flex items-center space-x-1.5 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]" />
              <span className="text-zinc-400 text-xs ml-1.5">Analyzing store data...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Pills */}
      <div className="py-2 overflow-x-auto no-scrollbar flex items-center space-x-2 shrink-0 border-t border-zinc-100 dark:border-zinc-800/80">
        {quickQuestions.map((q, idx) => (
          <button
            key={idx}
            disabled={isTyping}
            onClick={() => handleSendMessage(q.query)}
            className="whitespace-nowrap px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800/80 hover:bg-emerald-50 hover:border-emerald-300 dark:hover:bg-emerald-950/40 border border-zinc-200 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-300 text-xs transition disabled:opacity-50"
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Input Form Bar */}
      <div className="pt-2 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center space-x-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-1.5 shadow-sm focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500"
        >
          <input
            type="text"
            id="input-ai-chat-query"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isTyping}
            placeholder="Ask AI anything about trending items, low stock, promotions..."
            className="flex-1 px-3 py-2 text-xs sm:text-sm bg-transparent outline-hidden text-zinc-900 dark:text-white placeholder-zinc-400"
          />
          <button
            type="submit"
            id="btn-send-ai-chat"
            disabled={!inputText.trim() || isTyping}
            className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition shadow-xs flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-[10px] text-zinc-400 text-center mt-2">
          Responses generated server-side using Gemini AI grounded on live store inventory and POS sales records.
        </p>
      </div>
    </div>
  );
};
