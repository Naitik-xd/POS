import React, { useState } from 'react';
import { POSProvider, usePOS } from './context/POSContext';
import { BillingDashboard } from './components/BillingDashboard';
import { InventoryDashboard } from './components/InventoryDashboard';
import { SalesDashboard } from './components/SalesDashboard';
import { GeminiInsightsDashboard } from './components/GeminiInsightsDashboard';
import { AboutPage } from './components/AboutPage';
import { LegalPage } from './components/LegalPage';
import { WelcomePage } from './components/WelcomePage';
import { AuthModal } from './components/AuthModal';
import { AutomatedAlertsDrawer } from './components/AutomatedAlertsDrawer';
import { SupabaseModal } from './components/SupabaseModal';
import { BottomNavbar } from './components/BottomNavbar';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  Store,
} from 'lucide-react';

const POSAppContent: React.FC = () => {
  const { activeTab, toasts, removeToast, settings } = usePOS();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAlertsDrawerOpen, setIsAlertsDrawerOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-200 overflow-x-hidden">
      {/* Main Viewport Content based on active tab with bottom spacing for BottomNavbar */}
      <main className="flex-1 pb-24 sm:pb-28 overflow-x-hidden">
        {activeTab === 'welcome' && <WelcomePage />}
        {activeTab === 'billing' && <BillingDashboard />}
        {activeTab === 'inventory' && <InventoryDashboard />}
        {activeTab === 'sales' && <SalesDashboard />}
        {(activeTab === 'gemini' || activeTab === 'ai_insights') && <GeminiInsightsDashboard />}
        {activeTab === 'about' && <AboutPage />}
        {(activeTab === 'legal' || activeTab === 'legal_terms' || activeTab === 'legal_privacy') && (
          <LegalPage />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 py-6 px-4 sm:px-6 lg:px-8 text-xs text-zinc-500 mb-14 sm:mb-16">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Store className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-zinc-700 dark:text-zinc-300">
              {settings.storeName} Point of Sale
            </span>
            <span>•</span>
            <span>Enterprise Grocery Edition</span>
          </div>

          <div className="flex items-center space-x-4 text-xs">
            <span className="inline-flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
              <span>Terminal Online</span>
            </span>
            <span>•</span>
            <span>Version 2.4.0</span>
            <span>•</span>
            <span>© {new Date().getFullYear()} {settings.storeName}. All rights reserved.</span>
          </div>
        </div>
      </footer>

      {/* Primary Fixed Bottom Navigation Bar */}
      <BottomNavbar
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenAlerts={() => setIsAlertsDrawerOpen(true)}
        onOpenSupabase={() => setIsSupabaseModalOpen(true)}
      />

      {/* Modals & Drawers */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <AutomatedAlertsDrawer
        isOpen={isAlertsDrawerOpen}
        onClose={() => setIsAlertsDrawerOpen(false)}
      />
      <SupabaseModal isOpen={isSupabaseModalOpen} onClose={() => setIsSupabaseModalOpen(false)} />

      {/* Global Interactive Toast Notification Stack (raised above bottom navbar) */}
      {toasts.length > 0 && (
        <div className="fixed bottom-20 sm:bottom-22 right-3 sm:right-5 z-50 flex flex-col space-y-2 max-w-sm w-[calc(100vw-24px)] pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start space-x-3 p-4 rounded-2xl shadow-xl border animate-in slide-in-from-bottom-3 fade-in ${
                toast.type === 'success'
                  ? 'bg-emerald-50 dark:bg-zinc-900 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  : toast.type === 'error'
                  ? 'bg-rose-50 dark:bg-zinc-900 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                  : toast.type === 'warning'
                  ? 'bg-amber-50 dark:bg-zinc-900 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                  : 'bg-blue-50 dark:bg-zinc-900 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-200'
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600" />}
                {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600" />}
                {toast.type === 'info' && <Info className="w-5 h-5 text-blue-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="font-bold text-xs sm:text-sm leading-tight">{toast.title}</h5>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 leading-snug">
                  {toast.description}
                </p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 -mr-1 -mt-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <POSProvider>
      <POSAppContent />
    </POSProvider>
  );
}
