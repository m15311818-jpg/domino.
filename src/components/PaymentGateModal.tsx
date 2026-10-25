import React, { useState } from 'react';
import { RoomState } from '../types/domino';
import {
  Smartphone,
  Copy,
  CheckCircle2,
  Clock,
  Send,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { playCashChime } from '../utils/soundEffects';

interface PaymentGateModalProps {
  room: RoomState;
  playerIndex: number | null;
  onSubmitPayment: (senderPhone: string, transferRef: string) => Promise<void>;
  isHost: boolean;
  onVerifyPayment?: (playerIdx: number, status: 'approved' | 'rejected') => Promise<void>;
}

export const PaymentGateModal: React.FC<PaymentGateModalProps> = ({
  room,
  playerIndex,
  onSubmitPayment,
  isHost,
  onVerifyPayment,
}) => {
  const isPlayer = playerIndex === 0 || playerIndex === 1;
  const myPlayer = isPlayer && playerIndex !== null ? room.players[playerIndex] : null;

  const [senderPhone, setSenderPhone] = useState(myPlayer?.phone || '');
  const [transferRef, setTransferRef] = useState('');
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [copiedDialCode, setCopiedDialCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Vodafone Cash USSD quick transfer code in Egypt: *9*7*Wallet*Amount#
  const ussdCode = `*9*7*${room.hostWallet}*${room.betAmount}#`;

  const copyToClipboard = (text: string, type: 'wallet' | 'code') => {
    navigator.clipboard.writeText(text);
    if (type === 'wallet') {
      setCopiedWallet(true);
      setTimeout(() => setCopiedWallet(false), 2000);
    } else {
      setCopiedDialCode(true);
      setTimeout(() => setCopiedDialCode(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderPhone.trim()) {
      setErrorMsg('يرجى كتابة رقم فودافون كاش الذي حولت منه');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await onSubmitPayment(senderPhone.trim(), transferRef.trim());
      playCashChime();
    } catch {
      setErrorMsg('حدث خطأ أثناء إرسال التأكيد، يرجى المحاولة ثانية');
    } finally {
      setIsSubmitting(false);
    }
  };

  const p0 = room.players[0];
  const p1 = room.players[1];

  return (
    <div className="w-full max-w-3xl mx-auto bg-neutral-900 border border-amber-900/40 rounded-2xl p-6 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>بوابة الدفع عبر فودافون كاش</span>
              <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-mono">
                Vodafone Cash
              </span>
            </h2>
            <p className="text-xs text-neutral-400">
              يجب تحويل رسوم الرهان للمنظم وتأكيدها لبدء جولة الدومينو وضمان الجائزة للفائز
            </p>
          </div>
        </div>

        {/* Stake summary */}
        <div className="bg-neutral-800/80 border border-neutral-700/60 rounded-xl px-4 py-2.5 flex items-center gap-4">
          <div>
            <div className="text-[11px] text-neutral-400">رسوم الرهان لكل لاعب</div>
            <div className="text-lg font-bold text-emerald-400 font-mono">
              {room.betAmount} <span className="text-xs font-normal">ج.م</span>
            </div>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div>
            <div className="text-[11px] text-neutral-400">إجمالي جائزة الفائز</div>
            <div className="text-lg font-bold text-amber-400 font-mono">
              {room.betAmount * 2} <span className="text-xs font-normal">ج.م</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Instructions Card */}
      <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-4 space-y-4">
        <div className="text-sm font-semibold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>بيانات تحويل فودافون كاش للمنظم:</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Host Wallet Display */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 space-y-1">
            <div className="text-xs text-neutral-400">رقم محفظة كاش المستلم (المنظم):</div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-lg font-mono font-bold text-white tracking-wider">
                {room.hostWallet}
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(room.hostWallet, 'wallet')}
                className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded transition-colors cursor-pointer"
              >
                {copiedWallet ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedWallet ? 'تم النسخ' : 'نسخ الرقم'}</span>
              </button>
            </div>
          </div>

          {/* Direct USSD Dial Code */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 space-y-1">
            <div className="text-xs text-neutral-400">كود التحويل السريع للهاتف:</div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-mono font-semibold text-emerald-400 dir-ltr text-left">
                {ussdCode}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => copyToClipboard(ussdCode, 'code')}
                  className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded transition-colors cursor-pointer"
                >
                  {copiedDialCode ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedDialCode ? 'تم النسخ' : 'نسخ الكود'}</span>
                </button>
                <a
                  href={`tel:${encodeURIComponent(ussdCode)}`}
                  className="text-xs bg-red-600 hover:bg-red-500 text-white px-2.5 py-1 rounded transition-colors inline-flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>اتصال</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-neutral-400 leading-relaxed">
          قم بفتح تطبيق <strong className="text-white">أنا فودافون</strong> أو اطلب الكود أعلاه لتحويل مبلغ{' '}
          <strong className="text-white">{room.betAmount} جنيه</strong> إلى رقم محفظة المنظم، ثم سجل بيانات التحويل في الأسفل.
        </p>
      </div>

      {/* Players Payment Live Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Player 1 Card */}
        <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-sm text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>اللاعب الأول: {p0?.name || 'غير منضم'}</span>
            </div>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                p0?.paymentStatus === 'approved'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : p0?.paymentStatus === 'submitted'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              {p0?.paymentStatus === 'approved'
                ? 'تم التأكيد ✓'
                : p0?.paymentStatus === 'submitted'
                ? 'في انتظار اعتماد المنظم'
                : 'في انتظار التحويل'}
            </span>
          </div>
          <div className="text-xs text-neutral-400 font-mono">
            رقم فودافون كاش: {p0?.phone || '-'}
            {p0?.transferRef && (
              <span className="block text-[11px] text-neutral-400">مرجع التحويل: {p0.transferRef}</span>
            )}
          </div>
          {isHost && onVerifyPayment && p0 && p0.paymentStatus !== 'approved' && (
            <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onVerifyPayment(0, 'approved')}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition-colors cursor-pointer"
              >
                اعتماد تحويل {p0.name}
              </button>
            </div>
          )}
        </div>

        {/* Player 2 Card */}
        <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-sm text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span>اللاعب الثاني: {p1?.name || 'في انتظار انضمام الزميل'}</span>
            </div>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                p1?.paymentStatus === 'approved'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : p1?.paymentStatus === 'submitted'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              {p1?.paymentStatus === 'approved'
                ? 'تم التأكيد ✓'
                : p1?.paymentStatus === 'submitted'
                ? 'في انتظار اعتماد المنظم'
                : 'في انتظار التحويل'}
            </span>
          </div>
          <div className="text-xs text-neutral-400 font-mono">
            رقم فودافون كاش: {p1?.phone || '-'}
            {p1?.transferRef && (
              <span className="block text-[11px] text-neutral-400">مرجع التحويل: {p1.transferRef}</span>
            )}
          </div>
          {isHost && onVerifyPayment && p1 && p1.paymentStatus !== 'approved' && (
            <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onVerifyPayment(1, 'approved')}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition-colors cursor-pointer"
              >
                اعتماد تحويل {p1.name}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Submission Form for Current Player */}
      {isPlayer && myPlayer && myPlayer.paymentStatus !== 'approved' && (
        <form onSubmit={handleSubmit} className="bg-neutral-950/80 border border-amber-600/30 rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-300">
            <Clock className="w-4 h-4" />
            <span>تسجيل إشعار التحويل الخاص بك ({myPlayer.name}):</span>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-950/50 border border-red-800 text-red-200 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-neutral-300 mb-1">
                رقم محفظة فودافون كاش التي حولت منها:
              </label>
              <input
                type="text"
                required
                value={senderPhone}
                onChange={(e) => setSenderPhone(e.target.value)}
                placeholder="مثال: 01012345678"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs text-neutral-300 mb-1">
                رقم العملية أو المرجع (اختياري من رسالة فودافون كاش):
              </label>
              <input
                type="text"
                value={transferRef}
                onChange={(e) => setTransferRef(e.target.value)}
                placeholder="مثال: VF-982143 أو آخر 4 أرقام"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 pt-2">
            <span className="text-xs text-neutral-400">
              {myPlayer.paymentStatus === 'submitted'
                ? '✓ تم إرسال الإشعار بنجاح، بانتظار موافقة المنظم...'
                : 'سيتم إشعار المنظم فوراً لفحص المحفظة والبدء.'}
            </span>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-lg disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{myPlayer.paymentStatus === 'submitted' ? 'تحديث إشعار التحويل' : 'تم التحويل بنجاح'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Host Admin Quick Verification helper notice */}
      {isHost && (
        <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="text-amber-200">
            <strong>أنت منظم الغرفة:</strong> بعد التأكد من وصول الرسالة على هاتفك، اضغط على زر "اعتماد تحويل" للاعب، وستفتح طاولة الدومينو تلقائياً فور اعتماد الطرفين.
          </div>
          {onVerifyPayment && (
            <button
              type="button"
              onClick={() => {
                onVerifyPayment(0, 'approved');
                onVerifyPayment(1, 'approved');
              }}
              className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shrink-0 cursor-pointer"
            >
              اعتماد الطرفين فوراً (تخطي تجريبي)
            </button>
          )}
        </div>
      )}
    </div>
  );
};
