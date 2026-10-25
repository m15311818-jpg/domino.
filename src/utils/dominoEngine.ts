import { Tile, PlayedTile, Player, ServerRoomState } from '../types/domino';

// Generate standard 28 domino tiles
export function generateFullDominoSet(): Tile[] {
  const set: Tile[] = [];
  for (let i = 0; i <= 6; i++) {
    for (let j = i; j <= 6; j++) {
      set.push([i, j]);
    }
  }
  return set;
}

// Fisher-Yates shuffle
export function shuffleTiles(tiles: Tile[]): Tile[] {
  const arr = [...tiles];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Find highest double or highest sum in hand
export function getHighestLeadTile(hand: Tile[]): { tile: Tile; score: number } {
  let highestDouble: Tile | null = null;
  let maxDoubleValue = -1;

  let highestSumTile: Tile = hand[0] || [0, 0];
  let maxSum = -1;

  for (const t of hand) {
    if (t[0] === t[1] && t[0] > maxDoubleValue) {
      maxDoubleValue = t[0];
      highestDouble = t;
    }
    const sum = t[0] + t[1];
    if (sum > maxSum) {
      maxSum = sum;
      highestSumTile = t;
    }
  }

  if (highestDouble) {
    return { tile: highestDouble, score: 100 + maxDoubleValue };
  }
  return { tile: highestSumTile, score: maxSum };
}

// Calculate sum of pips on tiles
export function calculateHandPips(hand: Tile[]): number {
  return hand.reduce((acc, t) => acc + t[0] + t[1], 0);
}

// Check if a tile can be played on left or right open ends
export function getLegalMovesForTile(
  tile: Tile,
  leftOpen: number | null,
  rightOpen: number | null,
  isBoardEmpty: boolean
): { canPlayLeft: boolean; canPlayRight: boolean } {
  if (isBoardEmpty) {
    return { canPlayLeft: true, canPlayRight: true };
  }
  if (leftOpen === null || rightOpen === null) {
    return { canPlayLeft: false, canPlayRight: false };
  }

  const [a, b] = tile;
  const canPlayLeft = a === leftOpen || b === leftOpen;
  const canPlayRight = a === rightOpen || b === rightOpen;

  return { canPlayLeft, canPlayRight };
}

// Check if hand has any legal move
export function playerHasLegalMove(
  hand: Tile[],
  leftOpen: number | null,
  rightOpen: number | null,
  isBoardEmpty: boolean
): boolean {
  if (isBoardEmpty) return hand.length > 0;
  return hand.some((t) => {
    const { canPlayLeft, canPlayRight } = getLegalMovesForTile(
      t,
      leftOpen,
      rightOpen,
      isBoardEmpty
    );
    return canPlayLeft || canPlayRight;
  });
}

// Start a fresh round
export function initializeRound(
  room: ServerRoomState,
  starterOverride?: number
): ServerRoomState {
  const deck = shuffleTiles(generateFullDominoSet());
  const hand0 = deck.slice(0, 7);
  const hand1 = deck.slice(7, 14);
  const boneyard = deck.slice(14);

  let starterIndex = starterOverride ?? 0;
  if (starterOverride === undefined) {
    const lead0 = getHighestLeadTile(hand0);
    const lead1 = getHighestLeadTile(hand1);
    starterIndex = lead0.score >= lead1.score ? 0 : 1;
  }

  const player0 = room.players[0] ? { ...room.players[0], hand: hand0 } : null;
  const player1 = room.players[1] ? { ...room.players[1], hand: hand1 } : null;

  return {
    ...room,
    status: 'playing',
    players: [player0, player1],
    board: {
      tiles: [],
      leftOpen: null,
      rightOpen: null,
    },
    boneyard,
    boneyardCount: boneyard.length,
    turnIndex: starterIndex,
    starterIndex,
    roundNumber: room.roundNumber + 1,
    winnerPlayerIndex: null,
    matchWinnerIndex: null,
    roundEndReason: null,
  };
}

// Play a tile
export function applyPlayTile(
  room: ServerRoomState,
  playerIndex: number,
  tileIndex: number,
  preferredEnd: 'left' | 'right' = 'left'
): { success: boolean; nextRoom: ServerRoomState; message?: string } {
  if (room.turnIndex !== playerIndex || room.status !== 'playing') {
    return { success: false, nextRoom: room, message: 'ليس دورك الآن' };
  }

  const player = room.players[playerIndex];
  if (!player || !player.hand[tileIndex]) {
    return { success: false, nextRoom: room, message: 'القطعة غير موجودة' };
  }

  const tile = player.hand[tileIndex];
  const isBoardEmpty = room.board.tiles.length === 0;

  const { canPlayLeft, canPlayRight } = getLegalMovesForTile(
    tile,
    room.board.leftOpen,
    room.board.rightOpen,
    isBoardEmpty
  );

  if (!isBoardEmpty && !canPlayLeft && !canPlayRight) {
    return { success: false, nextRoom: room, message: 'حركة غير صحيحة - الرقم لا يطابق أطراف اللعب' };
  }

  // Determine end
  let chosenEnd: 'left' | 'right' = preferredEnd;
  if (!isBoardEmpty) {
    if (preferredEnd === 'left' && !canPlayLeft && canPlayRight) {
      chosenEnd = 'right';
    } else if (preferredEnd === 'right' && !canPlayRight && canPlayLeft) {
      chosenEnd = 'left';
    }
  }

  const isDouble = tile[0] === tile[1];
  let leftPip = tile[0];
  let rightPip = tile[1];
  let newLeftOpen = room.board.leftOpen;
  let newRightOpen = room.board.rightOpen;
  let flipped = false;

  if (isBoardEmpty) {
    newLeftOpen = tile[0];
    newRightOpen = tile[1];
    leftPip = tile[0];
    rightPip = tile[1];
  } else if (chosenEnd === 'left') {
    if (tile[0] === room.board.leftOpen) {
      // Connects with tile[0], other end becomes new left
      newLeftOpen = tile[1];
      leftPip = tile[1];
      rightPip = tile[0];
      flipped = true;
    } else {
      newLeftOpen = tile[0];
      leftPip = tile[0];
      rightPip = tile[1];
      flipped = false;
    }
  } else {
    // chosenEnd === 'right'
    if (tile[0] === room.board.rightOpen) {
      newRightOpen = tile[1];
      leftPip = tile[0];
      rightPip = tile[1];
      flipped = false;
    } else {
      newRightOpen = tile[0];
      leftPip = tile[1];
      rightPip = tile[0];
      flipped = true;
    }
  }

  const newPlayedTile: PlayedTile = {
    tile,
    end: chosenEnd,
    orientation: isDouble ? 'vertical' : 'horizontal',
    flipped,
    leftPip,
    rightPip,
  };

  const newBoardTiles =
    chosenEnd === 'left'
      ? [newPlayedTile, ...room.board.tiles]
      : [...room.board.tiles, newPlayedTile];

  // Remove played tile from hand
  const newHand = player.hand.filter((_, idx) => idx !== tileIndex);
  const updatedPlayer = { ...player, hand: newHand };

  const updatedPlayers: [Player | null, Player | null] = [
    playerIndex === 0 ? updatedPlayer : room.players[0],
    playerIndex === 1 ? updatedPlayer : room.players[1],
  ];

  const opponentIndex = playerIndex === 0 ? 1 : 0;
  const opponent = updatedPlayers[opponentIndex];

  // Check Round Win Condition 1: Player emptied their hand!
  if (newHand.length === 0) {
    const opponentPips = opponent ? calculateHandPips(opponent.hand) : 0;
    const addedScore = Math.max(opponentPips, 5); // Minimum 5 points in domino
    const newPlayerScore = updatedPlayer.score + addedScore;
    const finalPlayer = { ...updatedPlayer, score: newPlayerScore };
    updatedPlayers[playerIndex] = finalPlayer;

    const hasWonMatch = newPlayerScore >= room.targetScore;

    return {
      success: true,
      nextRoom: {
        ...room,
        board: {
          tiles: newBoardTiles,
          leftOpen: newLeftOpen,
          rightOpen: newRightOpen,
        },
        players: updatedPlayers,
        winnerPlayerIndex: playerIndex,
        matchWinnerIndex: hasWonMatch ? playerIndex : null,
        roundEndReason: 'domino',
        status: hasWonMatch ? 'match_ended' : 'round_ended',
      },
    };
  }

  // Check Round Win Condition 2: Blocked / قفلة
  // If boneyard is empty and neither player can move
  const canPlayerMove = playerHasLegalMove(newHand, newLeftOpen, newRightOpen, false);
  const canOpponentMove = opponent
    ? playerHasLegalMove(opponent.hand, newLeftOpen, newRightOpen, false)
    : false;

  const isBlocked = room.boneyard.length === 0 && !canPlayerMove && !canOpponentMove;

  if (isBlocked && opponent) {
    const p1Pips = calculateHandPips(newHand);
    const p2Pips = calculateHandPips(opponent.hand);

    let roundWinner: number | null = null;
    let pointDiff = 0;

    if (p1Pips < p2Pips) {
      roundWinner = playerIndex;
      pointDiff = p2Pips - p1Pips;
      updatedPlayers[playerIndex] = {
        ...updatedPlayer,
        score: updatedPlayer.score + pointDiff,
      };
    } else if (p2Pips < p1Pips) {
      roundWinner = opponentIndex;
      pointDiff = p1Pips - p2Pips;
      updatedPlayers[opponentIndex] = {
        ...opponent,
        score: opponent.score + pointDiff,
      };
    } // If tied, roundWinner is null (no points)

    const finalWinnerScore =
      roundWinner !== null ? updatedPlayers[roundWinner]?.score || 0 : 0;
    const hasWonMatch = finalWinnerScore >= room.targetScore;

    return {
      success: true,
      nextRoom: {
        ...room,
        board: {
          tiles: newBoardTiles,
          leftOpen: newLeftOpen,
          rightOpen: newRightOpen,
        },
        players: updatedPlayers,
        winnerPlayerIndex: roundWinner,
        matchWinnerIndex: hasWonMatch ? roundWinner : null,
        roundEndReason: 'blocked',
        status: hasWonMatch ? 'match_ended' : 'round_ended',
      },
    };
  }

  // Next player's turn
  return {
    success: true,
    nextRoom: {
      ...room,
      board: {
        tiles: newBoardTiles,
        leftOpen: newLeftOpen,
        rightOpen: newRightOpen,
      },
      players: updatedPlayers,
      turnIndex: opponentIndex,
    },
  };
}

// Draw a tile from boneyard
export function applyDrawTile(
  room: ServerRoomState,
  playerIndex: number
): { success: boolean; nextRoom: ServerRoomState; drawnTile?: Tile; message?: string } {
  if (room.turnIndex !== playerIndex || room.status !== 'playing') {
    return { success: false, nextRoom: room, message: 'ليس دورك الآن' };
  }

  if (room.boneyard.length === 0) {
    return { success: false, nextRoom: room, message: 'لا توجد قطع متبقية في السحب' };
  }

  const drawnTile = room.boneyard[0];
  const newBoneyard = room.boneyard.slice(1);

  const player = room.players[playerIndex];
  if (!player) return { success: false, nextRoom: room };

  const updatedPlayer = {
    ...player,
    hand: [...player.hand, drawnTile],
  };

  const updatedPlayers: [Player | null, Player | null] = [
    playerIndex === 0 ? updatedPlayer : room.players[0],
    playerIndex === 1 ? updatedPlayer : room.players[1],
  ];

  return {
    success: true,
    drawnTile,
    nextRoom: {
      ...room,
      boneyard: newBoneyard,
      boneyardCount: newBoneyard.length,
      players: updatedPlayers,
    },
  };
}

// Pass turn when no legal moves and boneyard is empty
export function applyPassTurn(
  room: ServerRoomState,
  playerIndex: number
): { success: boolean; nextRoom: ServerRoomState; message?: string } {
  if (room.turnIndex !== playerIndex || room.status !== 'playing') {
    return { success: false, nextRoom: room, message: 'ليس دورك الآن' };
  }

  const player = room.players[playerIndex];
  if (!player) return { success: false, nextRoom: room };

  const canMove = playerHasLegalMove(
    player.hand,
    room.board.leftOpen,
    room.board.rightOpen,
    room.board.tiles.length === 0
  );

  if (canMove) {
    return { success: false, nextRoom: room, message: 'لديك حركة قانونية متاحة، لا يمكنك قول باص' };
  }

  if (room.boneyard.length > 0) {
    return { success: false, nextRoom: room, message: 'يجب أن تسحب من القطع المتبقية أولاً' };
  }

  const opponentIndex = playerIndex === 0 ? 1 : 0;
  const opponent = room.players[opponentIndex];

  // If opponent also cannot move, game is blocked!
  const opponentCanMove = opponent
    ? playerHasLegalMove(
        opponent.hand,
        room.board.leftOpen,
        room.board.rightOpen,
        room.board.tiles.length === 0
      )
    : false;

  if (!opponentCanMove && opponent) {
    // Blocked game
    const p1Pips = calculateHandPips(player.hand);
    const p2Pips = calculateHandPips(opponent.hand);

    let roundWinner: number | null = null;
    let pointDiff = 0;

    const updatedPlayers: [Player | null, Player | null] = [...room.players];

    if (p1Pips < p2Pips) {
      roundWinner = playerIndex;
      pointDiff = p2Pips - p1Pips;
      updatedPlayers[playerIndex] = {
        ...player,
        score: player.score + pointDiff,
      };
    } else if (p2Pips < p1Pips) {
      roundWinner = opponentIndex;
      pointDiff = p1Pips - p2Pips;
      updatedPlayers[opponentIndex] = {
        ...opponent,
        score: opponent.score + pointDiff,
      };
    }

    const finalWinnerScore =
      roundWinner !== null ? updatedPlayers[roundWinner]?.score || 0 : 0;
    const hasWonMatch = finalWinnerScore >= room.targetScore;

    return {
      success: true,
      nextRoom: {
        ...room,
        players: updatedPlayers,
        winnerPlayerIndex: roundWinner,
        matchWinnerIndex: hasWonMatch ? roundWinner : null,
        roundEndReason: 'blocked',
        status: hasWonMatch ? 'match_ended' : 'round_ended',
      },
    };
  }

  return {
    success: true,
    nextRoom: {
      ...room,
      turnIndex: opponentIndex,
    },
  };
}
