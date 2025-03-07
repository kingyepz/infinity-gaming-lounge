import { users, games, transactions } from "@shared/schema";
import type { User, InsertUser, Game, InsertGame, Transaction, InsertTransaction } from "@shared/schema";

export interface IStorage {
  // User Operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPoints(id: number, points: number): Promise<User>;
  
  // Game Operations
  getGames(): Promise<Game[]>;
  createGame(game: InsertGame): Promise<Game>;
  updateGame(id: number, game: Partial<Game>): Promise<Game>;
  
  // Transaction Operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactionsByUser(userId: number): Promise<Transaction[]>;
  updateTransactionStatus(id: number, status: string, mpesaRef?: string): Promise<Transaction>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private games: Map<number, Game>;
  private transactions: Map<number, Transaction>;
  private currentIds: { users: number; games: number; transactions: number };

  constructor() {
    this.users = new Map();
    this.games = new Map();
    this.transactions = new Map();
    this.currentIds = { users: 1, games: 1, transactions: 1 };

    // Create default test accounts
    this.createUser({
      displayName: "Admin Test",
      gamingName: "admin",
      phoneNumber: "254700000000",
      role: "admin"
    });

    this.createUser({
      displayName: "Staff Test",
      gamingName: "staff",
      phoneNumber: "254700000001",
      role: "staff"
    });
  }

  // User Operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.users++;
    const user: User = { 
      ...insertUser, 
      id, 
      points: 0,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserPoints(id: number, points: number): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error("User not found");
    
    const updated = { ...user, points: user.points + points };
    this.users.set(id, updated);
    return updated;
  }

  // Game Operations
  async getGames(): Promise<Game[]> {
    return Array.from(this.games.values());
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    const id = this.currentIds.games++;
    const game: Game = { ...insertGame, id };
    this.games.set(id, game);
    return game;
  }

  async updateGame(id: number, gameUpdate: Partial<Game>): Promise<Game> {
    const game = this.games.get(id);
    if (!game) throw new Error("Game not found");
    
    const updated = { ...game, ...gameUpdate };
    this.games.set(id, updated);
    return updated;
  }

  // Transaction Operations
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentIds.transactions++;
    const transaction: Transaction = {
      ...insertTransaction,
      id,
      paymentStatus: "pending",
      mpesaRef: null,
      createdAt: new Date(),
      points: Math.floor(insertTransaction.amount / 100) // 1 point per 100 spent
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async getTransactionsByUser(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(t => t.userId === userId);
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