import React, { useState } from 'react';
import { ChatMessage } from '../types/domino';
import { Send, MessageSquare, Sparkles } from 'lucide-react';

interface ChatAndShareDrawerProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  playerName: string;
}

const QUICK_TAUNTS = [
  'دومينو يا كابتن! 🎲',
  'الدوك معايا ومستنيك! 🔥',
  'قفلتها خلاص! 🔒',
  'باص يا معلم! 😉',
  'الشكارة بتناديك! 🃏',
  'حول الكاش واستعد! 💰',
];

export const ChatAndShareDrawer: React.FC<ChatAndShareDrawerProps> = ({
  messages,
  onSendMessage,
  playerName,
}) => {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isSending) return;
    setIsSending(true);
    try {
      await onSendMessage(text.trim());
      if (!textToSend) setInputText('');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="w-full bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 shadow-xl flex flex-col h-[320px]">
      <div className="flex items-center justify-between pb-2.5 border-b border-white/5 mb-3">
        <div className="flex items-center gap-2 text-xs font-bold text-neutral-300">
          <MessageSquare className="w-4 h-4 text-amber-400" />
          <span>دردشة القهوة والمباراة</span>
        </div>
        <span className="text-[11px] text-neutral-400">مباشر</span>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-3 scrollbar-thin">
        {messages.length > 0 ? (
          messages.map((msg) => {
            const isMe = msg.sender === playerName;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 mb-0.5">
                  <span className="font-semibold text-neutral-300">{msg.sender}</span>
                  <span>·</span>
                  <span>{new Date(msg.time).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div
                  className={`px-3 py-1.5 rounded-xl text-xs max-w-[85%] ${
                    isMe
                      ? 'bg-amber-600 text-white rounded-tr-none'
                      : 'bg-neutral-800 text-neutral-200 rounded-tl-none border border-neutral-700/50'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-neutral-400">
            أرسل كلمة لخصمك أو استخدم عبارات القهوة السريعة!
          </div>
        )}
      </div>

      {/* Quick Taunt Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 mb-2 scrollbar-none">
        {QUICK_TAUNTS.map((taunt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(taunt)}
            className="px-2.5 py-1 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] whitespace-nowrap shrink-0 border border-neutral-700/60 transition-colors cursor-pointer"
          >
            {taunt}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="اكتب رسالة للخصم..."
          className="flex-1 bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="p-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white rounded-xl transition-colors cursor-pointer shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
