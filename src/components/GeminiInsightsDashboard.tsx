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
  Copy,
  Check,
  Building2,
  ShieldCheck,
  RotateCcw,
  Zap,
  ShieldAlert,
  Ban,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isWarning?: boolean;
  isBan?: boolean;
}


export const GeminiInsightsDashboard: React.FC = () => {
  const { products, sales, currentUser, settings } = usePOS();
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome-1',
      role: 'assistant',
      content: `Hello ${currentUser.name}! I am your **${settings.storeName} Retail AI Assistant**, powered by server-side Gemini 2.5 Flash.\n\nI am grounded in your live store database:\n• **${products.length} registered products** across all grocery aisles\n• **${sales.length} completed transactions**\n• Multi-tenant business partition: \`${settings.businessId}\`\n\nChoose an inquiry below or ask anything about inventory reordering, sales trends, promotions, and store profitability!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [securityStatus, setSecurityStatus] = useState<{
    remainingRequests: number;
    warningCount: number;
    ip?: string;
    isBanned?: boolean;
    isPermaBanned?: boolean;
    bannedUntil?: string | null;
  }>({
    remainingRequests: 15,
    warningCount: 0,
    isBanned: false,
    isPermaBanned: false,
    bannedUntil: null,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Poll or fetch security IP status on load
  useEffect(() => {
    fetch('/api/security/ip-status')
      .then((res) => res.json())
      .then((data) => {
        if (data?.currentRecord) {
          setSecurityStatus({
            remainingRequests: Math.max(0, 15 - (data.currentRecord.request_count || 0)),
            warningCount: data.currentRecord.warning_count || 0,
            ip: data.clientIp,
            isBanned: data.currentRecord.is_banned,
            isPermaBanned: data.currentRecord.perma_ban,
            bannedUntil: data.currentRecord.banned_until,
          });
        }
      })
      .catch(() => {});
  }, []);

  const quickQuestions = [

    {
      icon: TrendingUp,
      label: 'Trending items & top sellers',
      query: 'Which items are trending right now in our grocery store based on recent sales velocity?',
    },
    {
      icon: AlertTriangle,
      label: 'Low stock & urgent reorders',
      query: 'Which items are below low stock threshold or out of stock, and how many units should we order?',
    },
    {
      icon: Zap,
      label: 'Weekend bundle promotion',
      query: 'Design a weekend promotional bundle combining our fast-moving items with high-margin pantry goods to boost basket size.',
    },
    {
      icon: Package,
      label: 'Slow-moving & expiry risk',
      query: 'Identify grocery items that might have low sales velocity or expiration risk, and recommend markdown actions.',
    },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

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
        storeName: settings.storeName,
        businessId: settings.businessId,
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

      let data: any = {};
      const rawResponseText = await res.text();
      try {
        data = JSON.parse(rawResponseText);
      } catch {
        throw new Error(
          !res.ok
            ? 'Server initialization error. Please verify that GEMINI_API_KEY is configured in your deployment settings.'
            : 'Unable to parse server response.'
        );
      }

      // Check if security blocked or warnings returned
      if (data.security) {
        setSecurityStatus((prev) => ({
          ...prev,
          remainingRequests: data.security.remainingRequests,
          warningCount: data.security.warningCount,
          ip: data.security.ip,
        }));
      }

      if (!res.ok || data.securityBlocked || data.isGibberish) {
        if (data.warningCount !== undefined) {
          setSecurityStatus((prev) => ({
            ...prev,
            warningCount: data.warningCount,
            isBanned: data.isBannedNow,
            bannedUntil: data.bannedUntil,
          }));
        }

        const warningMsg: ChatMessage = {
          id: `warn-${Date.now()}`,
          role: 'assistant',
          content: data.error || data.reply || 'Security alert: request blocked.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isWarning: !data.isBannedNow,
          isBan: data.isBannedNow || data.securityBlocked,
        };
        setMessages((prev) => [...prev, warningMsg]);
        return;
      }

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
        content: `⚠️ Server connection note: ${err.message || 'Unable to communicate with server-side AI'}. Please verify that the application server is active.`,
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
        content: `Chat history cleared. How can I assist your ${settings.storeName} grocery operations today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Metrics for quick sidebar
  const lowStockCount = products.filter((p) => p.stockQuantity <= p.lowStockThreshold).length;
  const outOfStockCount = products.filter((p) => p.stockQuantity === 0).length;
  const totalRevenue = sales.reduce((acc, s) => acc + s.totalAmount, 0);

  return (
    <div className="flex-1 flex flex-col w-full h-full max-w-7xl mx-auto px-2.5 sm:px-6 py-2 sm:py-4">
      {/* Top Banner Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                {settings.storeName} AI Intelligence
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Gemini 2.5 Flash
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Grounded in live inventory, sales velocity & POS transactions • Zero client key exposure
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={clearChat}
            title="Reset Conversation"
            className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-xs font-semibold flex items-center space-x-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>


      {/* Main Content: Split Grid on Desktop, Fluid on Mobile */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 pt-3 overflow-hidden min-h-0">
        {/* Left Sidebar: Live Store Snapshot & Quick Insights (Desktop) */}
        <div className="hidden lg:flex lg:flex-col lg:col-span-1 space-y-3 overflow-y-auto pr-1">
          {/* Live Store Status Card */}
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Live Grounding</span>
              <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Synced</span>
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">Business ID:</span>
                <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200 max-w-[130px] truncate" title={settings.businessId}>
                  {settings.businessId}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">Total SKUs:</span>
                <span className="font-bold text-zinc-900 dark:text-white">{products.length} items</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">Low Stock / OOS:</span>
                <span className={`font-bold ${lowStockCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-900 dark:text-white'}`}>
                  {lowStockCount} items ({outOfStockCount} out)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">Total Sales:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {settings.currencySymbol}{totalRevenue.toFixed(2)} ({sales.length} receipts)
                </span>
              </div>
            </div>
          </div>

          {/* Quick Prompt Questions */}
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-2.5">
            <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
              Quick Prompt Topics
            </h4>
            <div className="space-y-2">
              {quickQuestions.map((q, idx) => {
                const IconComponent = q.icon;
                return (
                  <button
                    key={idx}
                    disabled={isTyping}
                    onClick={() => handleSendMessage(q.query)}
                    className="w-full text-left p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:border-emerald-300 dark:hover:border-emerald-700 bg-zinc-50/70 dark:bg-zinc-800/40 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition text-xs group"
                  >
                    <div className="flex items-center space-x-2">
                      <IconComponent className="w-3.5 h-3.5 text-emerald-600 shrink-0 group-hover:scale-110 transition" />
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                        {q.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Security Guarantee */}
          <div className="p-3 rounded-2xl bg-zinc-100/70 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800 flex items-start space-x-2.5 text-[11px] text-zinc-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              All prompts are securely proxied via server-side Express handlers. No API keys or external credentials touch the browser.
            </span>
          </div>
        </div>

        {/* Right Chat Column (Takes full width on mobile, 3/4 on desktop) */}
        <div className="lg:col-span-3 flex flex-col h-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xs overflow-hidden">
          {/* Chat Messages Stream */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex items-start gap-2.5 sm:gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-2xl flex items-center justify-center shrink-0 text-xs font-bold ${
                      isUser
                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xs'
                        : m.isBan
                        ? 'bg-red-600 text-white shadow-xs animate-pulse'
                        : m.isWarning
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-xs'
                    }`}
                  >
                    {isUser ? (
                      <User className="w-4 h-4" />
                    ) : m.isBan ? (
                      <Ban className="w-4 h-4" />
                    ) : m.isWarning ? (
                      <ShieldAlert className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>

                  {/* Message Content Bubble */}
                  <div
                    className={`max-w-[90%] sm:max-w-[80%] rounded-3xl px-4 py-3 text-xs sm:text-sm leading-relaxed relative group ${
                      isUser
                        ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-tr-xs'
                        : m.isBan
                        ? 'bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-200 rounded-tl-xs shadow-md'
                        : m.isWarning
                        ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200 rounded-tl-xs shadow-xs'
                        : 'bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/60 text-zinc-800 dark:text-zinc-200 rounded-tl-xs shadow-2xs'
                    }`}
                  >

                    <div className="whitespace-pre-wrap font-sans">
                      {m.content.split('\n').map((line, idx) => {
                        if (line.startsWith('### ') || line.startsWith('## ')) {
                          return (
                            <p key={idx} className="font-bold text-sm text-emerald-600 dark:text-emerald-400 mt-2.5 mb-1">
                              {line.replace(/^#+\s*/, '')}
                            </p>
                          );
                        }
                        if (line.startsWith('• ') || line.startsWith('- ')) {
                          return (
                            <div key={idx} className="flex items-start space-x-2 my-1">
                              <span className="text-emerald-500 font-bold shrink-0">•</span>
                              <span>{line.substring(2)}</span>
                            </div>
                          );
                        }
                        return <p key={idx} className={line === '' ? 'h-2' : 'my-0.5'}>{line}</p>;
                      })}
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-zinc-200/40 dark:border-zinc-700/40">
                      <span className={`text-[10px] ${isUser ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-400'}`}>
                        {m.timestamp}
                      </span>

                      {!isUser && (
                        <button
                          onClick={() => handleCopy(m.id, m.content)}
                          title="Copy message"
                          className="text-[10px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 flex items-center space-x-1 opacity-60 group-hover:opacity-100 transition"
                        >
                          {copiedId === m.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span className="text-emerald-500 font-semibold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-center space-x-3 text-zinc-400 text-xs">
                <div className="w-8 h-8 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/60 rounded-2xl px-4 py-2.5 flex items-center space-x-2 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-zinc-500 dark:text-zinc-400 text-xs ml-1">
                    Analyzing store inventory & sales data...
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Pills (Mobile horizontal scroll) */}
          <div className="lg:hidden px-3 py-2 overflow-x-auto no-scrollbar flex items-center space-x-2 shrink-0 border-t border-zinc-100 dark:border-zinc-800">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                disabled={isTyping}
                onClick={() => handleSendMessage(q.query)}
                className="whitespace-nowrap px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs transition disabled:opacity-50 active:scale-95"
              >
                {q.label}
              </button>
            ))}
          </div>

          {/* Input Form Bar */}
          <div className="p-3 sm:p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center space-x-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-1.5 shadow-2xs focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500"
            >
              <input
                type="text"
                id="input-ai-chat-query"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isTyping}
                placeholder={`Ask AI about ${settings.storeName} products, restock orders, bundles...`}
                className="flex-1 px-3 py-2 text-xs sm:text-sm bg-transparent outline-hidden text-zinc-900 dark:text-white placeholder-zinc-400"
              />
              <button
                type="submit"
                id="btn-send-ai-chat"
                disabled={!inputText.trim() || isTyping}
                className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs flex items-center justify-center shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
