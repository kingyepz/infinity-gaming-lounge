import { gameStations, games, transactions, users } from "@shared/schema";
import type { GameStation, InsertGameStation, Game, InsertGame, Transaction, InsertTransaction, User, InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export class StorageService {
  // Game Station Methods
  async getGameStations(): Promise<GameStation[]> {
    try {
      return await db.select().from(gameStations);
    } catch (error) {
      console.error("Error fetching game stations:", error);
      return [];
    }
  }

  async updateGameStation(id: number, data: Partial<GameStation>): Promise<GameStation | null> {
    try {
      const [updated] = await db.update(gameStations)
        .set(data)
        .where(eq(gameStations.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating game station:", error);
      throw error;
    }
  }

  async getGameStationById(id: number): Promise<GameStation | null> {
    try {
      const results = await db.select()
        .from(gameStations)
        .where(eq(gameStations.id, id))
        .limit(1);

      return results[0] || null;
    } catch (error) {
      console.error("Error fetching game station by id:", error);
      return null;
    }
  }

  // Game Methods
  async getGames(): Promise<Game[]> {
    try {
      return await db.select().from(games);
    } catch (error) {
      console.error("Error fetching games:", error);
      return [];
    }
  }

  async createGame(gameData: InsertGame): Promise<Game> {
    try {
      const result = await db.insert(games).values(gameData).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating game:", error);
      throw error;
    }
  }


  // Transaction Methods
  async getTransactions(): Promise<Transaction[]> {
    try {
      return await db.select()
        .from(transactions)
        .orderBy(desc(transactions.createdAt));
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return [];
    }
  }

  async createTransaction(data: InsertTransaction): Promise<Transaction> {
    try {
      const [transaction] = await db.insert(transactions)
        .values({
          ...data,
          paymentStatus: "pending",
          createdAt: new Date()
        })
        .returning();
      return transaction;
    } catch (error) {
      console.error("Error creating transaction:", error);
      throw error;
    }
  }

  async getTransactionsByStation(stationId: number): Promise<Transaction[]> {
    try {
      return await db.select()
        .from(transactions)
        .where(eq(transactions.stationId, stationId))
        .orderBy(desc(transactions.createdAt));
    } catch (error) {
      console.error("Error fetching transactions by station:", error);
      return [];
    }
  }

  async getTransactionsByUser(userId: number): Promise<Transaction[]> {
    try {
      return await db.select()
        .from(transactions)
        .where(eq(transactions.userId, userId));
    } catch (error) {
      console.error("Error fetching transactions by user:", error);
      return [];
    }
  }

  async updateTransactionStatus(id: number, status: string, mpesaRef?: string): Promise<Transaction | null> {
    try {
      const updateData: any = { paymentStatus: status };
      if (mpesaRef) {
        updateData.mpesaRef = mpesaRef;
      }

      const [result] = await db.update(transactions)
        .set(updateData)
        .where(eq(transactions.id, id))
        .returning();

      // If payment completed, update corresponding user's loyalty points (10% of transaction)
      if (status === "completed" && result) {
        const transaction = await db.select()
          .from(transactions)
          .where(eq(transactions.id, id))
          .limit(1)
          .then(res => res[0]);

        if (transaction && transaction.userId) {
          try {
            // Award 10% of transaction amount as loyalty points
            const pointsToAward = Math.round(transaction.amount * 0.1);
            await this.awardLoyaltyPoints(transaction.userId, pointsToAward);
          } catch (error) {
            console.error("Error awarding loyalty points after payment:", error);
          }
        }
      }

      return result;
    } catch (error) {
      console.error("Error updating transaction status:", error);
      throw error;
    }
  }

  // User Methods
  async getCustomers(): Promise<User[]> {
    try {
      return await db.select()
        .from(users)
        .where(eq(users.role, "customer"))
        .orderBy(desc(users.createdAt));
    } catch (error) {
      console.error("Error fetching customers:", error);
      return [];
    }
  }

  async createUser(data: InsertUser): Promise<User> {
    try {
      const [user] = await db.insert(users)
        .values({
          ...data,
          points: 0,
          createdAt: new Date()
        })
        .returning();
      return user;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async getUserByPhone(phoneNumber: string): Promise<User | null> {
    try {
      const [user] = await db.select()
        .from(users)
        .where(eq(users.phoneNumber, phoneNumber));
      return user || null;
    } catch (error) {
      console.error("Error fetching user by phone:", error);
      return null;
    }
  }

  async getUserById(id: number): Promise<User | null> {
    try {
      const result = await db.select()
        .from(users)
        .where(eq(users.id, id));
      return result[0] || null;
    } catch (error) {
      console.error("Error fetching user by id:", error);
      return null;
    }
  }

  async awardLoyaltyPoints(userId: number, points: number): Promise<number | undefined> {
    try {
      const user = await this.getUserById(userId);
      if (!user) throw new Error("User not found");

      const newPoints = (user.points || 0) + points;

      const [result] = await db.update(users)
        .set({ points: newPoints })
        .where(eq(users.id, userId))
        .returning();

      return result.points;
    } catch (error) {
      console.error("Error awarding loyalty points:", error);
      throw error;
    }
  }

  async redeemLoyaltyPoints(userId: number, points: number): Promise<number> {
    try {
      const user = await this.getUserById(userId);
      if (!user) throw new Error("User not found");
      if ((user.points || 0) < points) throw new Error("Insufficient points");

      const newPoints = (user.points || 0) - points;

      await db.update(users)
        .set({ points: newPoints })
        .where(eq(users.id, userId));

      return newPoints;
    } catch (error) {
      console.error("Error redeeming loyalty points:", error);
      throw error;
    }
  }

  async getRevenueByTimeFrame(timeFrame: 'daily' | 'weekly' | 'monthly'): Promise<{ totalRevenue: number; completedSessions: number; averageRevenue: number; }> {
    try {
      const now = new Date();
      let startDate: Date;

      switch (timeFrame) {
        case 'daily':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'weekly':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'monthly':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
      }

      const allTransactions = await db.select().from(transactions);
      const filteredTransactions = allTransactions.filter(tx =>
        new Date(tx.createdAt) >= startDate
      );

      return {
        totalRevenue: filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0),
        completedSessions: filteredTransactions.length,
        averageRevenue: filteredTransactions.length > 0
          ? filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0) / filteredTransactions.length
          : 0
      };
    } catch (error) {
      console.error(`Error getting ${timeFrame} revenue:`, error);
      return { totalRevenue: 0, completedSessions: 0, averageRevenue: 0 };
    }
  }

  async getPopularGames(): Promise<{ name: string; sessions: number; revenue: number; }[]> {
    try {
      const allTransactions = await db.select().from(transactions);
      const gameStats = {};

      allTransactions.forEach(tx => {
        if (tx.gameName) {
          if (!gameStats[tx.gameName]) {
            gameStats[tx.gameName] = { count: 0, revenue: 0 };
          }
          gameStats[tx.gameName].count += 1;
          gameStats[tx.gameName].revenue += tx.amount;
        }
      });

      return Object.entries(gameStats)
        .map(([name, stats]: [string, any]) => ({
          name,
          sessions: stats.count,
          revenue: stats.revenue
        }))
        .sort((a, b) => b.revenue - a.revenue);
    } catch (error) {
      console.error("Error getting popular games:", error);
      return [];
    }
  }

  async getStationUtilization(): Promise<{ id: number; name: string; totalHours: number; utilizationRate: number; revenue: number; }[]> {
    try {
      const stations = await this.getGameStations();
      const allTransactions = await Promise.all(
        stations.map(station => this.getTransactionsByStation(station.id))
      );

      return stations.map((station, index) => {
        const stationTransactions = allTransactions[index];
        const totalHours = stationTransactions.reduce((sum, tx) => {
          if (tx.sessionType === 'hourly' && tx.duration) {
            return sum + (tx.duration / 60); // convert minutes to hours
          }
          return sum + 0.5; // assume half hour for per_game
        }, 0);

        // Assuming 12 operational hours per day
        const utilizationRate = Math.min(100, (totalHours / 12) * 100);

        return {
          id: station.id,
          name: station.name,
          totalHours,
          utilizationRate,
          revenue: stationTransactions.reduce((sum, tx) => sum + tx.amount, 0)
        };
      });
    } catch (error) {
      console.error("Error getting station utilization:", error);
      return [];
    }
  }

  async getCustomerActivity(): Promise<{ newCustomers: number; returningCustomers: number; returnRate: number; avgSessionDuration: number; }> {
    try {
      const allTransactions = await db.select().from(transactions);
      const allUsers = await db.select().from(users);

      const now = new Date();
      const yesterday = new Date(now.setDate(now.getDate() - 1));
      const lastWeek = new Date(now.setDate(now.getDate() - 7));

      const newCustomers = allUsers.filter(user =>
        new Date(user.createdAt) >= yesterday
      ).length;

      // Calculate returning customers
      const customerVisits = {};
      allTransactions.forEach(tx => {
        if (tx.userId) {
          if (!customerVisits[tx.userId]) {
            customerVisits[tx.userId] = [];
          }
          customerVisits[tx.userId].push(new Date(tx.createdAt));
        }
      });

      const returningCustomers = Object.values(customerVisits).filter((visits: any) => {
        if (visits.length < 2) return false;
        visits.sort((a: Date, b: Date) => a.getTime() - b.getTime());
        return visits[visits.length - 1] >= lastWeek && visits[visits.length - 2] >= lastWeek;
      }).length;

      const returnRate = allUsers.length > 0
        ? (returningCustomers / allUsers.length) * 100
        : 0;

      // Calculate average session duration
      const hourlyTransactions = allTransactions.filter(tx =>
        tx.sessionType === 'hourly' && tx.duration
      );

      const avgSessionDuration = hourlyTransactions.length > 0
        ? hourlyTransactions.reduce((sum, tx) => sum + (tx.duration || 0), 0) / hourlyTransactions.length / 60
        : 0; // in hours

      return {
        newCustomers,
        returningCustomers,
        returnRate,
        avgSessionDuration
      };
    } catch (error) {
      console.error("Error getting customer activity:", error);
      return { newCustomers: 0, returningCustomers: 0, returnRate: 0, avgSessionDuration: 0 };
    }
  }

  async initializeMockData() {
    try {
      console.log("Checking for existing data...");
      const existingStations = await this.getGameStations();
      if (existingStations.length > 0) {
        console.log("Data already exists, skipping initialization");
        return;
      }

      console.log("Initializing data...");

      // Create game stations
      await db.insert(gameStations).values([
        { name: "Station 1", isActive: true, baseRate: 500, hourlyRate: 800 },
        { name: "Station 2", isActive: true, baseRate: 500, hourlyRate: 800 },
        { name: "Station 3", isActive: true, baseRate: 500, hourlyRate: 800 },
        { name: "Station 4", isActive: true, baseRate: 500, hourlyRate: 800 },
        { name: "Station 5", isActive: true, baseRate: 500, hourlyRate: 800 },
        { name: "Station 6", isActive: true, baseRate: 500, hourlyRate: 800 },
        { name: "Station 7", isActive: true, baseRate: 500, hourlyRate: 800 },
        { name: "Station 8", isActive: true, baseRate: 500, hourlyRate: 800 },
        { name: "Station 9", isActive: true, baseRate: 500, hourlyRate: 800 },
        { name: "Station 10", isActive: true, baseRate: 500, hourlyRate: 800 }
      ]);

      // Create games
      await db.insert(games).values([
        { name: "FIFA 24", isActive: true },
        { name: "Call of Duty: Modern Warfare", isActive: true },
        { name: "GTA V", isActive: true },
        { name: "Fortnite", isActive: true },
        { name: "Minecraft", isActive: true },
        { name: "NBA 2K24", isActive: true },
        { name: "Mortal Kombat 1", isActive: true },
        { name: "EA FC 24", isActive: true },
        { name: "Tekken 8", isActive: true },
        { name: "God of War Ragnarök", isActive: true }
      ]);

      // Create test users
      await db.insert(users).values([
        {
          displayName: "John Doe",
          gamingName: "JDGamer",
          phoneNumber: "254700000000",
          role: "customer",
          points: 750,
          level: "pro"
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
      throw error;
    }
  }
}

export const storage = new StorageService();