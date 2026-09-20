import React, { useState } from 'react';
import {
  ShoppingCart,
  Package,
  TrendingUp,
  Sparkles,
  Info,
  ShieldCheck,
  Shield,
  Sun,
  Moon,
  Bell,
  User,
  Menu,
  X,
  ChevronDown,
  Store,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { ActiveTab } from '../types';

interface NavbarProps {
  onOpenAlerts: () => void;
  onOpenAuth: () => void;
  onOpenSupabase: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAlerts, onOpenAuth }) => {
  const {
    activeTab,
    setActiveTab,
    theme,
    toggleTheme,
    currentUser,
    switchRole,
    alerts,
    cartTotals,
    settings,
  } = usePOS();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'welcome',
      label: 'Welcome & Setup',
      icon: <Store className="w-4 h-4 text-emerald-500" />,
    },
    {
      id: 'billing',
      label: 'Billing Counter',
      icon: <ShoppingCart className="w-4 h-4" />,
      badge: cartTotals.totalUnits > 0 ? cartTotals.totalUnits : undefined,
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: <Package className="w-4 h-4" />,
    },
    {
      id: 'sales',
      label: 'Sales & Analytics',
      icon: <TrendingUp className="w-4 h-4" />,
    },
    {
      id: 'ai_insights',
      label: 'Gemini AI Insights',
      icon: <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />,
    },
    {
      id: 'about',
      label: 'About Us',
      icon: <Info className="w-4 h-4" />,
    },
    {
      id: 'legal_terms',
      label: 'T&C / Privacy',
      icon: <ShieldCheck className="w-4 h-4" />,
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Store Title */}
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => setActiveTab(settings.isOnboarded ? 'billing' : 'welcome')}
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center text-white shadow-sm shadow-emerald-600/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-extrabold tracking-tight text-zinc-900 dark:text-white truncate max-w-[220px]">
                  {settings.storeName || 'FreshMart'}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 font-semibold border border-emerald-300 dark:border-emerald-800">
                  POS
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:block truncate max-w-[200px]">
                {settings.tagline}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs font-semibold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-emerald-600 dark:bg-emerald-400 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Tools: Role Switcher, Alerts, Theme toggle, Staff Profile */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Quick 1-Click Role Toggle Pill */}
            <button
              id="btn-quick-role-toggle"
              onClick={() => switchRole(currentUser.role === 'manager' ? 'cashier' : 'manager')}
              title={`Active: ${currentUser.role.toUpperCase()} (Click to toggle role)`}
              className={`hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                currentUser.role === 'manager'
                  ? 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300'
                  : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="capitalize">{currentUser.role} Mode</span>
              <span className="text-[10px] opacity-70 underline ml-0.5">Switch</span>
            </button>

            {/* Inventory Alerts Bell */}
            <button
              id="btn-open-alerts"
              onClick={onOpenAlerts}
              title="Automated Inventory Alerts"
              className="relative p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {alerts.length > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-zinc-900 animate-bounce">
                  {alerts.length}
                </span>
              )}
            </button>

            {/* Light / Dark Mode Switcher */}
            <button
              id="btn-theme-toggle"
              onClick={toggleTheme}
              aria-label="Toggle light or dark theme"
              className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-zinc-700" />
              ) : (
                <Sun className="w-5 h-5 text-amber-400" />
              )}
            </button>

            {/* Active Cashier / Manager User Pill */}
            <div className="relative">
              <button
                id="btn-user-menu"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-2 pl-2 pr-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 bg-zinc-50 dark:bg-zinc-800/80 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                  {currentUser.name[0]}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-semibold text-zinc-900 dark:text-white leading-none">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium capitalize">
                    {currentUser.role}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </button>

              {/* User Dropdown */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
                    <p className="text-xs font-semibold text-zinc-900 dark:text-white">{currentUser.name}</p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{currentUser.email}</p>
                    <span
                      className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        currentUser.role === 'manager'
                          ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                          : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      }`}
                    >
                      {currentUser.role} Account
                    </span>
                  </div>

                  <div className="py-1">
                    <button
                      id="btn-dropdown-toggle-role"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        switchRole(currentUser.role === 'manager' ? 'cashier' : 'manager');
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left font-medium"
                    >
                      <Shield className="w-4 h-4 text-purple-500" />
                      <span>Switch to {currentUser.role === 'manager' ? 'Cashier' : 'Manager'}</span>
                    </button>
                    <button
                      id="btn-switch-cashier"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenAuth();
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left"
                    >
                      <User className="w-4 h-4 text-zinc-500" />
                      <span>Staff List & PIN Keypad</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Hamburger */}
            <button
              id="btn-mobile-menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-zinc-200 dark:border-zinc-800 py-3 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                id={`mobile-nav-${item.id}`}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
                  activeTab === item.id
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}

            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-3">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  switchRole(currentUser.role === 'manager' ? 'cashier' : 'manager');
                }}
                className="flex items-center space-x-2 text-xs font-semibold text-purple-600 dark:text-purple-400"
              >
                <Shield className="w-4 h-4" />
                <span>Switch to {currentUser.role === 'manager' ? 'Cashier' : 'Manager'}</span>
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth();
                }}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400"
              >
                Staff Login
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
