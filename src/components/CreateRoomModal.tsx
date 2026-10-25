import React, { useState } from 'react';
import { Smartphone, Lock, Coins, Trophy, UserCheck, ArrowRight, Share2, Copy, Check } from 'lucide-react';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (params: {
    hostWallet: string;
    pin: string;
    betAmount: number;
    targetScore: number;
    hostName: string;
    hostIsPlayer: boolean;
  }) => Promise<void>;
  createdRoomData?: {
    roomId: string;
    pin: string;
    betAmount: number;
    hostWallet: string;
    shareUrl: string;
  } | null;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  onCreateRoom,
  createdRoomData,
}) => {
  const [hostWallet, setHostWallet] = useState('');
  const [pin, setPin] = useState('');
  const [betAmount, setBetAmount] = useState<number>(50);
  const [targetScore, setTargetScore] = useState<number>(100);
  const [hostName, setHostName] = useState('');
  const [hostIsPlayer, setHostIsPlayer] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostWallet.trim()) {
      setErrorMsg('يرجى إدخال رقم محفظة فودافون كاش الخاص بك لاستلام المبالغ');
      return;
    }
    if (!pin.trim()) {
      setErrorMsg('يرجى تحديد رقم سري للغرفة لمشاركته مع صديقك');
      return;
    }
    if (hostIsPlayer && !hostName.trim()) {
      setErrorMsg('يرجى إدخال اسمك كلاعب أول');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await onCreateRoom({
        hostWallet: hostWallet.trim(),
        pin: pin.trim(),
        betAmount,
        targetScore,
        hostName: hostName.trim() || 'المنظم',
        hostIsPlayer,
      });
    } catch {
      setErrorMsg('تعذر إنشاء الغرفة، يرجى المحاولة ثانية');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyShareLink = () => {
    if (!createdRoomData) return;
    navigator.clipboard.writeText(createdRoomData.shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-neutral-900 border border-amber-900/40 rounded-2xl p-6 shadow-2xl relative text-neutral-100 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">
                {createdRoomData ? 'تم إنشاء الغرفة بنجاح!' : 'إنشاء غرفة دومينو برهان كاش'}
              </h3>
              <p className="text-xs text-neutral-400">
                {createdRoomData ? 'شارك الرابط والرقم السري مع صديقك' : 'حدد رقم كاش لاستلام المبالغ والرقم السري للمباراة'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {createdRoomData ? (
          /* Success Screen with Copy Link & WhatsApp Share */
          <div className="space-y-5">
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-emerald-300 font-medium">كود الغرفة:</span>
                <span className="font-mono text-xl font-bold text-white tracking-widest">
                  {createdRoomData.roomId}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-300">الرقم السري للمباراة:</span>
                <span className="font-mono text-base font-bold text-amber-400">
                  {createdRoomData.pin}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-300">رسوم الرهان لكل لاعب:</span>
                <span className="font-mono text-sm font-bold text-white">
                  {createdRoomData.betAmount} ج.م (الجائزة: {createdRoomData.betAmount * 2} ج.م)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-300">رقم فودافون كاش لتحويل الرسوم:</span>
                <span className="font-mono text-sm font-bold text-emerald-400">
                  {createdRoomData.hostWallet}
                </span>
              </div>
            </div>

            {/* Shareable Link Box */}
            <div className="space-y-1.5">
              <label className="block text-xs text-neutral-300 font-medium">رابط الدعوة المباشر:</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={createdRoomData.shareUrl}
                  className="flex-1 bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-neutral-300 font-mono select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={copyShareLink}
                  className="flex items-center gap-1 px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'تم النسخ' : 'نسخ'}</span>
                </button>
              </div>
            </div>

            {/* WhatsApp Share Button */}
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                `يلا نلعب دومينو! 🎲\nكود الغرفة: ${createdRoomData.roomId}\nالرقم السري: ${createdRoomData.pin}\nقيمة التحدي: ${createdRoomData.betAmount} جنيه\nرقم تحويل فودافون كاش: ${createdRoomData.hostWallet}\nادخل من هنا:\n${createdRoomData.shareUrl}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>مشاركة الرابط عبر واتساب فوراً</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              الانتقال لطاولة اللعب
            </button>
          </div>
        ) : (
          /* Room Creation Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-950/60 border border-red-800 rounded-lg text-xs text-red-200">
                {errorMsg}
              </div>
            )}

            {/* Host Vodafone Cash Number */}
            <div>
              <label className="block text-xs font-medium text-neutral-200 mb-1 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-red-500" />
                <span>رقم محفظة فودافون كاش الخاص بك (لاستلام المبالغ):</span>
              </label>
              <input
                type="text"
                required
                value={hostWallet}
                onChange={(e) => setHostWallet(e.target.value)}
                placeholder="مثال: 01012345678"
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder-neutral-500 focus:outline-none focus:border-amber-500"
              />
              <span className="text-[11px] text-neutral-400 mt-0.5 block">
                سيظهر هذا الرقم للعميل وصديقه ليقوموا بالتحويل عليه
              </span>
            </div>

            {/* Secret PIN for the Room */}
            <div>
              <label className="block text-xs font-medium text-neutral-200 mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>الرقم السري للمباراة (تشاركه مع صديقك):</span>
              </label>
              <input
                type="text"
                required
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="مثال: 1234 أو كود من 4 أرقام"
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder-neutral-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Bet Amount */}
            <div>
              <label className="block text-xs font-medium text-neutral-200 mb-1.5 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>مبلغ الرهان / رسوم التحدي لكل لاعب:</span>
              </label>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {[20, 50, 100, 200].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setBetAmount(amt)}
                    className={`py-1.5 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                      betAmount === amt
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {amt} ج.م
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="10"
                max="5000"
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Target Score */}
            <div>
              <label className="block text-xs font-medium text-neutral-200 mb-1.5 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>نظام احتساب الفائز بالمباراة:</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'جولة حاسمة واحدة', val: 1 },
                  { label: 'أول من يصل 50 نقطة', val: 50 },
                  { label: 'أول من يصل 100 نقطة', val: 100 },
                ].map((score) => (
                  <button
                    key={score.val}
                    type="button"
                    onClick={() => setTargetScore(score.val)}
                    className={`p-2 text-center text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                      targetScore === score.val
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {score.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Host Participation Option */}
            <div className="p-3 bg-neutral-950/70 border border-neutral-800 rounded-xl space-y-2">
              <label className="flex items-center gap-2 text-xs font-medium text-neutral-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hostIsPlayer}
                  onChange={(e) => setHostIsPlayer(e.target.checked)}
                  className="rounded border-neutral-700 text-amber-500 focus:ring-amber-500"
                />
                <span>سألعب أنا شخصياً كالطرف الأول (اللاعب 1) ضد صديقي</span>
              </label>

              {hostIsPlayer && (
                <div>
                  <input
                    type="text"
                    value={hostName}
                    onChange={(e) => setHostName(e.target.value)}
                    placeholder="اكتب اسمك كلاعب أول"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold shadow-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <UserCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'جاري إنشاء الغرفة...' : 'إنشاء الغرفة واستخراج الرابط'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
