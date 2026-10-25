import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { RoomState } from '../types/domino';
import { Trophy, Award, Smartphone, RefreshCw, CheckCircle2 } from 'lucide-react';
import { playVictorySound } from '../utils/soundEffects';

interface WinnerModalProps {
  room: RoomState;
  playerIndex: number | null;
  onNextRound: () => void;
  isHost: boolean;
}

export const WinnerModal: React.FC<WinnerModalProps> = ({
  room,
  playerIndex,
  onNextRound,
  isHost,
}) => {
  const winnerIndex = room.matchWinnerIndex ?? room.winnerPlayerIndex;
  const isMatchOver = room.status === 'match_ended';
  const isRoundOver = room.status === 'round_ended';

  if (!isMatchOver && !isRoundOver) return null;
  if (winnerIndex === null || winnerIndex === undefined) return null;

  const winner = room.players[winnerIndex];
  const totalPrize = room.betAmount * 2;
  const isMeWinner = playerIndex !== null && playerIndex === winnerIndex;

  useEffect(() => {
    playVictorySound();
    // Confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#ef4444', '#ffffff'],
      });
    } catch {
      // Ignore if canvas not supported
    }
  }, [winnerIndex]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-md bg-gradient-to-b from-neutral-900 via-neutral-900 to-black border border-amber-500/40 rounded-3xl p-6 shadow-2xl relative text-center text-neutral-100 space-y-5">
        {/* Glowing Trophy Icon */}
        <div className="relative mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-amber-400/20 via-amber-500/30 to-amber-600/10 border-2 border-amber-400 flex items-center justify-center shadow-[0_0_35px_rgba(245,158,11,0.4)]">
          <Trophy className="w-10 h-10 text-amber-400 animate-bounce" />
        </div>

        {/* Title */}
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-amber-400">
            {isMatchOver ? 'حسم المباراة والرهان!' : 'نهاية الجولة'}
          </span>
          <h2 className="text-2xl font-black text-white mt-1">
            {isMeWinner ? '🎉 مبروك! لقد فزت بالتحدي!' : `🏆 فاز اللاعب ${winner?.name || ''}!`}
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            {room.roundEndReason === 'domino'
              ? 'أنهى جميع قطعه (دومينو قفلة) وتفوق بالنقاط'
              : 'تم حسم القفلة لأقل رصيد قطع على الطاولة'}
          </p>
        </div>

        {/* Prize Box */}
        <div className="p-4 bg-neutral-950/80 border border-amber-500/30 rounded-2xl space-y-3">
          <div className="text-xs text-neutral-400">إجمالي مبلغ الجائزة المستحق:</div>
          <div className="text-3xl font-black text-emerald-400 font-mono tracking-tight">
            {totalPrize} <span className="text-sm font-semibold">جنيه مصري</span>
          </div>

          <div className="h-px bg-white/10" />

          {/* Winner Vodafone Cash Info */}
          <div className="flex items-center justify-between text-xs px-2">
            <span className="text-neutral-400 flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-red-500" />
              <span>محفظة استلام الجائزة:</span>
            </span>
            <span className="font-mono font-bold text-white tracking-wider">
              {winner?.phone || '-'}
            </span>
          </div>

          {/* Payout Status Banner */}
          <div
            className={`p-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 ${
              room.payoutStatus === 'paid'
                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                : 'bg-amber-950/60 text-amber-300 border border-amber-500/40'
            }`}
          >
            {room.payoutStatus === 'paid' ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>تم تحويل المبلغ إلى المحفظة (إيصال: {room.payoutTxRef || 'VF-DONE'})</span>
              </>
            ) : (
              <span>في انتظار تحويل صاحب الغرفة للمبلغ على المحفظة...</span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={onNextRound}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold shadow-lg transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{isMatchOver ? 'بدء تحدي جديد' : 'بدء الجولة التالية'}</span>
          </button>

          {isHost && (
            <p className="text-[11px] text-amber-300 font-medium">
              أنت المنظم: يمكنك الانتقال للوحة التحكم أدناه لتحويل الجائزة بضغطة زر.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
