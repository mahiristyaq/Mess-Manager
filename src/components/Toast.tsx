import React from 'react';
import { useMess } from '../context/MessContext';
import { CheckCircle2 } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toastMessage } = useMess();

  if (!toastMessage) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#064e3b] border border-[#10b981] rounded-2xl px-4 py-2.5 max-w-[90vw] text-xs sm:text-sm text-emerald-100 shadow-xl flex items-center gap-2 animate-fade-in pointer-events-none">
      <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
      <span>{toastMessage}</span>
    </div>
  );
};
