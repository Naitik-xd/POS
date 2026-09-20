import React, { useState } from 'react';
import {
  ShieldCheck,
  LogOut,
  Delete,
  UserCheck,
  Shield,
  KeyRound,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { UserRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    staffList,
    loginWithPin,
    loginWithEmail,
    logoutUser,
    switchUser,
    switchRole,
    showToast,
  } = usePOS();

  const [mode, setMode] = useState<'pin' | 'email'>('pin');
  const [pinInput, setPinInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  if (!isOpen) return null;

  const handleKeypadPress = (val: string) => {
    if (pinInput.length < 4) {
      const nextPin = pinInput + val;
      setPinInput(nextPin);
      if (nextPin.length === 4) {
        attemptPinLogin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setPinInput((prev) => prev.slice(0, -1));
  };

  const attemptPinLogin = (pinToTest: string) => {
    const success = loginWithPin(pinToTest);
    if (success) {
      setPinInput('');
      onClose();
    } else {
      setPinInput('');
      showToast('Invalid PIN', 'The 4-digit PIN does not match any registered employee or manager.', 'error');
    }
  };

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const success = loginWithEmail(emailInput, passwordInput);
    if (success) {
      setEmailInput('');
      setPasswordInput('');
      onClose();
    } else {
      showToast('Login Failed', 'Invalid email or password.', 'error');
    }
  };

  const handleSelectStaff = (userId: string) => {
    switchUser(userId);
    onClose();
  };

  const handleQuickRoleSwitch = (role: UserRole) => {
    switchRole(role);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full p-5 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                Employee & Role Authentication
              </h3>
              <p className="text-xs text-zinc-500">
                {currentUser ? `Currently: ${currentUser.name} (${currentUser.role.toUpperCase()})` : 'Select operator or enter PIN'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg text-sm"
          >
            ✕
          </button>
        </div>

        {/* Current Active User Banner */}
        {currentUser && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-xs text-zinc-900 dark:text-white">
                  {currentUser.name}
                </p>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      currentUser.role === 'manager' || currentUser.role === 'admin'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}
                  >
                    {currentUser.role}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    PIN: {currentUser.pin}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => logoutUser()}
              title="Lock POS"
              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition text-xs font-semibold flex items-center space-x-1 border border-rose-200 dark:border-rose-900"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Lock</span>
            </button>
          </div>
        )}

        {/* 1-Tap Quick Role Toggle */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            Quick Role Switch:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              id="btn-switch-to-manager"
              onClick={() => handleQuickRoleSwitch('manager')}
              className={`p-2.5 rounded-xl border text-left transition flex items-center space-x-2.5 ${
                currentUser?.role === 'manager'
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/50 text-purple-900 dark:text-purple-200 ring-1 ring-purple-600'
                  : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              <Shield className="w-4 h-4 text-purple-600" />
              <div>
                <p className="text-xs font-bold">Manager Mode</p>
                <p className="text-[10px] text-zinc-500">Add/Edit/Del + Staff</p>
              </div>
            </button>

            <button
              type="button"
              id="btn-switch-to-cashier"
              onClick={() => handleQuickRoleSwitch('cashier')}
              className={`p-2.5 rounded-xl border text-left transition flex items-center space-x-2.5 ${
                currentUser?.role === 'cashier'
                  ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-600'
                  : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <div>
                <p className="text-xs font-bold">Cashier Mode</p>
                <p className="text-[10px] text-zinc-500">POS Checkout Only</p>
              </div>
            </button>
          </div>
        </div>

        {/* Staff Profile Switcher list */}
        <div className="space-y-1.5 pt-1">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            All Registered Staff ({staffList.length}):
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
            {staffList.map((st) => {
              const isSelected = currentUser?.id === st.id;
              return (
                <button
                  key={st.id}
                  id={`btn-select-staff-${st.id}`}
                  onClick={() => handleSelectStaff(st.id)}
                  className={`p-2 rounded-xl border text-left flex items-center justify-between text-xs transition ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 font-bold'
                      : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="truncate">
                    <p className="truncate font-semibold">{st.name}</p>
                    <p className="text-[10px] text-zinc-500 capitalize">{st.role} • PIN: {st.pin}</p>
                  </div>
                  {isSelected && <span className="text-emerald-600 text-xs">●</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mode Switcher: PIN Keypad vs Email */}
        <div className="grid grid-cols-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setMode('pin')}
            className={`py-1 rounded-lg transition ${
              mode === 'pin'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400'
            }`}
          >
            4-Digit PIN
          </button>
          <button
            onClick={() => setMode('email')}
            className={`py-1 rounded-lg transition ${
              mode === 'email'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400'
            }`}
          >
            Email Login
          </button>
        </div>

        {/* PIN KEYPAD */}
        {mode === 'pin' && (
          <div className="space-y-3">
            <div className="flex justify-center space-x-3 py-1">
              {[0, 1, 2, 3].map((idx) => {
                const isFilled = pinInput.length > idx;
                return (
                  <div
                    key={idx}
                    className={`w-3.5 h-3.5 rounded-full transition-all ${
                      isFilled
                        ? 'bg-emerald-600 scale-110 shadow-xs'
                        : 'border-2 border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800'
                    }`}
                  />
                );
              })}
            </div>

            <div className="grid grid-cols-3 gap-1.5 max-w-[240px] mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    if (k === 'C') setPinInput('');
                    else if (k === '⌫') handleBackspace();
                    else handleKeypadPress(k);
                  }}
                  className="h-10 rounded-xl bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-semibold text-sm transition active:scale-95 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center"
                >
                  {k === '⌫' ? <Delete className="w-4 h-4 text-zinc-500" /> : k}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* EMAIL LOGIN */}
        {mode === 'email' && (
          <form onSubmit={handleEmailLogin} className="space-y-2.5">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Employee Email
              </label>
              <input
                type="email"
                required
                placeholder="manager@freshmart.pos"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition"
            >
              Sign In
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
