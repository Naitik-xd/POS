import React, { useState } from 'react';
import {
  Store,
  Lock,
  ArrowRight,
  X,
  Eye,
  EyeOff,
  Sparkles,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';

interface BusinessLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

export const BusinessLoginModal: React.FC<BusinessLoginModalProps> = ({
  isOpen,
  onClose,
  onSwitchToRegister,
}) => {
  const { loginBusiness, registeredBusinesses, loadDemoStore, showToast } = usePOS();

  const [businessId, setBusinessId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId.trim() || !password.trim()) {
      showToast('Required Fields', 'Please enter your Business ID and Password.', 'warning');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const success = loginBusiness(businessId, password);
      setIsSubmitting(false);
      if (success) {
        onClose();
      }
    }, 300);
  };

  const handleFillDemo = () => {
    setBusinessId('demo_freshmart');
    setPassword('demo1234');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-md w-full my-auto overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-zinc-900 dark:text-white">
                Business Login
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Enter your Store ID and Admin Password
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {/* Quick Demo Pre-fill helper banner */}
          <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2 text-xs text-emerald-800 dark:text-emerald-300">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Want to test? Use <strong>demo_freshmart</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={handleFillDemo}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shrink-0 transition"
            >
              Fill Demo ID
            </button>
          </div>

          {/* Business ID input */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Business ID / Handle <span className="text-emerald-600">*</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                id="input-business-login-id"
                type="text"
                required
                autoFocus
                placeholder="e.g. demo_freshmart or your_store_id"
                value={businessId}
                onChange={(e) => setBusinessId(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>
          </div>

          {/* Password input */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Admin / Manager Password <span className="text-emerald-600">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                id="input-business-login-password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Known Registered Businesses Quick Picker if any exist */}
          {registeredBusinesses.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Saved Store IDs On This Device (Requires Password):
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {registeredBusinesses.map((b) => (
                  <button
                    key={b.businessId}
                    type="button"
                    onClick={() => {
                      setBusinessId(b.businessId);
                      setPassword('');
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium transition flex items-center space-x-1"
                    title={`Select ${b.storeName} ID (password required to enter)`}
                  >
                    <span>{b.storeName}</span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      ({b.businessId})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              id="btn-submit-business-login"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-sm shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Verifying credentials...</span>
              ) : (
                <>
                  <span>Login & Open POS Terminal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Footer alternatives */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                onClose();
                loadDemoStore();
              }}
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
            >
              ⚡ Explore Instant Demo POS
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onSwitchToRegister();
              }}
              className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium"
            >
              Don't have an ID? <strong>Register Business</strong>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
