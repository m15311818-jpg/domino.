export type Tile = [number, number];

export interface PlayedTile {
  tile: Tile;
  end: 'left' | 'right';
  orientation: 'horizontal' | 'vertical';
  flipped: boolean;
  leftPip: number;
  rightPip: number;
}

export type PaymentStatus = 'pending' | 'submitted' | 'approved' | 'rejected';

export interface Player {
  id: string;
  name: string;
  phone: string; // Vodafone Cash mobile number
  hand: Tile[];
  score: number;
  paymentStatus: PaymentStatus;
  senderPhone?: string;
  transferRef?: string;
  paymentSubmittedAt?: number;
  isReady: boolean;
  connected: boolean;
}

export type RoomStatus =
  | 'waiting_players'
  | 'payment_pending'
  | 'playing'
  | 'round_ended'
  | 'match_ended';

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: number;
}

export interface ActivityLog {
  id: string;
  text: string;
  time: number;
  type: 'info' | 'payment' | 'game' | 'payout';
}

export interface RoomState {
  id: string;
  hostWallet: string;
  pin: string;
  betAmount: number;
  targetScore: number;
  status: RoomStatus;
  players: [Player | null, Player | null];
  board: {
    tiles: PlayedTile[];
    leftOpen: number | null;
    rightOpen: number | null;
  };
  boneyardCount: number;
  turnIndex: number;
  starterIndex: number;
  roundNumber: number;
  winnerPlayerIndex: number | null;
  matchWinnerIndex: number | null;
  roundEndReason: 'domino' | 'blocked' | null;
  payoutStatus: 'unpaid' | 'paid';
  payoutTxRef?: string;
  chatMessages: ChatMessage[];
  logs: ActivityLog[];
  createdAt: number;
}

export interface ServerRoomState extends RoomState {
  hostToken: string;
  boneyard: Tile[];
}
