import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share2, PlusSquare, X, Smartphone } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'header' | 'banner' | 'card';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState<boolean>(false);

  // If already installed, don't show
  if (isInstalled) {
    return null;
  }

  // Not installable & not iOS
  if (!isInstallable && !isIOS) {
    return null;
  }

  const handleAction = () => {
    if (isInstallable) {
      install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  const renderButton = () => {
    if (variant === 'header') {
      return (
        <button
          type="button"
          onClick={handleAction}
          className="btn text-xs py-1.5 px-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold border-emerald-500/80 shadow-md flex items-center gap-1.5 animate-pulse"
          title="ফোনে বা পিসিতে অ্যাপ হিসেবে ইনস্টল করুন"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">অ্যাপ ইনস্টল</span>
          <span className="sm:hidden">ইনস্টল</span>
        </button>
      );
    }

    if (variant === 'banner') {
      return (
        <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-sky-950/80 border border-emerald-600/40 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="icon-square bg-emerald-900/60 text-emerald-300 shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-extrabold text-xs sm:text-sm text-white truncate">
                মেস ম্যানেজার অ্যাপ ইনস্টল করুন
              </p>
              <p className="muted text-[11px] truncate">
                ফোন বা কম্পিউটারে সরাসরি অ্যাপের মতো ব্যবহার করুন
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAction}
            className="btn primary text-xs py-1.5 px-3 shrink-0 font-bold"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ইনস্টল</span>
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      {renderButton()}

      {/* iOS Installation Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-4 overflow-hidden">
          <div className="w-full max-w-[calc(100vw-2rem)] sm:max-w-sm rounded-3xl bg-[#101d2d] border border-slate-700/80 p-4 sm:p-5 shadow-2xl space-y-4 box-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="icon-square bg-emerald-900/50 text-emerald-300">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h3 className="text-base font-extrabold text-white">iPhone / iPad-এ ইনস্টল</h3>
              </div>
              <button
                type="button"
                className="btn py-1 px-2 text-xs"
                onClick={() => setShowIOSGuide(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
              <div className="flex items-start gap-2.5">
                <span className="font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded-lg text-xs shrink-0">১</span>
                <p>
                  Safari ব্রাউজারের নিচের <Share2 className="w-3.5 h-3.5 inline mx-1 text-sky-400" /> <strong>Share</strong> বাটনে চাপ দিন।
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded-lg text-xs shrink-0">২</span>
                <p>
                  নিচের দিকে স্ক্রল করে <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-emerald-400" /> <strong>Add to Home Screen</strong> চাপুন।
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded-lg text-xs shrink-0">৩</span>
                <p>
                  উপরে ডানপাশে <strong>Add</strong> বাটনে ট্যাপ করলে অ্যাপটি হোম স্ক্রিনে ইনস্টল হয়ে যাবে!
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="btn primary w-full py-2 text-xs font-bold"
            >
              বুঝেছি, বন্ধ করুন
            </button>
          </div>
        </div>
      )}
    </>
  );
};
