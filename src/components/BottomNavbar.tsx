import React, { useState } from 'react';
import {
  Store,
  ShoppingCart,
  Package,
  TrendingUp,
  Sparkles,
  Shield,
  UserCheck,
  KeyRound,
  Play,
  Sun,
  Moon,
  Bell,
  Database,
  MoreHorizontal,
  X,
  Info,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { ActiveTab } from '../types';
import { isSupabaseConfigured } from '../services/supabaseService';

interface BottomNavbarProps {
  onOpenAuth: () => void;
  onOpenAlerts: () => void;
  onOpenSupabase: () => void;
}

export const BottomNavbar: React.FC<BottomNavbarProps> = ({
  onOpenAuth,
  onOpenAlerts,
  onOpenSupabase,
}) => {
  const {
    activeTab,
    setActiveTab,
    cartTotals,
    alerts,
    currentUser,
    switchRole,
    settings,
    loadDemoStore,
    theme,
    toggleTheme,
  } = usePOS();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const supabaseConnected = isSupabaseConfigured();

  const lowStockCount = alerts.filter(
    (a) => a.type === 'low_stock' || a.type === 'out_of_stock'
  ).length;

  const totalAlertsCount = alerts.length;

  const navButtons: {
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
  }[] = [
    {
      id: 'welcome',
      label: 'Store Hub',
      icon: Store,
    },
    {
      id: 'billing',
      label: 'Billing',
      icon: ShoppingCart,
      badge: cartTotals.totalUnits > 0 ? cartTotals.totalUnits : undefined,
      badgeColor: 'bg-emerald-600 text-white',
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: Package,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'sales',
      label: 'Sales',
      icon: TrendingUp,
    },
    {
      id: 'ai_insights',
      label: 'AI Insights',
      icon: Sparkles,
    },
  ];

  return (
    <>
      <nav
        id="bottom-navigation-bar"
        aria-label="Bottom Navigation"
        className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.45)] transition-colors"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 6px)' }}
      >
        <div className="max-w-7xl mx-auto px-2 sm:px-4">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-1">
            {/* Desktop Store Brand Chip (Hidden on mobile) */}
            <div
              onClick={() => setActiveTab('welcome')}
              className="hidden xl:flex items-center space-x-2.5 px-3 py-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/60 cursor-pointer transition select-none shrink-0"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center text-white shadow-xs">
                <Store className="w-4 h-4" />
              </div>
              <div className="leading-tight">
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-bold text-zinc-900 dark:text-white truncate max-w-[130px]">
                    {settings.storeName || 'FreshMart'}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800">
                    POS
                  </span>
                </div>
                <p className="text-[10px] font-mono text-zinc-500 truncate max-w-[130px]">
                  ID: {settings.businessId || 'demo'}
                </p>
              </div>
            </div>

            {/* Primary 5 Navigation Tabs (Responsive) */}
            <div className="flex items-center justify-around flex-1 max-w-2xl mx-auto gap-0.5 sm:gap-1">
              {navButtons.map((btn) => {
                const Icon = btn.icon;
                const isActive =
                  activeTab === btn.id ||
                  (btn.id === 'ai_insights' && activeTab === 'gemini');

                return (
                  <button
                    key={btn.id}
                    id={`bottom-nav-${btn.id}`}
                    onClick={() => setActiveTab(btn.id)}
                    type="button"
                    className={`relative flex flex-col items-center justify-center flex-1 py-1 px-1 sm:px-2 rounded-xl transition-all duration-150 min-h-[44px] touch-manipulation ${
                      isActive
                        ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/40'
                    }`}
                  >
                    <div className="relative flex items-center justify-center">
                      <Icon
                        className={`w-5 h-5 transition-transform duration-200 ${
                          isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
                        }`}
                      />
                      {btn.badge !== undefined && (
                        <span
                          className={`absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-extrabold flex items-center justify-center shadow-xs animate-in zoom-in-75 ${
                            btn.badgeColor || 'bg-emerald-600 text-white'
                          }`}
                        >
                          {btn.badge > 99 ? '99+' : btn.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] sm:text-[11px] tracking-tight mt-0.5 whitespace-nowrap">
                      {btn.label}
                    </span>

                    {/* Active Indicator bar */}
                    {isActive && (
                      <span className="absolute -bottom-1 w-6 h-1 bg-emerald-600 dark:bg-emerald-400 rounded-full" />
                    )}
                  </button>
                );
              })}

              {/* Mobile "More" Drawer Button (visible only on small screens < md) */}
              <button
                type="button"
                id="bottom-nav-more-btn"
                onClick={() => setMobileMenuOpen(true)}
                className="relative flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition min-h-[44px] md:hidden touch-manipulation"
              >
                <div className="relative">
                  <MoreHorizontal className="w-5 h-5 stroke-[1.8]" />
                  {totalAlertsCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-zinc-900" />
                  )}
                </div>
                <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
                  More
                </span>
              </button>
            </div>

            {/* Desktop & Tablet Utility Controls (Hidden on small mobile) */}
            <div className="hidden md:flex items-center space-x-1.5 pl-2 border-l border-zinc-200 dark:border-zinc-800 shrink-0">
              {/* Automated Alerts Bell */}
              <button
                id="bottom-bar-alerts-btn"
                type="button"
                onClick={onOpenAlerts}
                title="View Low Stock & Inventory Alerts"
                className="relative p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                <Bell className="w-4 h-4" />
                {totalAlertsCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-zinc-900" />
                )}
              </button>

              {/* Supabase Cloud Sync Status Button */}
              <button
                id="bottom-bar-supabase-btn"
                type="button"
                onClick={onOpenSupabase}
                title={
                  supabaseConnected
                    ? 'Supabase Cloud Database Connected'
                    : 'Configure Supabase Cloud Database'
                }
                className="relative p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                <Database className="w-4 h-4" />
                <span
                  className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2 ring-white dark:ring-zinc-900 ${
                    supabaseConnected ? 'bg-emerald-500' : 'bg-amber-400'
                  }`}
                />
              </button>

              {/* Light / Dark Mode Toggle */}
              <button
                id="bottom-bar-theme-btn"
                type="button"
                onClick={toggleTheme}
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
                className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-zinc-600" />
                )}
              </button>

              {/* Demo Mode Button / Indicator */}
              {settings.isDemoMode ? (
                <span className="px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-[10px] font-bold flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                  <span>Demo</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={loadDemoStore}
                  title="Switch to Demo Store"
                  className="px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-[10px] font-semibold flex items-center space-x-1 transition"
                >
                  <Play className="w-3 h-3 text-emerald-500 fill-emerald-500" />
                  <span>Try Demo</span>
                </button>
              )}

              {/* Quick 1-Click Role Toggle */}
              <button
                id="bottom-bar-role-toggle"
                type="button"
                onClick={() =>
                  switchRole(currentUser.role === 'manager' ? 'cashier' : 'manager')
                }
                title={`Click to switch role. Current: ${currentUser.role.toUpperCase()}`}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition flex items-center space-x-1.5 ${
                  currentUser.role === 'manager'
                    ? 'bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300'
                    : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                }`}
              >
                {currentUser.role === 'manager' ? (
                  <Shield className="w-3.5 h-3.5 text-purple-600" />
                ) : (
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                )}
                <span className="capitalize text-[11px]">{currentUser.role}</span>
              </button>

              {/* PIN / Lock Button */}
              <button
                id="bottom-bar-auth-btn"
                type="button"
                onClick={onOpenAuth}
                title="Staff Authentication & PIN Keypad"
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                <KeyRound className="w-4 h-4 text-zinc-500" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile "More" Bottom Sheet Modal */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className="w-full sm:max-w-md bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-200 max-h-[85vh] flex flex-col"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
          >
            {/* Header */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-white leading-tight">
                    {settings.storeName || 'FreshMart'}
                  </h4>
                  <p className="text-[11px] text-zinc-500 font-mono">
                    ID: {settings.businessId || 'demo'} • User: {currentUser.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions Grid */}
            <div className="p-4 space-y-3 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2.5">
                {/* 1-Click Role Switch */}
                <button
                  type="button"
                  onClick={() => {
                    switchRole(currentUser.role === 'manager' ? 'cashier' : 'manager');
                    setMobileMenuOpen(false);
                  }}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition ${
                    currentUser.role === 'manager'
                      ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {currentUser.role === 'manager' ? (
                      <Shield className="w-5 h-5 text-purple-600" />
                    ) : (
                      <UserCheck className="w-5 h-5 text-emerald-600" />
                    )}
                    <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-white/80 dark:bg-zinc-800/80">
                      Active
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs font-bold capitalize">{currentUser.role} Mode</p>
                    <p className="text-[10px] opacity-75">Tap to switch role</p>
                  </div>
                </button>

                {/* Staff PIN Keypad */}
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth();
                  }}
                  className="p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left flex flex-col justify-between transition"
                >
                  <KeyRound className="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
                  <div className="mt-2">
                    <p className="text-xs font-bold text-zinc-900 dark:text-white">Staff PIN Keypad</p>
                    <p className="text-[10px] text-zinc-500">Switch user account</p>
                  </div>
                </button>

                {/* Theme Toggle */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left flex flex-col justify-between transition"
                >
                  {theme === 'dark' ? (
                    <Sun className="w-5 h-5 text-amber-500" />
                  ) : (
                    <Moon className="w-5 h-5 text-zinc-600" />
                  )}
                  <div className="mt-2">
                    <p className="text-xs font-bold text-zinc-900 dark:text-white">
                      {theme === 'dark' ? 'Light Theme' : 'Dark Theme'}
                    </p>
                    <p className="text-[10px] text-zinc-500">Toggle display mode</p>
                  </div>
                </button>

                {/* Supabase Cloud Sync */}
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenSupabase();
                  }}
                  className="p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left flex flex-col justify-between transition"
                >
                  <div className="flex items-center justify-between">
                    <Database className="w-5 h-5 text-emerald-600" />
                    <span
                      className={`w-2 h-2 rounded-full ${
                        supabaseConnected ? 'bg-emerald-500' : 'bg-amber-400'
                      }`}
                    />
                  </div>
                  <div className="mt-2">
                    <p className="text-xs font-bold text-zinc-900 dark:text-white">Supabase Cloud</p>
                    <p className="text-[10px] text-zinc-500">
                      {supabaseConnected ? 'Connected' : 'Configure DB'}
                    </p>
                  </div>
                </button>
              </div>

              {/* Low Stock / Inventory Alerts Full Row */}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAlerts();
                }}
                className="w-full p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-between transition"
              >
                <div className="flex items-center space-x-2.5">
                  <Bell className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                  <span className="text-xs font-bold text-zinc-900 dark:text-white">
                    Inventory & Expiry Alerts
                  </span>
                </div>
                {totalAlertsCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                    {totalAlertsCount} alerts
                  </span>
                ) : (
                  <span className="text-[10px] text-zinc-400">All clear</span>
                )}
              </button>

              {/* Try Demo Mode Switch */}
              {!settings.isDemoMode && (
                <button
                  type="button"
                  onClick={() => {
                    loadDemoStore();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full p-3 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30 hover:bg-emerald-100/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-between transition"
                >
                  <div className="flex items-center space-x-2.5">
                    <Play className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                    <span className="text-xs font-bold">Load FreshMart Demo Store</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-200 dark:bg-emerald-900 font-bold">
                    Try POS
                  </span>
                </button>
              )}

              {/* Secondary Pages (About & Terms) */}
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-around text-xs text-zinc-500">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('about');
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center space-x-1.5 hover:text-zinc-900 dark:hover:text-white py-1"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>About Us</span>
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('legal');
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center space-x-1.5 hover:text-zinc-900 dark:hover:text-white py-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>T&C & Privacy</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
