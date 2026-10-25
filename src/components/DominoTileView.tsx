import React from 'react';
import { Tile } from '../types/domino';

interface DominoTileViewProps {
  tile: Tile;
  isFacedown?: boolean;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  isPlayable?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
  badge?: string;
}

// Render pips for a single half (value 0-6)
function PipGrid({ value, size }: { value: number; size: 'sm' | 'md' | 'lg' }) {
  const dotSize =
    size === 'sm' ? 'w-1.5 h-1.5' : size === 'md' ? 'w-2 h-2' : 'w-2.5 h-2.5';

  const positions: Record<number, number[]> = {
    0: [],
    1: [4], // Center
    2: [0, 8], // Top-left, bottom-right
    3: [0, 4, 8], // Diagonal
    4: [0, 2, 6, 8], // Corners
    5: [0, 2, 4, 6, 8], // Corners + Center
    6: [0, 2, 3, 5, 6, 8], // 2 rows/columns of 3 (0,3,6 and 2,5,8)
  };

  const activePips = new Set(positions[value] || []);

  return (
    <div className="grid grid-cols-3 grid-rows-3 gap-0.5 p-1 place-items-center w-full h-full aspect-square">
      {[...Array(9)].map((_, i) => (
        <div key={i} className="flex items-center justify-center w-full h-full">
          {activePips.has(i) ? (
            <div
              className={`${dotSize} rounded-full bg-neutral-900 shadow-[inset_0_1px_1px_rgba(0,0,0,0.8)]`}
            />
          ) : (
            <div className={`${dotSize} opacity-0`} />
          )}
        </div>
      ))}
    </div>
  );
}

export const DominoTileView: React.FC<DominoTileViewProps> = ({
  tile,
  isFacedown = false,
  orientation = 'vertical',
  size = 'md',
  isPlayable = false,
  isSelected = false,
  onClick,
  className = '',
  badge,
}) => {
  const [val1, val2] = tile;

  // Size dimensions
  const dims = {
    sm: orientation === 'vertical' ? 'w-8 h-16' : 'w-16 h-8',
    md: orientation === 'vertical' ? 'w-11 h-22' : 'w-22 h-11',
    lg: orientation === 'vertical' ? 'w-14 h-28' : 'w-28 h-14',
  }[size];

  if (isFacedown) {
    return (
      <div
        className={`relative ${dims} select-none rounded-md bg-gradient-to-br from-amber-100 via-amber-50 to-stone-200 border border-amber-300/40 shadow-md flex items-center justify-center p-1 cursor-default ${className}`}
      >
        <div className="w-full h-full rounded border border-amber-200/60 bg-amber-200/20 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-600/30 border border-amber-700/30" />
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={isPlayable || onClick ? onClick : undefined}
      disabled={!onClick && !isPlayable}
      className={`group relative ${dims} select-none rounded-md transition-all duration-150 flex ${
        orientation === 'vertical' ? 'flex-col' : 'flex-row'
      } items-center justify-between p-1 bg-gradient-to-b from-[#FAF8F5] via-[#F4EFEA] to-[#EAE3DB] border ${
        isSelected
          ? 'ring-2 ring-amber-400 border-amber-500 scale-105 shadow-xl z-20'
          : isPlayable
          ? 'border-emerald-500/80 shadow-[0_0_12px_rgba(16,185,129,0.35)] hover:scale-105 hover:-translate-y-1 cursor-pointer z-10'
          : 'border-stone-300 shadow-md cursor-default'
      } ${className}`}
      style={{
        boxShadow: isSelected
          ? '0 0 15px rgba(245, 158, 11, 0.5), inset 0 1px 2px rgba(255,255,255,0.9)'
          : isPlayable
          ? '0 4px 10px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.9)'
          : '0 2px 5px rgba(0,0,0,0.25), inset 0 1px 2px rgba(255,255,255,0.9)',
      }}
    >
      {/* Top / Left Half */}
      <div className="flex-1 flex items-center justify-center w-full h-full">
        <PipGrid value={val1} size={size} />
      </div>

      {/* Brass Divider Bar with Egyptian Cafe Style Spinner Pin */}
      <div
        className={`relative flex items-center justify-center bg-stone-300/80 shrink-0 ${
          orientation === 'vertical' ? 'w-full h-[1.5px] my-0.5' : 'h-full w-[1.5px] mx-0.5'
        }`}
      >
        {/* Brass spinner rivet */}
        <div className="absolute w-1.5 h-1.5 rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 shadow-[0_0.5px_1px_rgba(0,0,0,0.6)]" />
      </div>

      {/* Bottom / Right Half */}
      <div className="flex-1 flex items-center justify-center w-full h-full">
        <PipGrid value={val2} size={size} />
      </div>

      {/* Playable Pulse Badge */}
      {badge && (
        <span className="absolute -top-2 -right-2 bg-emerald-600 text-[10px] font-bold text-white px-1.5 py-0.2 rounded-full shadow-md z-30">
          {badge}
        </span>
      )}
    </button>
  );
};
