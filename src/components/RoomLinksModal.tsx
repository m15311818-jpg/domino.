import React, { useState } from 'react';
import { Shield, Users, Copy, Check, Share2, ExternalLink, Smartphone, Lock, Info } from 'lucide-react';

interface RoomLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  pin: string;
  hostWallet: string;
  betAmount: number;
  hostToken?: string;
  baseUrl?: string;
}

export const RoomLinksModal: React.FC<RoomLinksModalProps> = ({
  isOpen,
  onClose,
  roomId,
  pin,
  hostWallet,
  betAmount,
  hostToken,
  baseUrl = typeof window !== 'undefined' ? window.location.origin : '',
}) => {
  const [copiedPlayerLink, setCopiedPlayerLink] = useState(false);
  const [copiedHostLink, setCopiedHostLink] = useState(false);

  if (!isOpen) return null;

  // 1. Players Link (what friends/clients click on to enter name, phone, PIN, and pay)
  const playerInviteUrl = `${baseUrl}/?room=${roomId}&hostWallet=${encodeURIComponent(
    hostWallet
  )}&bet=${betAmount}`;

  // 2. Host / Admin Secret Link (for room creator to manage, verify payments & send winner cash)
  const hostAdminUrl = hostToken
    ? `${baseUrl}/?room=${roomId}&hostToken=${hostToken}`
    : `${baseUrl}/?room=${roomId}`;

  const whatsappMessage = `🎲 يلا نلعب دومينو كاش!\n\n🔹 كود الغرفة: ${roomId}\n🔐 الرقم السري للمباراة: ${pin}\n💰 قيمة الرهان لكل لاعب: ${betAmount} جنيه\n📱 رقم فودافون كاش لتحويل الرسوم: ${hostWallet}\n\nاضغط على الرابط التالي للدخول وتسجيل محفظتك وبدء التحدي:\n${playerInviteUrl}`;

  const copyToClipboard = (text: string, type: 'player' | 'host') => {
    navigator.clipboard.writeText(text);
    if (type === 'player') {
      setCopiedPlayerLink(true);
      setTimeout(() => setCopiedPlayerLink(false), 2000);
    } else {
      setCopiedHostLink(true);
      setTimeout(() => setCopiedHostLink(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-neutral-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl relative text-neutral-100 max-h-[92vh] overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span>روابط الغرفة والمشاركة</span>
              <span className="font-mono text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                {roomId}
              </span>
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              هنا تجد رابط أصدقائك (العملاء) ورابطك السري كصاحب الغرفة
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Link 1: Players / Clients Link */}
        <div className="bg-gradient-to-br from-emerald-950/40 via-neutral-950 to-neutral-950 border border-emerald-500/40 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Users className="w-4 h-4" />
              <span>1. رابط العميل واللاعبين (أصدقاؤك):</span>
            </div>
            <span className="text-[11px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-medium">
              الرابط للمشاركة مع الأصدقاء
            </span>
          </div>

          <p className="text-xs text-neutral-300 leading-relaxed">
            هذا هو الرابط الذي <strong>تشاركه مع أصدقائك</strong>. عند النقر عليه، يفتح له فوراً صفحة الدخول، ويسجل اسمه ورقم فودافون كاش الخاص به، ويكتب الرقم السري الذي تحدده له ويحول لك المبلغ.
          </p>

          {/* URL Input Box */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={playerInviteUrl}
              className="flex-1 bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-emerald-300 font-mono select-all focus:outline-none"
            />
            <button
              type="button"
              onClick={() => copyToClipboard(playerInviteUrl, 'player')}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-md"
            >
              {copiedPlayerLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPlayerLink ? 'تم النسخ' : 'نسخ رابط اللاعبين'}</span>
            </button>
          </div>

          {/* WhatsApp Direct Share Button */}
          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMessage)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-lg"
          >
            <Share2 className="w-4 h-4" />
            <span>مشاركة الرابط والبيانات عبر واتساب فوراً</span>
          </a>
        </div>

        {/* Link 2: Host Secret Admin Link */}
        <div className="bg-gradient-to-br from-amber-950/40 via-neutral-950 to-neutral-950 border border-amber-500/40 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Shield className="w-4 h-4" />
              <span>2. رابطك الخاص كصاحب الغرفة (لوحة المنظم):</span>
            </div>
            <span className="text-[11px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono font-bold">
              خاص بك فقط (سري)
            </span>
          </div>

          <p className="text-xs text-neutral-300 leading-relaxed">
            هذا الرابط مخصص <strong>لك أنت فقط</strong>. يحتوي على مفتاح التحكم الخاص بك لفتح لوحة المنظم، واعتماد استلام تحويلات فودافون كاش، ومتابعة من الفائز، وإرسال مبلغ الجائزة له.
          </p>

          {/* URL Input Box */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={hostAdminUrl}
              className="flex-1 bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono select-all focus:outline-none"
            />
            <button
              type="button"
              onClick={() => copyToClipboard(hostAdminUrl, 'host')}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-md"
            >
              {copiedHostLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedHostLink ? 'تم النسخ' : 'نسخ رابط المنظم'}</span>
            </button>
          </div>

          <div className="p-2.5 bg-neutral-950/80 rounded-xl border border-white/5 flex items-center gap-2 text-[11px] text-amber-200/90">
            <Info className="w-4 h-4 shrink-0 text-amber-400" />
            <span>احفظ هذا الرابط في مفضلتك لكي تفتح لوحة الإدارة من هاتفك في أي وقت وتعتمد التحويلات.</span>
          </div>
        </div>

        {/* Room Quick Specs Card */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-neutral-950 p-4 rounded-2xl border border-neutral-800 text-xs">
          <div>
            <span className="text-neutral-400 block mb-0.5">كود الغرفة:</span>
            <span className="font-mono font-bold text-white text-sm">{roomId}</span>
          </div>
          <div>
            <span className="text-neutral-400 block mb-0.5">الرقم السري (PIN):</span>
            <span className="font-mono font-bold text-amber-400 text-sm">{pin}</span>
          </div>
          <div>
            <span className="text-neutral-400 block mb-0.5">محفظة كاش الخاصة بك:</span>
            <span className="font-mono font-bold text-emerald-400 text-sm">{hostWallet}</span>
          </div>
          <div>
            <span className="text-neutral-400 block mb-0.5">مبلغ الرهان لكل لاعب:</span>
            <span className="font-mono font-bold text-white text-sm">{betAmount} ج.م</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition-colors cursor-pointer"
        >
          إغلاق ومتابعة الغرفة
        </button>
      </div>
    </div>
  );
};
