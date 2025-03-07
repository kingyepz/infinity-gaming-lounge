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
import { db } from "./db";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";

class StorageService {
  // Game Station Methods
  async getGameStations() {
    try {
      return await db.select().from(schema.gameStations);
    } catch (error) {
      console.error("Error fetching game stations:", error);
      return [];
    }
  }

  async updateGameStation(id: number, data: any) {
    try {
      await db.update(schema.gameStations)
        .set(data)
        .where(eq(schema.gameStations.id, id));
      
      return await db.select()
        .from(schema.gameStations)
        .where(eq(schema.gameStations.id, id))
        .then(res => res[0]);
    } catch (error) {
      console.error("Error updating game station:", error);
      throw error;
    }
  }

  // Game Methods
  async getGames() {
    try {
      return await db.select().from(schema.games);
    } catch (error) {
      console.error("Error fetching games:", error);
      return [];
    }
  }

  // Transaction Methods
  async createTransaction(data: schema.InsertTransaction) {
    try {
      const result = await db.insert(schema.transactions)
        .values({
          ...data,
          paymentStatus: "pending"
        })
        .returning();
      
      // If customer exists, award loyalty points
      if (data.userId) {
        await this.awardLoyaltyPoints(data.userId, Math.floor(data.amount / 100));
      }
      
      return result[0];
    } catch (error) {
      console.error("Error creating transaction:", error);
      throw error;
    }
  }

  async getTransactionsByStation(stationId: number) {
    try {
      return await db.select()
        .from(schema.transactions)
        .where(eq(schema.transactions.stationId, stationId));
    } catch (error) {
      console.error("Error fetching transactions by station:", error);
      return [];
    }
  }

  async getTransactionsByUser(userId: number) {
    try {
      return await db.select()
        .from(schema.transactions)
        .where(eq(schema.transactions.userId, userId));
    } catch (error) {
      console.error("Error fetching transactions by user:", error);
      return [];
    }
  }

  async updateTransactionStatus(id: number, status: string, mpesaRef?: string) {
    try {
      await db.update(schema.transactions)
        .set({ 
          paymentStatus: status,
          mpesaRef: mpesaRef
        })
        .where(eq(schema.transactions.id, id));
      
      return await db.select()
        .from(schema.transactions)
        .where(eq(schema.transactions.id, id))
        .then(res => res[0]);
    } catch (error) {
      console.error("Error updating transaction status:", error);
      throw error;
    }
  }

  // User Methods
  async createUser(data: schema.InsertUser) {
    try {
      const result = await db.insert(schema.users)
        .values({
          ...data,
          points: 0
        })
        .returning();
      
      return result[0];
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async getUserByPhone(phoneNumber: string) {
    try {
      return await db.select()
        .from(schema.users)
        .where(eq(schema.users.phoneNumber, phoneNumber))
        .then(res => res[0] || null);
    } catch (error) {
      console.error("Error fetching user by phone:", error);
      return null;
    }
  }

  async getUserById(id: number) {
    try {
      return await db.select()
        .from(schema.users)
        .where(eq(schema.users.id, id))
        .then(res => res[0] || null);
    } catch (error) {
      console.error("Error fetching user by id:", error);
      return null;
    }
  }

  async awardLoyaltyPoints(userId: number, points: number) {
    try {
      const user = await this.getUserById(userId);
      if (!user) throw new Error("User not found");
      
      const newPoints = (user.points || 0) + points;
      
      await db.update(schema.users)
        .set({ points: newPoints })
        .where(eq(schema.users.id, userId));
      
      return newPoints;
    } catch (error) {
      console.error("Error awarding loyalty points:", error);
      throw error;
    }
  }

  async redeemLoyaltyPoints(userId: number, points: number) {
    try {
      const user = await this.getUserById(userId);
      if (!user) throw new Error("User not found");
      if ((user.points || 0) < points) throw new Error("Insufficient points");
      
      const newPoints = (user.points || 0) - points;
      
      await db.update(schema.users)
        .set({ points: newPoints })
        .where(eq(schema.users.id, userId));
      
      return newPoints;
    } catch (error) {
      console.error("Error redeeming loyalty points:", error);
      throw error;
    }
  }

  // Mock data initialization for testing
  async initializeMockData() {
    try {
      // Check if we already have data
      const stations = await this.getGameStations();
      if (stations.length > 0) return;
      
      // Create game stations
      await db.insert(schema.gameStations).values([
        { name: "PlayStation 5 - 1", isActive: true, baseRate: 500, hourlyRate: 800 },
        { name: "PlayStation 5 - 2", isActive: true, baseRate: 500, hourlyRate: 800 },
        { name: "Xbox Series X - 1", isActive: true, baseRate: 500, hourlyRate: 800 },
        { name: "PC Gaming - 1", isActive: true, baseRate: 400, hourlyRate: 600 },
        { name: "PC Gaming - 2", isActive: true, baseRate: 400, hourlyRate: 600 }
      ]);
      
      // Create games
      await db.insert(schema.games).values([
        { name: "FIFA 24", isActive: true },
        { name: "Call of Duty: Modern Warfare", isActive: true },
        { name: "GTA V", isActive: true },
        { name: "Fortnite", isActive: true },
        { name: "Minecraft", isActive: true }
      ]);
      
      // Create sample users
      await db.insert(schema.users).values([
        { 
          displayName: "John Doe", 
          gamingName: "JDGamer", 
          phoneNumber: "254700000000", 
          role: "customer",
          points: 750,
          referralCode: "JD123"
        },
        {
          displayName: "Staff Test",
          gamingName: "staff",
          phoneNumber: "254700000001",
          role: "staff",
          points: 0
        },
        {
          displayName: "Admin User",
          gamingName: "admin",
          phoneNumber: "254700000002",
          role: "admin",
          points: 0
        }
      ]);
      
      console.log("Mock data initialized successfully");
    } catch (error) {
      console.error("Error initializing mock data:", error);
    }
  }
}

export const storage = new StorageService();
