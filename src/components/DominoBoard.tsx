import React, { useState } from 'react';
import { RoomState, Tile } from '../types/domino';
import { DominoTileView } from './DominoTileView';
import { getLegalMovesForTile, playerHasLegalMove } from '../utils/dominoEngine';
import { ArrowLeft, ArrowRight, Layers, Hand } from 'lucide-react';

interface DominoBoardProps {
  room: RoomState;
  playerIndex: number | null; // 0, 1, or null (spectator / host)
  isHost: boolean;
  onPlayTile: (tileIndex: number, preferredEnd: 'left' | 'right') => void;
  onDrawTile: () => void;
  onPassTurn: () => void;
}

export const DominoBoard: React.FC<DominoBoardProps> = ({
  room,
  playerIndex,
  isHost,
  onPlayTile,
  onDrawTile,
  onPassTurn,
}) => {
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null);

  const isPlayer = playerIndex === 0 || playerIndex === 1;
  const isMyTurn = isPlayer && room.turnIndex === playerIndex && room.status === 'playing';

  const myPlayer = isPlayer && playerIndex !== null ? room.players[playerIndex] : null;
  const opponentIndex = isPlayer && playerIndex !== null ? (playerIndex === 0 ? 1 : 0) : 1;
  const opponentPlayer = room.players[opponentIndex];
  const player0 = room.players[0];

  const leftOpen = room.board.leftOpen;
  const rightOpen = room.board.rightOpen;
  const isBoardEmpty = room.board.tiles.length === 0;

  const myHand = myPlayer?.hand || [];
  const hasAnyLegalMove = playerHasLegalMove(myHand, leftOpen, rightOpen, isBoardEmpty);

  // If a tile is selected, determine where it can be played
  const selectedTile = selectedTileIndex !== null ? myHand[selectedTileIndex] : null;
  const selectedLegalMoves = selectedTile
    ? getLegalMovesForTile(selectedTile, leftOpen, rightOpen, isBoardEmpty)
    : { canPlayLeft: false, canPlayRight: false };

  const handleTileClick = (index: number) => {
    if (!isMyTurn) return;
    const tile = myHand[index];
    if (!tile) return;

    const { canPlayLeft, canPlayRight } = getLegalMovesForTile(
      tile,
      leftOpen,
      rightOpen,
      isBoardEmpty
    );

    if (!isBoardEmpty && !canPlayLeft && !canPlayRight) {
      // Invalid tile
      return;
    }

    if (isBoardEmpty) {
      // First tile on board
      onPlayTile(index, 'left');
      setSelectedTileIndex(null);
      return;
    }

    // If fits only on one side, play immediately
    if (canPlayLeft && !canPlayRight) {
      onPlayTile(index, 'left');
      setSelectedTileIndex(null);
    } else if (canPlayRight && !canPlayLeft) {
      onPlayTile(index, 'right');
      setSelectedTileIndex(null);
    } else if (canPlayLeft && canPlayRight) {
      // Fits both sides, let player choose left or right end button
      setSelectedTileIndex(index === selectedTileIndex ? null : index);
    }
  };

  return (
    <div className="relative w-full flex flex-col rounded-2xl overflow-hidden border border-amber-900/40 bg-neutral-950 shadow-2xl">
      {/* Background with Egyptian Cafe Felt Table */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity pointer-events-none"
        style={{ backgroundImage: `url('/src/assets/images/domino_table_felt_1792945886923.jpg')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/80 via-emerald-950/40 to-neutral-950/90 pointer-events-none" />

      {/* Top HUD: Opponent Status Bar */}
      <div className="relative z-10 px-4 py-3 bg-neutral-900/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-neutral-800 border border-amber-500/30 flex items-center justify-center font-bold text-amber-400 text-sm">
            {opponentPlayer?.name ? opponentPlayer.name.charAt(0) : '؟'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white text-sm">
                {opponentPlayer?.name || 'في انتظار الخصم'}
              </span>
              {room.turnIndex === opponentIndex && room.status === 'playing' && (
                <span className="text-[11px] font-bold text-amber-400 animate-pulse">
                  (يفكر في النزول...)
                </span>
              )}
            </div>
            <div className="text-xs text-neutral-400 font-mono">
              كاش: {opponentPlayer?.phone || 'غير مسجل'} · الرصيد: {opponentPlayer?.score || 0} نقطة
            </div>
          </div>
        </div>

        {/* Opponent's Tiles in Hand (Facedown) */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-[280px] py-1">
          {opponentPlayer?.hand && opponentPlayer.hand.length > 0 ? (
            opponentPlayer.hand.map((_, i) => (
              <DominoTileView
                key={i}
                tile={[0, 0]}
                isFacedown={!isHost || room.status === 'playing'}
                size="sm"
                className="opacity-90 shadow-sm"
              />
            ))
          ) : (
            <span className="text-xs text-neutral-400">لا توجد قطع</span>
          )}
          <span className="text-xs font-mono text-neutral-300 font-bold bg-neutral-800 px-2 py-0.5 rounded-md shrink-0">
            {opponentPlayer?.hand?.length || 0} قطع
          </span>
        </div>
      </div>

      {/* Active Domino Arena / Table Canvas */}
      <div className="relative z-10 min-h-[360px] md:min-h-[420px] p-4 flex flex-col justify-between">
        {/* Open Ends Header Display */}
        <div className="flex items-center justify-between text-xs font-medium text-neutral-300 px-2 mb-2">
          <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-800/40 px-3 py-1.5 rounded-lg">
            <span className="text-emerald-400">طرف اليمين المفتوح:</span>
            <span className="font-mono text-sm font-bold text-white bg-emerald-900/60 px-2 py-0.5 rounded">
              {rightOpen !== null ? rightOpen : '-'}
            </span>
          </div>

          <div className="text-xs text-neutral-400 font-medium">
            الجولة {room.roundNumber} من التحدي (الهدف: {room.targetScore} نقطة)
          </div>

          <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-800/40 px-3 py-1.5 rounded-lg">
            <span className="text-emerald-400">طرف اليسار المفتوح:</span>
            <span className="font-mono text-sm font-bold text-white bg-emerald-900/60 px-2 py-0.5 rounded">
              {leftOpen !== null ? leftOpen : '-'}
            </span>
          </div>
        </div>

        {/* Center Felt with Played Tiles */}
        <div className="flex-1 flex items-center justify-center overflow-x-auto overflow-y-hidden py-4 px-2 scrollbar-thin">
          {isBoardEmpty ? (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-black/30 rounded-xl border border-dashed border-amber-600/30 backdrop-blur-sm max-w-md">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
                <Layers className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-amber-200 mb-1">
                طاولة الدومينو جاهزة لبدء الجولة
              </h4>
              <p className="text-xs text-neutral-300">
                {isMyTurn
                  ? 'دورك لبدء اللعب! اختر قطعة من يدك في الأسفل لإنزالها على الطاولة.'
                  : `في انتظار ${room.players[room.turnIndex]?.name || 'اللاعب الآخر'} لافتتاح الطاولة...`}
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1.5 min-w-max px-4">
              {/* Optional Prompt to Drop on Left when Tile is Selected */}
              {selectedTileIndex !== null && selectedLegalMoves.canPlayLeft && (
                <button
                  type="button"
                  onClick={() => {
                    onPlayTile(selectedTileIndex, 'left');
                    setSelectedTileIndex(null);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg animate-bounce transition-all shrink-0 cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>النزول يساراً [{leftOpen}]</span>
                </button>
              )}

              {/* Played Chain Tiles */}
              {room.board.tiles.map((pt, idx) => (
                <DominoTileView
                  key={idx}
                  tile={pt.flipped ? [pt.rightPip, pt.leftPip] : [pt.leftPip, pt.rightPip]}
                  orientation={pt.orientation}
                  size="md"
                  className="shadow-xl"
                />
              ))}

              {/* Optional Prompt to Drop on Right when Tile is Selected */}
              {selectedTileIndex !== null && selectedLegalMoves.canPlayRight && (
                <button
                  type="button"
                  onClick={() => {
                    onPlayTile(selectedTileIndex, 'right');
                    setSelectedTileIndex(null);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg animate-bounce transition-all shrink-0 cursor-pointer"
                >
                  <span>النزول يميناً [{rightOpen}]</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Turn & Action Bar */}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3 bg-neutral-900/80 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/5">
          <div className="flex items-center gap-3">
            {isMyTurn ? (
              <span className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1 rounded-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                دورك الآن - اختر قطعة للعب
              </span>
            ) : (
              <span className="text-xs text-neutral-400">
                دور: <strong className="text-white">{room.players[room.turnIndex]?.name || 'الخصم'}</strong>
              </span>
            )}

            {selectedTileIndex !== null && (
              <span className="text-xs text-amber-300 font-medium">
                قطعة محددة: [{myHand[selectedTileIndex]?.[0]}-{myHand[selectedTileIndex]?.[1]}] · اختر طرف النزول
              </span>
            )}
          </div>

          {/* Action Buttons: Draw from Boneyard & Pass Turn */}
          <div className="flex items-center gap-2">
            {/* Draw Tile Button */}
            <button
              type="button"
              disabled={!isMyTurn || room.boneyardCount === 0 || hasAnyLegalMove}
              onClick={onDrawTile}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isMyTurn && !hasAnyLegalMove && room.boneyardCount > 0
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg animate-pulse cursor-pointer'
                  : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700/50'
              }`}
              title={
                hasAnyLegalMove
                  ? 'لديك حركة قانونية متاحة بيدك'
                  : room.boneyardCount === 0
                  ? 'الشكارة فارغة'
                  : 'اسحب قطعة'
              }
            >
              <Layers className="w-3.5 h-3.5" />
              <span>سحب من الشكارة ({room.boneyardCount})</span>
            </button>

            {/* Pass Turn Button */}
            <button
              type="button"
              disabled={!isMyTurn || hasAnyLegalMove || room.boneyardCount > 0}
              onClick={onPassTurn}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isMyTurn && !hasAnyLegalMove && room.boneyardCount === 0
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg cursor-pointer'
                  : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700/50'
              }`}
              title="قول باص في حالة عدم توفر أي حركة والشكارة فارغة"
            >
              <Hand className="w-3.5 h-3.5" />
              <span>قول: باص!</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Zone: My Hand */}
      <div className="relative z-10 p-4 bg-neutral-900/90 backdrop-blur-md border-t border-white/5">
        <div className="flex items-center justify-between mb-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
              {myPlayer ? myPlayer.name.charAt(0) : 'أنا'}
            </div>
            <span className="font-bold text-white text-sm">
              {myPlayer ? myPlayer.name : 'أنت'}
            </span>
            <span className="text-neutral-400 font-mono">
              (محفظة كاش: {myPlayer?.phone || '-'} · نقاطك: {myPlayer?.score || 0})
            </span>
          </div>

          <div className="text-neutral-400">
            {myHand.length} قطع في اليد · {hasAnyLegalMove && isMyTurn ? 'يوجد قطع قابلة للعب' : ''}
          </div>
        </div>

        {/* My Tiles Tray */}
        <div className="flex items-center justify-center gap-2 md:gap-3 overflow-x-auto py-2 px-1">
          {myHand.length > 0 ? (
            myHand.map((tile, idx) => {
              const { canPlayLeft, canPlayRight } = getLegalMovesForTile(
                tile,
                leftOpen,
                rightOpen,
                isBoardEmpty
              );
              const playable = isMyTurn && (isBoardEmpty || canPlayLeft || canPlayRight);
              const isSelected = selectedTileIndex === idx;

              return (
                <div key={idx} className="relative transition-transform">
                  <DominoTileView
                    tile={tile}
                    size="md"
                    isPlayable={playable}
                    isSelected={isSelected}
                    onClick={() => handleTileClick(idx)}
                    badge={playable && !isBoardEmpty ? (canPlayLeft && canPlayRight ? 'طرفين' : 'متاح') : undefined}
                  />
                </div>
              );
            })
          ) : (
            <div className="text-xs text-neutral-400 py-3">
              لا توجد قطع بيدك
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
