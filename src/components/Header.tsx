import React from 'react';
import { PlusCircle, Share2, Shield, Smartphone } from 'lucide-react';

interface HeaderProps {
  currentTab: 'game' | 'payment' | 'admin' | 'rules';
  setCurrentTab: (tab: 'game' | 'payment' | 'admin' | 'rules') => void;
  onOpenCreate: () => void;
  onOpenJoin: () => void;
  roomId?: string;
  isHost: boolean;
  onShareRoom: () => void;
  onOpenLinks?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  onOpenCreate,
  onOpenJoin,
  roomId,
  isHost,
  onShareRoom,
  onOpenLinks,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-neutral-900/95 border-b border-white/10 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Brand Wordmark (Single text element) */}
      <a
        href="/"
        className="text-lg font-black tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2"
      >
        <span className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
          VF
        </span>
        <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent">
          دومينو كاش
        </span>
        <span className="text-xs text-neutral-400 font-mono hidden sm:inline">Arena</span>
      </a>

      {/* Zone 2: 4 Clean Navigation Links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-300">
        <button
          type="button"
          onClick={() => setCurrentTab('game')}
          className={`hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            currentTab === 'game' ? 'text-amber-400 font-bold' : ''
          }`}
        >
          طاولة اللعب
        </button>
        <button
          type="button"
          onClick={() => setCurrentTab('payment')}
          className={`hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
            currentTab === 'payment' ? 'text-amber-400 font-bold' : ''
          }`}
        >
          <span>بوابة فودافون كاش</span>
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        </button>
        {isHost && (
          <button
            type="button"
            onClick={() => setCurrentTab('admin')}
            className={`hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1 ${
              currentTab === 'admin' ? 'text-amber-400 font-bold' : ''
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>لوحة المنظم</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => setCurrentTab('rules')}
          className={`hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            currentTab === 'rules' ? 'text-amber-400 font-bold' : ''
          }`}
        >
          شروط الرهان والقواعد
        </button>
      </nav>

      {/* Zone 3: 1 Primary Action */}
      <div className="flex items-center gap-2.5 shrink-0">
        {roomId ? (
          <button
            type="button"
            onClick={onOpenLinks || onShareRoom}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors whitespace-nowrap shrink-0 shadow-md cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>روابط ومشاركة ({roomId})</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenJoin}
              className="px-3 py-2 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              انضمام لغرفة
            </button>
            <button
              type="button"
              onClick={onOpenCreate}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-xl transition-colors whitespace-nowrap shrink-0 shadow-md cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>إنشاء غرفة جديدة</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
