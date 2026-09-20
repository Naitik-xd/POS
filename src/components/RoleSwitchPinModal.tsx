import React, { useState, useEffect } from 'react';
import {
  Shield,
  UserCheck,
  X,
  Delete,
  Lock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { UserRole } from '../types';

interface RoleSwitchPinModalProps {
  isOpen: boolean;
  targetRole: UserRole;
  onClose: () => void;
  onSuccess: () => void;
}

export const RoleSwitchPinModal: React.FC<RoleSwitchPinModalProps> = ({
  isOpen,
  targetRole,
  onClose,
  onSuccess,
}) => {
  const { staffList, switchRole, switchUser, showToast, settings } = usePOS();
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setErrorMsg('');
      setIsShaking(false);
    }
  }, [isOpen, targetRole]);

  if (!isOpen) return null;

  const isSwitchingToManager = targetRole === 'manager' || targetRole === 'admin';

  // Demo hint PINs
  const demoHint = isSwitchingToManager ? '9999' : '1234';

  const handleKeyPress = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMsg('');
      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const verifyPin = (pinToTest: string) => {
    // 1. Check Demo hardcoded PINs first
    if (isSwitchingToManager && pinToTest === '9999') {
      const managerUser = staffList.find((s) => s.role === 'manager' || s.role === 'admin') || {
        id: 'usr-manager-1',
        name: 'Sarah Jenkins',
        email: 'manager@freshmart.local',
        role: 'manager' as UserRole,
        pin: '9999',
      };
      switchRole('manager');
      switchUser(managerUser.id);
      showToast('Manager Access Granted', 'Switched to Manager Mode with full permissions.', 'success');
      onSuccess();
      return;
    }

    if (!isSwitchingToManager && pinToTest === '1234') {
      const cashierUser = staffList.find((s) => s.role === 'cashier') || {
        id: 'usr-cashier-1',
        name: 'Alex Rivera',
        email: 'alex.cashier@freshmart.local',
        role: 'cashier' as UserRole,
        pin: '1234',
      };
      switchRole('cashier');
      switchUser(cashierUser.id);
      showToast('Cashier Access Granted', 'Switched to Cashier Mode (Read-only inventory).', 'success');
      onSuccess();
      return;
    }

    // 2. Check dynamic staff accounts in context
    const matchingStaff = staffList.find(
      (s) =>
        s.pin === pinToTest &&
        (isSwitchingToManager ? s.role === 'manager' || s.role === 'admin' : s.role === 'cashier')
    );

    if (matchingStaff) {
      switchRole(matchingStaff.role);
      switchUser(matchingStaff.id);
      showToast(
        `${isSwitchingToManager ? 'Manager' : 'Cashier'} Access Granted`,
        `Logged in as ${matchingStaff.name}.`,
        'success'
      );
      onSuccess();
    } else {
      setIsShaking(true);
      setErrorMsg(`Invalid ${isSwitchingToManager ? 'Manager' : 'Cashier'} PIN. Access denied.`);
      setTimeout(() => {
        setPin('');
        setIsShaking(false);
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div
        className={`bg-white dark:bg-zinc-900 rounded-3xl max-w-sm w-full p-5 sm:p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4 ${
          isShaking ? 'animate-bounce' : ''
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white ${
                isSwitchingToManager
                  ? 'bg-purple-600 shadow-purple-600/20 shadow-md'
                  : 'bg-emerald-600 shadow-emerald-600/20 shadow-md'
              }`}
            >
              {isSwitchingToManager ? <Shield className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-white leading-tight">
                Switch to {isSwitchingToManager ? 'Manager' : 'Cashier'}
              </h3>
              <p className="text-xs text-zinc-500">
                Security PIN verification required
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PIN Input Dots Visualizer */}
        <div className="text-center py-2">
          <div className="flex justify-center items-center space-x-3 my-2">
            {[0, 1, 2, 3].map((index) => {
              const isFilled = pin.length > index;
              return (
                <div
                  key={index}
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                    isFilled
                      ? isSwitchingToManager
                        ? 'bg-purple-600 border-purple-600 scale-125'
                        : 'bg-emerald-600 border-emerald-600 scale-125'
                      : 'border-zinc-300 dark:border-zinc-700 bg-transparent'
                  }`}
                />
              );
            })}
          </div>

          {errorMsg ? (
            <div className="flex items-center justify-center space-x-1.5 text-xs text-rose-500 font-semibold mt-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          ) : (
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2">
              Enter 4-digit PIN for {isSwitchingToManager ? 'Manager' : 'Cashier'}{' '}
              <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                (Demo PIN: {demoHint})
              </span>
            </p>
          )}
        </div>

        {/* 0-9 Keypad */}
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyPress(digit)}
              className="py-3 sm:py-3.5 rounded-2xl bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/70 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 text-base sm:text-lg font-bold text-zinc-800 dark:text-zinc-100 active:scale-95 transition shadow-2xs"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={onClose}
            className="py-3 sm:py-3.5 rounded-2xl text-xs font-semibold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="py-3 sm:py-3.5 rounded-2xl bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/70 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 text-base sm:text-lg font-bold text-zinc-800 dark:text-zinc-100 active:scale-95 transition shadow-2xs"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            title="Backspace"
            className="py-3 sm:py-3.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 flex items-center justify-center transition active:scale-95"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Demo PIN Auto-Fill Helper */}
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500">
          <span>Demo Quick Login:</span>
          <button
            type="button"
            onClick={() => verifyPin(demoHint)}
            className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Use Demo PIN ({demoHint}) →
          </button>
        </div>
      </div>
    </div>
  );
};
