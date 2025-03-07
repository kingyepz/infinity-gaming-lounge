import { gameStations, games, transactions } from "@shared/schema";
import type { GameStation, InsertGameStation, Game, InsertGame, Transaction, InsertTransaction } from "@shared/schema";

export interface IStorage {
  // Game Station Operations
  getGameStations(): Promise<GameStation[]>;
  updateGameStation(id: number, station: Partial<GameStation>): Promise<GameStation>;

  // Game Operations
  getGames(): Promise<Game[]>;

  // Transaction Operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactionsByStation(stationId: number): Promise<Transaction[]>;
  updateTransactionStatus(id: number, status: string, mpesaRef?: string): Promise<Transaction>;
}

export class MemStorage implements IStorage {
  private gameStations: Map<number, GameStation>;
  private games: Map<number, Game>;
  private transactions: Map<number, Transaction>;
  private currentIds: { stations: number; games: number; transactions: number };

  constructor() {
    this.gameStations = new Map();
    this.games = new Map();
    this.transactions = new Map();
    this.currentIds = { stations: 1, games: 1, transactions: 1 };

    // Initialize 10 game stations
    for (let i = 1; i <= 10; i++) {
      const station: GameStation = {
        id: i,
        name: `Game Station ${i}`,
        isActive: true,
        currentCustomer: null,
        currentGame: null,
        sessionType: null,
        sessionStartTime: null,
        baseRate: 40,
        hourlyRate: 200
      };
      this.gameStations.set(i, station);
    }

    // Initialize default games
    const defaultGames = [
      "FC25",
      "GTA 5",
      "GTA 6",
      "NBA 2K25",
      "F1 Racing",
      "VR Games"
    ];

    defaultGames.forEach((name, index) => {
      const game: Game = {
        id: index + 1,
        name,
        isActive: true
      };
      this.games.set(game.id, game);
    });
  }

  // Game Station Operations
  async getGameStations(): Promise<GameStation[]> {
    return Array.from(this.gameStations.values());
  }

  async updateGameStation(id: number, update: Partial<GameStation>): Promise<GameStation> {
    const station = this.gameStations.get(id);
    if (!station) throw new Error("Game station not found");

    const updated = { ...station, ...update };
    this.gameStations.set(id, updated);
    return updated;
  }

  // Game Operations
  async getGames(): Promise<Game[]> {
    return Array.from(this.games.values());
  }

  // Transaction Operations
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentIds.transactions++;
    const transaction: Transaction = {
      ...insertTransaction,
      id,
      paymentStatus: "pending",
      mpesaRef: null,
      createdAt: new Date()
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async getTransactionsByStation(stationId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(t => t.stationId === stationId);
  }

  async updateTransactionStatus(id: number, status: string, mpesaRef?: string): Promise<Transaction> {
    const transaction = this.transactions.get(id);
    if (!transaction) throw new Error("Transaction not found");

    const updated = { ...transaction, paymentStatus: status, mpesaRef };
    this.transactions.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();