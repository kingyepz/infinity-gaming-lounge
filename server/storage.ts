
import { gameStations, games, transactions, users } from "@shared/schema";
import type { GameStation, InsertGameStation, Game, InsertGame, Transaction, InsertTransaction, User, InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

class StorageService {
  // Game Station Methods
  async getGameStations() {
    try {
      return await db.select().from(gameStations);
    } catch (error) {
      console.error("Error fetching game stations:", error);
      return [];
    }
  }

  async updateGameStation(id: number, data: any) {
    try {
      await db.update(gameStations)
        .set(data)
        .where(eq(gameStations.id, id));

      return await db.select()
        .from(gameStations)
        .where(eq(gameStations.id, id))
        .then(res => res[0]);
    } catch (error) {
      console.error("Error updating game station:", error);
      throw error;
    }
  }

  // Game Methods
  async getGames() {
    try {
      return await db.select().from(games);
    } catch (error) {
      console.error("Error fetching games:", error);
      return [];
    }
  }

  // Transaction Methods
  async createTransaction(data: InsertTransaction) {
    try {
      const result = await db.insert(transactions)
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
        .from(transactions)
        .where(eq(transactions.stationId, stationId));
    } catch (error) {
      console.error("Error fetching transactions by station:", error);
      return [];
    }
  }

  async getTransactionsByUser(userId: number) {
    try {
      return await db.select()
        .from(transactions)
        .where(eq(transactions.userId, userId));
    } catch (error) {
      console.error("Error fetching transactions by user:", error);
      return [];
    }
  }

  async updateTransactionStatus(id: number, status: string, mpesaRef?: string) {
    try {
      await db.update(transactions)
        .set({ 
          paymentStatus: status,
          mpesaRef: mpesaRef
        })
        .where(eq(transactions.id, id));

      return await db.select()
        .from(transactions)
        .where(eq(transactions.id, id))
        .then(res => res[0]);
    } catch (error) {
      console.error("Error updating transaction status:", error);
      throw error;
    }
  }

  // User Methods
  async createUser(data: InsertUser) {
    try {
      const result = await db.insert(users)
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
        .from(users)
        .where(eq(users.phoneNumber, phoneNumber))
        .then(res => res[0] || null);
    } catch (error) {
      console.error("Error fetching user by phone:", error);
      return null;
    }
  }

  async getUserById(id: number) {
    try {
      return await db.select()
        .from(users)
        .where(eq(users.id, id))
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

      await db.update(users)
        .set({ points: newPoints })
        .where(eq(users.id, userId));

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

      await db.update(users)
        .set({ points: newPoints })
        .where(eq(users.id, userId));

      return newPoints;
    } catch (error) {
      console.error("Error redeeming loyalty points:", error);
      throw error;
    }
  }

  // Report Methods
  async getRevenueByTimeFrame(timeFrame: 'daily' | 'weekly' | 'monthly') {
    try {
      const now = new Date();
      let startDate: Date;
      
      switch(timeFrame) {
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
  
  async getPopularGames() {
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
  
  async getStationUtilization() {
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
  
  async getCustomerActivity() {
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

  // Mock data initialization for testing
  async initializeMockData() {
    try {
      // Check if we already have data
      const stations = await this.getGameStations();
      if (stations.length > 0) return;

      // Create game stations
      await db.insert(gameStations).values([
        { name: "PlayStation 5 - 1", isActive: true, baseRate: 500, hourlyRate: 800 },
        { name: "PlayStation 5 - 2", isActive: true, baseRate: 500, hourlyRate: 800 },
        { name: "Xbox Series X - 1", isActive: true, baseRate: 500, hourlyRate: 800 },
        { name: "PC Gaming - 1", isActive: true, baseRate: 400, hourlyRate: 600 },
        { name: "PC Gaming - 2", isActive: true, baseRate: 400, hourlyRate: 600 }
      ]);

      // Create games
      await db.insert(games).values([
        { name: "FIFA 24", isActive: true },
        { name: "Call of Duty: Modern Warfare", isActive: true },
        { name: "GTA V", isActive: true },
        { name: "Fortnite", isActive: true },
        { name: "Minecraft", isActive: true }
      ]);

      // Create sample users
      await db.insert(users).values([
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
