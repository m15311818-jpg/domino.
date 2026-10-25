import React, { useState } from 'react';
import { RoomState } from '../types/domino';
import {
  Shield,
  Smartphone,
  CheckCircle,
  XCircle,
  Copy,
  ExternalLink,
  Award,
  DollarSign,
  Send,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { playCashChime } from '../utils/soundEffects';

interface HostAdminPanelProps {
  room: RoomState;
  hostToken: string;
  onVerifyPayment: (playerIdx: number, status: 'approved' | 'rejected') => Promise<void>;
  onPayoutWinner: (winnerPhone: string, amount: number, payoutTxRef: string) => Promise<void>;
  onNextRound: () => Promise<void>;
}

export const HostAdminPanel: React.FC<HostAdminPanelProps> = ({
  room,
  hostToken,
  onVerifyPayment,
  onPayoutWinner,
  onNextRound,
}) => {
  const [payoutTxRef, setPayoutTxRef] = useState('');
  const [copiedWinnerPhone, setCopiedWinnerPhone] = useState(false);
  const [copiedDialCode, setCopiedDialCode] = useState(false);
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  const p0 = room.players[0];
  const p1 = room.players[1];

  const winnerIndex = room.matchWinnerIndex ?? room.winnerPlayerIndex;
  const winnerPlayer = winnerIndex !== null && winnerIndex !== undefined ? room.players[winnerIndex] : null;
  const totalPrize = room.betAmount * 2;

  // Vodafone Cash Dial code for paying winner
  const winnerDialCode = winnerPlayer ? `*9*7*${winnerPlayer.phone}*${totalPrize}#` : '';

  const copyText = (text: string, type: 'phone' | 'code') => {
    navigator.clipboard.writeText(text);
    if (type === 'phone') {
      setCopiedWinnerPhone(true);
      setTimeout(() => setCopiedWinnerPhone(false), 2000);
    } else {
      setCopiedDialCode(true);
      setTimeout(() => setCopiedDialCode(false), 2000);
    }
  };

  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!winnerPlayer) return;
    setIsSubmittingPayout(true);
    try {
      await onPayoutWinner(winnerPlayer.phone, totalPrize, payoutTxRef.trim());
      playCashChime();
      setActionMsg('✓ تم توثيق تحويل الجائزة للفائز بنجاح');
      setTimeout(() => setActionMsg(''), 4000);
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  return (
    <div className="w-full bg-neutral-900/95 border border-amber-500/30 rounded-2xl p-5 shadow-2xl space-y-6 text-neutral-100">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <span>لوحة تحكم منظم الغرفة</span>
              <span className="text-[11px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-mono">
                صاحب اللعبة
              </span>
            </h3>
            <p className="text-xs text-neutral-400">
              محفظتك المستلمة: <span className="font-mono text-amber-300 font-bold">{room.hostWallet}</span> · كود الغرفة: <span className="font-mono text-white">{room.id}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onNextRound}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-300 border border-neutral-700 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>جولة جديدة / إعادة</span>
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-medium">
          {actionMsg}
        </div>
      )}

      {/* Section 1: Payment Verification Queue */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>فحص تحويلات اللاعبين (فودافون كاش)</span>
          </h4>
          <span className="text-[11px] text-neutral-400">
            المبلغ المطلوب: {room.betAmount} ج.م من كل لاعب
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Player 1 Card */}
          <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-sm text-white">
                  اللاعب 1: {p0?.name || 'فارغ'}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    p0?.paymentStatus === 'approved'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : p0?.paymentStatus === 'submitted'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {p0?.paymentStatus === 'approved'
                    ? 'تم الاعتماد'
                    : p0?.paymentStatus === 'submitted'
                    ? 'طلب اعتماد'
                    : 'لم يحول'}
                </span>
              </div>
              <div className="text-xs text-neutral-400 font-mono space-y-0.5">
                <div>رقم المحفظة: {p0?.phone || '-'}</div>
                {p0?.senderPhone && <div>حول من: {p0.senderPhone}</div>}
                {p0?.transferRef && <div>مرجع: {p0.transferRef}</div>}
              </div>
            </div>

            {p0 && p0.paymentStatus !== 'approved' && (
              <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => onVerifyPayment(0, 'approved')}
                  className="flex-1 flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>اعتماد واستلام المبلغ</span>
                </button>
                <button
                  type="button"
                  onClick={() => onVerifyPayment(0, 'rejected')}
                  className="p-1.5 bg-neutral-800 hover:bg-red-950/60 text-neutral-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                  title="رفض التحويل"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Player 2 Card */}
          <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-sm text-white">
                  اللاعب 2: {p1?.name || 'فارغ'}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    p1?.paymentStatus === 'approved'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : p1?.paymentStatus === 'submitted'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {p1?.paymentStatus === 'approved'
                    ? 'تم الاعتماد'
                    : p1?.paymentStatus === 'submitted'
                    ? 'طلب اعتماد'
                    : 'لم يحول'}
                </span>
              </div>
              <div className="text-xs text-neutral-400 font-mono space-y-0.5">
                <div>رقم المحفظة: {p1?.phone || '-'}</div>
                {p1?.senderPhone && <div>حول من: {p1.senderPhone}</div>}
                {p1?.transferRef && <div>مرجع: {p1.transferRef}</div>}
              </div>
            </div>

            {p1 && p1.paymentStatus !== 'approved' && (
              <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => onVerifyPayment(1, 'approved')}
                  className="flex-1 flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>اعتماد واستلام المبلغ</span>
                </button>
                <button
                  type="button"
                  onClick={() => onVerifyPayment(1, 'rejected')}
                  className="p-1.5 bg-neutral-800 hover:bg-red-950/60 text-neutral-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                  title="رفض التحويل"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section 2: Winner Payout Management */}
      <div className="bg-gradient-to-br from-amber-950/40 via-neutral-900 to-neutral-950 border border-amber-500/30 rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h4 className="text-sm font-bold text-amber-200">
              إدارة تحويل الجائزة للفائز
            </h4>
          </div>
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
              room.payoutStatus === 'paid'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}
          >
            {room.payoutStatus === 'paid' ? 'تم تحويل الجائزة للفائز ✓' : 'في انتظار التحويل للفائز'}
          </span>
        </div>

        {winnerPlayer ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-neutral-950/60 p-3 rounded-lg border border-neutral-800 text-xs">
              <div>
                <span className="text-neutral-400 block mb-0.5">اسم الفائز:</span>
                <span className="font-bold text-white text-sm">{winnerPlayer.name}</span>
              </div>
              <div>
                <span className="text-neutral-400 block mb-0.5">محفظة فودافون كاش للفائز:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-amber-300">{winnerPlayer.phone}</span>
                  <button
                    type="button"
                    onClick={() => copyText(winnerPlayer.phone, 'phone')}
                    className="p-1 hover:text-amber-200 text-neutral-400 cursor-pointer"
                    title="نسخ رقم الفائز"
                  >
                    {copiedWinnerPhone ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div>
                <span className="text-neutral-400 block mb-0.5">مبلغ الجائزة المستحق:</span>
                <span className="font-mono font-bold text-emerald-400 text-base">{totalPrize} ج.م</span>
              </div>
            </div>

            {/* Quick dial code to transfer to winner */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-neutral-900 p-3 rounded-lg border border-neutral-800 text-xs">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-red-500" />
                <span className="text-neutral-300">كود التحويل للفائز من هاتفك:</span>
                <span className="font-mono font-bold text-white dir-ltr">{winnerDialCode}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => copyText(winnerDialCode, 'code')}
                  className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-amber-300 text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
                >
                  {copiedDialCode ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedDialCode ? 'تم النسخ' : 'نسخ الكود'}</span>
                </button>
                <a
                  href={`tel:${encodeURIComponent(winnerDialCode)}`}
                  className="px-3 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold transition-colors inline-flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>اتصال مباشر</span>
                </a>
              </div>
            </div>

            {/* Payout confirmation form */}
            {room.payoutStatus !== 'paid' ? (
              <form onSubmit={handlePayoutSubmit} className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                <input
                  type="text"
                  value={payoutTxRef}
                  onChange={(e) => setPayoutTxRef(e.target.value)}
                  placeholder="رقم عملية تحويل الجائزة (من رسالة فودافون كاش)"
                  className="flex-1 bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-500 font-mono focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  disabled={isSubmittingPayout}
                  className="w-full sm:w-auto px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>تسجيل إتمام تحويل الجائزة</span>
                </button>
              </form>
            ) : (
              <div className="text-xs text-emerald-400 bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-800/40 font-mono flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>تم إرسال الجائزة بنجاح · رقم الإيصال: {room.payoutTxRef || 'VF-PAID'}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-neutral-400 py-2">
            المباراة جارية حالياً. فور انتهاء الجولة وتحديد الفائز، ستظهر هنا تفاصيل التحويل المباشر مع رقم محفظته وكود الاتصال السريع.
          </div>
        )}
      </div>

      {/* Section 3: Room Activity Log */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5" />
          <span>سجل نشاط الغرفة والتحويلات</span>
        </h4>
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 max-h-36 overflow-y-auto space-y-1.5 text-xs font-mono">
          {room.logs.length > 0 ? (
            room.logs.map((log) => (
              <div key={log.id} className="flex items-start gap-2 text-neutral-300">
                <span className="text-[10px] text-neutral-400 shrink-0">
                  {new Date(log.time).toLocaleTimeString('ar-EG')}
                </span>
                <span
                  className={
                    log.type === 'payment'
                      ? 'text-amber-400'
                      : log.type === 'payout'
                      ? 'text-emerald-400 font-bold'
                      : 'text-neutral-300'
                  }
                >
                  {log.text}
                </span>
              </div>
            ))
          ) : (
            <div className="text-neutral-400 text-center py-2">لا توجد حركات مسجلة بعد</div>
          )}
        </div>
      </div>
    </div>
  );
};
