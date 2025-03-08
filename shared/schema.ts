
// User types
export interface User {
  id: number;
  displayName: string;
  gamingName: string;
  phoneNumber: string;
  password: string;
  role: "admin" | "staff" | "customer";
  points: number;
  createdAt: Date;
}

export type UserWithoutPassword = Omit<User, "password">;

// Game session types
export interface GameSession {
  id: number;
  userId: number;
  gameType: "fc25" | "fc26" | "nba2k" | "other";
  startTime: Date;
  endTime: Date | null;
  pointsEarned: number | null;
  cost: number;
  isPartOfStreakSession?: boolean;
  streakSessionId?: number | null;
}

// Payment types
export interface Payment {
  id: number;
  userId: number;
  amount: number;
  paymentMethod: "mpesa" | "cash" | "card" | "points";
  description: string;
  timestamp: Date;
  pointsEarned: number | null;
}

// Loyalty point types
export interface PointTransaction {
  id: number;
  userId: number;
  points: number; // positive for earned, negative for spent
  description: string;
  timestamp: Date;
}

// Streak session
export interface StreakSession {
  id: number;
  userId: number;
  startTime: Date;
  endTime: Date | null;
  gameSessions: number[]; // IDs of the game sessions in this streak
  completed: boolean;
  bonusAwarded: boolean;
}

// Bonus game
export interface BonusGame {
  id: number;
  userId: number;
  gameType: "fc25" | "fc26" | "nba2k" | "other";
  used: boolean;
  createdAt: Date;
  usedAt?: Date;
}
