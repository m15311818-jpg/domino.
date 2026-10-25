import React, { useState } from 'react';
import { Smartphone, Lock, User, Hash, LogIn } from 'lucide-react';

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRoomId?: string;
  onJoinRoom: (params: {
    roomId: string;
    pin: string;
    name: string;
    phone: string;
  }) => Promise<void>;
}

export const JoinRoomModal: React.FC<JoinRoomModalProps> = ({
  isOpen,
  onClose,
  initialRoomId = '',
  onJoinRoom,
}) => {
  const [roomId, setRoomId] = useState(initialRoomId);
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId.trim()) {
      setErrorMsg('يرجى إدخال كود الغرفة');
      return;
    }
    if (!pin.trim()) {
      setErrorMsg('يرجى إدخال الرقم السري الخاص بالغرفة');
      return;
    }
    if (!name.trim()) {
      setErrorMsg('يرجى إدخال اسمك كلاعب');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('يرجى إدخال رقم هاتف محفظة فودافون كاش المسجل لديك');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await onJoinRoom({
        roomId: roomId.trim().toUpperCase(),
        pin: pin.trim(),
        name: name.trim(),
        phone: phone.trim(),
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'تعذر الانضمام للغرفة، تحقق من الكود والرقم السري';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-neutral-900 border border-amber-900/40 rounded-2xl p-6 shadow-2xl relative text-neutral-100">
        <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-500">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">الانضمام إلى مباراة دومينو</h3>
              <p className="text-xs text-neutral-400">سجل بياناتك ومحفظة فودافون كاش للمشاركة</p>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-800 rounded-lg text-xs text-red-200">
              {errorMsg}
            </div>
          )}

          {/* Room ID */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-neutral-400" />
              <span>كود الغرفة:</span>
            </label>
            <input
              type="text"
              required
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="مثال: DOMINO-1234"
              className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder-neutral-500 focus:outline-none focus:border-emerald-500 uppercase"
            />
          </div>

          {/* Room PIN */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>الرقم السري للمباراة:</span>
            </label>
            <input
              type="password"
              required
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="الرقم السري الذي شاركه صديقك"
              className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Player Name */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-400" />
              <span>اسمك كلاعب:</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: محمود أو كريم"
              className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Player Vodafone Cash Mobile */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-red-500" />
              <span>رقم هاتفك المسجل على فودافون كاش:</span>
            </label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="مثال: 01098765432"
              className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
            />
            <span className="text-[11px] text-neutral-400 mt-0.5 block">
              سيتم تحويل الجائزة النقدية لهذا الرقم مباشرة في حال فوزك بالجولة!
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            <span>{isSubmitting ? 'جاري التحقق والدخول...' : 'دخول الغرفة وتأكيد الرهان'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
