import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RoomState } from './types/domino';
import { Header } from './components/Header';
import { DominoBoard } from './components/DominoBoard';
import { PaymentGateModal } from './components/PaymentGateModal';
import { HostAdminPanel } from './components/HostAdminPanel';
import { CreateRoomModal } from './components/CreateRoomModal';
import { JoinRoomModal } from './components/JoinRoomModal';
import { WinnerModal } from './components/WinnerModal';
import { GameRulesView } from './components/GameRulesView';
import { ChatAndShareDrawer } from './components/ChatAndShareDrawer';
import { RoomLinksModal } from './components/RoomLinksModal';
import {
  playDominoClick,
  playDrawSound,
  playPassSound,
  playCashChime,
} from './utils/soundEffects';
import {
  Smartphone,
  PlusCircle,
  LogIn,
  ShieldCheck,
  Trophy,
  Coins,
  ArrowRight,
  Share2,
  Sparkles,
  Users,
  Link as LinkIcon,
} from 'lucide-react';

export default function App() {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [roomId, setRoomId] = useState<string>('');
  const [hostToken, setHostToken] = useState<string>('');
  const [playerIndex, setPlayerIndex] = useState<number | null>(null);
  const [playerName, setPlayerName] = useState<string>('');

  const [currentTab, setCurrentTab] = useState<'game' | 'payment' | 'admin' | 'rules'>('game');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isLinksModalOpen, setIsLinksModalOpen] = useState(false);
  const [createdRoomInfo, setCreatedRoomInfo] = useState<{
    roomId: string;
    pin: string;
    betAmount: number;
    hostWallet: string;
    shareUrl: string;
  } | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [errorBanner, setErrorBanner] = useState('');
  const wsRef = useRef<WebSocket | null>(null);

  const isHost = Boolean(hostToken && hostToken.length > 0);

  // Initialize room data from URL if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryRoomId = params.get('room');
    const queryHostToken = params.get('hostToken');
    const savedHostToken = queryHostToken || localStorage.getItem('domino_host_token_' + queryRoomId);

    if (queryRoomId) {
      setRoomId(queryRoomId);
      if (savedHostToken) {
        setHostToken(savedHostToken);
      }
      fetchRoom(queryRoomId, savedHostToken || undefined);
    }
  }, []);

  // Fetch sanitized room from server
  const fetchRoom = useCallback(async (id: string, token?: string) => {
    try {
      const pIdx = localStorage.getItem('domino_player_idx_' + id);
      const url = `/api/rooms/${id}?hostToken=${token || hostToken || ''}${
        pIdx !== null ? `&playerIndex=${pIdx}` : ''
      }`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setRoom(data.room);
        if (data.isHost && token) {
          setHostToken(token);
        }
        if (pIdx !== null) {
          setPlayerIndex(Number(pIdx));
        }
      }
    } catch (e) {
      console.error('Failed to fetch room', e);
    }
  }, [hostToken]);

  // Connect WebSocket for real-time room sync
  useEffect(() => {
    if (!roomId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      setIsConnected(true);
      socket.send(
        JSON.stringify({
          type: 'subscribe',
          roomId,
          role: isHost ? 'host' : 'player',
          playerIndex,
          hostToken,
        })
      );
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'room_state' && msg.room) {
          setRoom(msg.room);
        }
      } catch (err) {
        console.error('WS parse error', err);
      }
    };

    socket.onerror = () => {
      // Gracefully handle any connection errors without throwing
    };

    socket.onclose = () => {
      setIsConnected(false);
    };

    // Polling backup to keep room in perfect sync
    const interval = setInterval(() => {
      fetchRoom(roomId, hostToken);
    }, 2500);

    return () => {
      clearInterval(interval);
      try {
        socket.close();
      } catch {
        // ignore
      }
    };
  }, [roomId, isHost, playerIndex, hostToken, fetchRoom]);

  // Auto-switch tabs based on room status
  useEffect(() => {
    if (!room) return;
    if (room.status === 'payment_pending' && currentTab === 'game') {
      setCurrentTab('payment');
    } else if (room.status === 'playing' && currentTab === 'payment') {
      setCurrentTab('game');
    }
  }, [room?.status]);

  // Handle Room Creation
  const handleCreateRoom = async (params: {
    hostWallet: string;
    pin: string;
    betAmount: number;
    targetScore: number;
    hostName: string;
    hostIsPlayer: boolean;
  }) => {
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'فشل إنشاء الغرفة');
    }

    const data = await res.json();
    setRoom(data.room);
    setRoomId(data.roomId);
    setHostToken(data.hostToken);
    localStorage.setItem('domino_host_token_' + data.roomId, data.hostToken);

    if (params.hostIsPlayer) {
      setPlayerIndex(0);
      setPlayerName(params.hostName);
      localStorage.setItem('domino_player_idx_' + data.roomId, '0');
    }

    // Build share URL
    const shareUrl = `${window.location.origin}/?room=${data.roomId}&hostWallet=${encodeURIComponent(
      params.hostWallet
    )}&bet=${params.betAmount}`;

    setCreatedRoomInfo({
      roomId: data.roomId,
      pin: params.pin,
      betAmount: params.betAmount,
      hostWallet: params.hostWallet,
      shareUrl,
    });
  };

  // Handle Joining Room
  const handleJoinRoom = async (params: {
    roomId: string;
    pin: string;
    name: string;
    phone: string;
  }) => {
    const res = await fetch(`/api/rooms/${params.roomId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'تعذر الانضمام للغرفة');
    }

    const data = await res.json();
    setRoom(data.room);
    setRoomId(params.roomId);
    setPlayerIndex(data.playerIndex);
    setPlayerName(params.name);
    localStorage.setItem('domino_player_idx_' + params.roomId, String(data.playerIndex));

    // Update URL query without page reload
    window.history.pushState({}, '', `/?room=${params.roomId}`);
  };

  // Submit payment proof
  const handleSubmitPayment = async (senderPhone: string, transferRef: string) => {
    if (!room || playerIndex === null) return;
    const res = await fetch(`/api/rooms/${room.id}/submit-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerIndex,
        senderPhone,
        transferRef,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setRoom(data.room);
    }
  };

  // Host approves or rejects payment
  const handleVerifyPayment = async (targetPlayerIdx: number, status: 'approved' | 'rejected') => {
    if (!room || !hostToken) return;
    const res = await fetch(`/api/rooms/${room.id}/verify-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hostToken,
        playerIndex: targetPlayerIdx,
        status,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setRoom(data.room);
      playCashChime();
    }
  };

  // Host executes winner payout
  const handlePayoutWinner = async (winnerPhone: string, amount: number, payoutTxRef: string) => {
    if (!room || !hostToken) return;
    const res = await fetch(`/api/rooms/${room.id}/payout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hostToken,
        winnerPhone,
        amount,
        payoutTxRef,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setRoom(data.room);
    }
  };

  // Play tile
  const handlePlayTile = async (tileIndex: number, preferredEnd: 'left' | 'right') => {
    if (!room || playerIndex === null) return;
    playDominoClick();
    const res = await fetch(`/api/rooms/${room.id}/play-tile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerIndex,
        tileIndex,
        preferredEnd,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setRoom(data.room);
    } else {
      const err = await res.json();
      setErrorBanner(err.error || 'حركة غير صحيحة');
      setTimeout(() => setErrorBanner(''), 3000);
    }
  };

  // Draw tile
  const handleDrawTile = async () => {
    if (!room || playerIndex === null) return;
    playDrawSound();
    const res = await fetch(`/api/rooms/${room.id}/draw-tile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerIndex }),
    });
    if (res.ok) {
      const data = await res.json();
      setRoom(data.room);
    }
  };

  // Pass turn
  const handlePassTurn = async () => {
    if (!room || playerIndex === null) return;
    playPassSound();
    const res = await fetch(`/api/rooms/${room.id}/pass-turn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerIndex }),
    });
    if (res.ok) {
      const data = await res.json();
      setRoom(data.room);
    }
  };

  // Next round
  const handleNextRound = async () => {
    if (!room) return;
    const res = await fetch(`/api/rooms/${room.id}/next-round`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (res.ok) {
      const data = await res.json();
      setRoom(data.room);
    }
  };

  // Send in-game chat message
  const handleSendMessage = async (text: string) => {
    if (!room) return;
    const sender = playerName || (isHost ? 'المنظم' : 'لاعب');
    await fetch(`/api/rooms/${room.id}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender, text }),
    });
  };

  // Quick Demo Setup
  const handleQuickDemo = async () => {
    await handleCreateRoom({
      hostWallet: '01012345678',
      pin: '1234',
      betAmount: 50,
      targetScore: 50,
      hostName: 'المنظم (أحمد)',
      hostIsPlayer: true,
    });
    setIsCreateModalOpen(false);
  };

  const shareRoomLink = () => {
    if (!room) return;
    const url = `${window.location.origin}/?room=${room.id}&hostWallet=${encodeURIComponent(
      room.hostWallet
    )}&bet=${room.betAmount}`;
    navigator.clipboard.writeText(url);
    alert('تم نسخ رابط الغرفة بنجاح! شاركه مع زميلك للانضمام وسداد فودافون كاش.');
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-amber-500 selection:text-neutral-950">
      {/* 3-Zone Header Contract */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenCreate={() => {
          setCreatedRoomInfo(null);
          setIsCreateModalOpen(true);
        }}
        onOpenJoin={() => setIsJoinModalOpen(true)}
        roomId={room?.id}
        isHost={isHost}
        onShareRoom={() => setIsLinksModalOpen(true)}
        onOpenLinks={() => setIsLinksModalOpen(true)}
      />

      {/* Error / Alert notification banner */}
      {errorBanner && (
        <div className="bg-red-900/90 text-white text-xs font-bold py-2 px-4 text-center sticky top-14 z-30 shadow-md">
          {errorBanner}
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {!room ? (
          /* Welcome Landing & Room Launchpad */
          <div className="space-y-12 py-4">
            {/* Hero Split Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-gradient-to-br from-neutral-900 via-neutral-900/90 to-neutral-950 border border-amber-900/40 rounded-3xl p-6 md:p-10 shadow-2xl overflow-hidden relative">
              <div className="space-y-6 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/10 border border-red-500/30 text-xs font-semibold text-red-400">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>دومينو حقيقي بتوثيق فودافون كاش</span>
                </div>

                <h1 className="text-3xl md:text-5xl font-black text-white leading-tight text-balance">
                  العب دومينو مع أصدقائك وراهن بأمان عبر محفظتك
                </h1>

                <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
                  أنشئ غرفتك الخاصة واكتب رقم فودافون كاش لاستلام المبالغ. يكتب أصدقاؤك الرقم السري للدخول، ويتم توثيق التحويلات فورياً قبل فتح الطاولة، مع تحويل أرباح الفائز بضغطة زر.
                </p>

                {/* Primary CTA Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCreatedRoomInfo(null);
                      setIsCreateModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-6 py-3.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold rounded-xl shadow-xl transition-all cursor-pointer hover:scale-105"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>إنشاء غرفة جديدة كرئيس/منظم</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsJoinModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-3.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-semibold rounded-xl border border-neutral-700 transition-all cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>انضمام برقم سري وكود</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleQuickDemo}
                    className="text-xs text-amber-400 hover:text-amber-300 underline font-medium px-2 py-1 cursor-pointer"
                  >
                    (تجربة سريعة وفورية)
                  </button>
                </div>
              </div>

              {/* Visual Showcase Graphic */}
              <div className="relative rounded-2xl overflow-hidden border border-amber-500/20 shadow-2xl h-72 md:h-96">
                <img
                  src="/src/assets/images/domino_vodafone_cash_1792945887365.jpg"
                  alt="Domino Vodafone Cash"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-4 right-4 left-4 p-3 bg-neutral-900/90 backdrop-blur-md rounded-xl border border-white/10 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-emerald-400 font-bold block">تحويل فوري ومباشر</span>
                    <span className="text-neutral-400 text-[11px]">كود التحويل: *9*7*رقم_المحفظة*المبلغ#</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md">
                    28 قطعة عظم مصرية
                  </span>
                </div>
              </div>
            </div>

            {/* Rules and Explanation Section */}
            <GameRulesView />
          </div>
        ) : (
          /* Active Room Screen */
          <div className="space-y-6">
            {/* Room Info Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-900/80 border border-neutral-800 px-4 py-3 rounded-2xl backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400 font-medium">الغرفة:</span>
                  <span className="font-mono text-sm font-bold text-white tracking-wider">
                    {room.id}
                  </span>
                </div>
                <span className="text-neutral-600">|</span>
                <div className="flex items-center gap-1.5 text-xs text-neutral-300">
                  <span>الرهان:</span>
                  <span className="font-mono font-bold text-amber-400">{room.betAmount} ج.م</span>
                </div>
                <span className="text-neutral-600">|</span>
                <div className="text-xs text-neutral-400">
                  محفظة المنظم: <strong className="text-white font-mono">{room.hostWallet}</strong>
                </div>
              </div>

              {/* View Switcher Tabs on mobile */}
              <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
                <button
                  type="button"
                  onClick={() => setCurrentTab('game')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    currentTab === 'game'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  طاولة اللعب
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentTab('payment')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    currentTab === 'payment'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <span>بوابة كاش</span>
                  {room.status === 'payment_pending' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  )}
                </button>
                {isHost && (
                  <button
                    type="button"
                    onClick={() => setCurrentTab('admin')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      currentTab === 'admin'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    لوحة المنظم
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setCurrentTab('rules')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    currentTab === 'rules'
                      ? 'bg-neutral-800 text-white'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  القواعد
                </button>
                <button
                  type="button"
                  onClick={() => setIsLinksModalOpen(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600 hover:text-white transition-all cursor-pointer"
                  title="عرض رابط العميل واللاعبين ورابط المنظم السري"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>روابط الغرفة (العميل والمنظم)</span>
                </button>
              </div>
            </div>

            {/* Room Content Based on Tab & Status */}
            {currentTab === 'payment' && (
              <PaymentGateModal
                room={room}
                playerIndex={playerIndex}
                onSubmitPayment={handleSubmitPayment}
                isHost={isHost}
                onVerifyPayment={handleVerifyPayment}
              />
            )}

            {currentTab === 'admin' && isHost && (
              <HostAdminPanel
                room={room}
                hostToken={hostToken}
                onVerifyPayment={handleVerifyPayment}
                onPayoutWinner={handlePayoutWinner}
                onNextRound={handleNextRound}
              />
            )}

            {currentTab === 'rules' && <GameRulesView />}

            {currentTab === 'game' && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                {/* Main Domino Arena (3 cols) */}
                <div className="lg:col-span-3 space-y-4">
                  {room.status === 'waiting_players' ? (
                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center space-y-4">
                      <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                        <Users className="w-7 h-7" />
                      </div>
                      <h3 className="text-xl font-bold text-white">في انتظار انضمام اللاعب الثاني...</h3>
                      <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
                        شارك كود الغرفة <strong className="text-amber-400 font-mono text-sm">{room.id}</strong> والرقم السري <strong className="text-amber-400 font-mono text-sm">{room.pin}</strong> مع صديقك، أو انسخ الرابط المباشر.
                      </p>
                      <button
                        type="button"
                        onClick={shareRoomLink}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-lg"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>نسخ ومشاركة رابط المباراة</span>
                      </button>
                    </div>
                  ) : room.status === 'payment_pending' ? (
                    <div className="bg-neutral-900 border border-amber-600/30 rounded-2xl p-6 text-center space-y-4">
                      <div className="w-12 h-12 rounded-full bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center mx-auto">
                        <Smartphone className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-bold text-white">بانتظار سداد رسوم الرهان عبر فودافون كاش</h3>
                      <p className="text-xs text-neutral-300 max-w-lg mx-auto leading-relaxed">
                        تم ربط اللاعبين بنجاح. يجب تحويل رسوم الرهان ({room.betAmount} ج.م) لرقم محفظة المنظم ({room.hostWallet}) واعتمادها لتبدأ الجولة فوراً.
                      </p>
                      <button
                        type="button"
                        onClick={() => setCurrentTab('payment')}
                        className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer"
                      >
                        الانتقال لبوابة التحويل وتأكيد الدفع
                      </button>
                    </div>
                  ) : (
                    <DominoBoard
                      room={room}
                      playerIndex={playerIndex}
                      isHost={isHost}
                      onPlayTile={handlePlayTile}
                      onDrawTile={handleDrawTile}
                      onPassTurn={handlePassTurn}
                    />
                  )}
                </div>

                {/* Right Column: Chat & Room Controls (1 col) */}
                <div className="space-y-4">
                  <ChatAndShareDrawer
                    messages={room.chatMessages}
                    onSendMessage={handleSendMessage}
                    playerName={playerName || (isHost ? 'المنظم' : 'لاعب')}
                  />

                  {/* Quick Room Specs Card */}
                  <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 text-xs space-y-2.5">
                    <div className="font-bold text-white text-sm pb-2 border-b border-white/5 flex items-center justify-between">
                      <span>بيانات المباراة</span>
                      <span className="font-mono text-emerald-400">{room.targetScore} نقطة</span>
                    </div>
                    <div className="flex items-center justify-between text-neutral-400">
                      <span>اللاعب الأول:</span>
                      <span className="text-white font-medium">{room.players[0]?.name || 'في الانتظار'}</span>
                    </div>
                    <div className="flex items-center justify-between text-neutral-400">
                      <span>اللاعب الثاني:</span>
                      <span className="text-white font-medium">{room.players[1]?.name || 'في الانتظار'}</span>
                    </div>
                    <div className="flex items-center justify-between text-neutral-400">
                      <span>قيمة الجائزة:</span>
                      <span className="text-amber-400 font-bold font-mono">{room.betAmount * 2} ج.م</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Winner Celebration Modal */}
      {room && (
        <WinnerModal
          room={room}
          playerIndex={playerIndex}
          onNextRound={handleNextRound}
          isHost={isHost}
        />
      )}

      {/* Create Room Modal */}
      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateRoom={handleCreateRoom}
        createdRoomData={createdRoomInfo}
      />

      {/* Join Room Modal */}
      <JoinRoomModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        initialRoomId={roomId}
        onJoinRoom={handleJoinRoom}
      />

      {/* Room Links & Sharing Modal (Clients vs Host) */}
      {room && (
        <RoomLinksModal
          isOpen={isLinksModalOpen}
          onClose={() => setIsLinksModalOpen(false)}
          roomId={room.id}
          pin={room.pin}
          hostWallet={room.hostWallet}
          betAmount={room.betAmount}
          hostToken={hostToken}
        />
      )}
    </div>
  );
}
