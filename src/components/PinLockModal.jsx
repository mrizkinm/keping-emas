import React, { useState, useEffect } from 'react';
import { Lock, Delete } from 'lucide-react';
import { haptic } from '../utils/haptics';

const LOCKOUT_STORAGE_KEY = 'brankas_pin_lockout_until_v1';
const ATTEMPTS_STORAGE_KEY = 'brankas_pin_failed_attempts_v1';

export default function PinLockModal({ onUnlock }) {
  const [entered, setEntered] = useState('');
  const [error, setError] = useState(false);

  const [failedAttempts, setFailedAttempts] = useState(() => {
    try {
      return parseInt(localStorage.getItem(ATTEMPTS_STORAGE_KEY) || '0', 10);
    } catch {
      return 0;
    }
  });

  const [lockoutTimer, setLockoutTimer] = useState(() => {
    try {
      const until = parseInt(localStorage.getItem(LOCKOUT_STORAGE_KEY) || '0', 10);
      const remaining = Math.ceil((until - Date.now()) / 1000);
      return remaining > 0 ? remaining : 0;
    } catch {
      return 0;
    }
  });

  // Rate limiting countdown
  useEffect(() => {
    if (lockoutTimer <= 0) return;
    const interval = setInterval(() => {
      setLockoutTimer((prev) => {
        if (prev <= 1) {
          try {
            localStorage.removeItem(LOCKOUT_STORAGE_KEY);
            localStorage.removeItem(ATTEMPTS_STORAGE_KEY);
          } catch {
            // ignore
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTimer]);

  const handleDigit = async (digit) => {
    if (lockoutTimer > 0 || entered.length >= 4) return;
    haptic('light');
    const next = entered + digit;
    setEntered(next);
    setError(false);

    if (next.length === 4) {
      const success = await onUnlock(next);
      if (success) {
        try {
          localStorage.removeItem(LOCKOUT_STORAGE_KEY);
          localStorage.removeItem(ATTEMPTS_STORAGE_KEY);
        } catch {
          // ignore
        }
        haptic('success');
      } else {
        haptic('warning');
        setError(true);
        const newAttempts = failedAttempts + 1;
        if (newAttempts >= 5) {
          const unlockAt = Date.now() + 30000;
          try {
            localStorage.setItem(LOCKOUT_STORAGE_KEY, String(unlockAt));
            localStorage.setItem(ATTEMPTS_STORAGE_KEY, '0');
          } catch {
            // ignore
          }
          setLockoutTimer(30);
          setFailedAttempts(0);
        } else {
          try {
            localStorage.setItem(ATTEMPTS_STORAGE_KEY, String(newAttempts));
          } catch {
            // ignore
          }
          setFailedAttempts(newAttempts);
        }
        setTimeout(() => setEntered(''), 350);
      }
    }
  };

  const handleDelete = () => {
    if (lockoutTimer > 0) return;
    haptic('light');
    setEntered((prev) => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Kunci PIN Keping Emas"
      className="fixed inset-0 z-50 bg-[#0C0D0E] flex flex-col items-center justify-center p-6 text-[#F4F5F6]"
    >
      <div className="w-12 h-12 rounded-xl border border-[#26292D] bg-[#16181A] flex items-center justify-center mb-5 text-[#D4A346]">
        <Lock className="w-5 h-5 stroke-[1.5]" />
      </div>

      <h2 className="text-base font-semibold text-[#F4F5F6] mb-1">Keping Emas Terkunci</h2>
      <p className="text-xs text-[#8B9097] mb-8">
        {lockoutTimer > 0
          ? `Terlalu banyak percobaan. Tunggu ${lockoutTimer} detik.`
          : 'Masukkan 4 digit PIN keamanan Anda'}
      </p>

      {/* Dots Indicator */}
      <div className="flex gap-4 mb-10">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full border transition-all ${
              entered.length > i
                ? error
                  ? 'bg-[#F87171] border-[#F87171]'
                  : 'bg-[#D4A346] border-[#D4A346]'
                : 'border-[#26292D] bg-[#16181A]'
            }`}
          />
        ))}
      </div>

      {error && lockoutTimer === 0 && (
        <p className="text-xs font-medium text-[#F87171] mb-6">
          PIN salah. Percobaan ke-{failedAttempts}/5.
        </p>
      )}

      {/* Numeric Keypad */}
      <div className="w-full max-w-xs grid grid-cols-3 gap-2.5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            type="button"
            disabled={lockoutTimer > 0}
            onClick={() => handleDigit(String(num))}
            className="h-14 rounded-xl bg-[#16181A] border border-[#26292D] text-lg font-semibold text-[#F4F5F6] tabular-nums disabled:opacity-30 active:bg-[#26292D] active:scale-95 transition-all flex items-center justify-center"
          >
            {num}
          </button>
        ))}
        <div />
        <button
          type="button"
          disabled={lockoutTimer > 0}
          onClick={() => handleDigit('0')}
          className="h-14 rounded-xl bg-[#16181A] border border-[#26292D] text-lg font-semibold text-[#F4F5F6] tabular-nums disabled:opacity-30 active:bg-[#26292D] active:scale-95 transition-all flex items-center justify-center"
        >
          0
        </button>
        <button
          type="button"
          aria-label="Hapus digit PIN"
          disabled={lockoutTimer > 0}
          onClick={handleDelete}
          className="h-14 rounded-xl bg-[#16181A] border border-[#26292D] text-[#8B9097] active:text-[#F4F5F6] active:scale-95 transition-all flex items-center justify-center"
        >
          <Delete className="w-5 h-5 stroke-[1.5]" />
        </button>
      </div>
    </div>
  );
}
