import { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTransactionSchema } from "@shared/schema";
import { z } from "zod";
import { log } from "./vite";
import { db } from "./db";
import { games, transactions, gameStations, users, payments, rewards, events, bookings, friends } from "../shared/schema";
import { desc, eq, sql, inArray } from "drizzle-orm";
import { mpesaService } from "./mpesa";
import { airtelMoneyService } from "./airtel";
import { PaymentDebugger } from "./paymentDebugger";
import mpesaRoutes from "./mpesaRoutes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const server = createServer(app);

  // Wrap route handlers with error catching
  const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };

  // User related routes
  app.get("/api/users/customers", asyncHandler(async (_req, res) => {
    try {
      const customers = await db.select()
        .from(users)
        .where(eq(users.role, "customer"))
        .orderBy(desc(users.createdAt));
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      throw error;
    }
  }));

  // Gaming session related routes
  app.get("/api/sessions/active", asyncHandler(async (_req, res) => {
    try {
      const activeStations = await db.select()
        .from(gameStations)
        .where(eq(gameStations.isActive, true));
      res.json(activeStations);
    } catch (error) {
      console.error("Error fetching active sessions:", error);
      throw error;
    }
  }));

  app.post("/api/sessions/start", asyncHandler(async (req, res) => {
    try {
      const { stationId, customerId, customerName, gameId, sessionType, baseRate, hourlyRate } = req.body;
      
      console.log("Starting session with data:", req.body);

      // Find the game to get its name
      const game = await storage.getGameById(Number(gameId));
      if (!game) {
        throw new Error("Game not found");
      }

      const station = await storage.updateGameStation(stationId, {
        currentCustomer: customerName, // Use customer name (string) for the gameStations table
        currentGame: game.name, // Use game name (string) instead of ID
        sessionType,
        sessionStartTime: new Date(),
        baseRate: baseRate || 40,
        hourlyRate: hourlyRate || 200
      });

      if (!station) {
        throw new Error("Failed to start session");
      }

      res.json(station);
    } catch (error) {
      console.error("Error starting session:", error);
      throw error;
    }
  }));

  app.post("/api/sessions/end", asyncHandler(async (req, res) => {
    try {
      const { stationId } = req.body;

      const station = await storage.updateGameStation(stationId, {
        currentCustomer: null,
        currentGame: null,
        sessionType: null,
        sessionStartTime: null
      });

      if (!station) {
        throw new Error("Failed to end session");
      }

      res.json(station);
    } catch (error) {
      console.error("Error ending session:", error);
      throw error;
    }
  }));

  app.get("/api/stations", asyncHandler(async (_req, res) => {
    const stations = await db.select().from(gameStations);
    res.json(stations);
  }));

  app.patch("/api/stations/:id", asyncHandler(async (req, res) => {
    try {
      const stationData = req.body;
      const updatedStation = await storage.updateGameStation(Number(req.params.id), stationData);
      res.json(updatedStation);
    } catch (error) {
      //This will be caught by the global error handler
      throw error;
    }
  }));

  app.get("/api/reports/current", asyncHandler(async (_req, res) => {
    try {
      const stations = await db.select().from(gameStations);
      const activeStations = stations.filter(station => station.currentCustomer);

      const report = activeStations.map(station => {
        const duration = station.sessionStartTime
          ? Math.ceil((Date.now() - new Date(station.sessionStartTime).getTime()) / (1000 * 60)) // minutes
          : 0;

        const cost = station.sessionType === "per_game"
          ? station.baseRate
          : Math.ceil(duration / 60) * station.hourlyRate;

        return {
          stationName: station.name,
          customerName: station.currentCustomer,
          gameName: station.currentGame,
          duration: station.sessionType === "per_game"
            ? "1 game"
            : `${Math.ceil(duration / 60)} hour(s)`,
          cost
        };
      });

      res.json(report);
    } catch (error) {
      throw error;
    }
  }));

  app.get("/api/reports/hourly", asyncHandler(async (_req, res) => {
    try {
      const stations = await db.select().from(gameStations);
      const transactionsList = await db.select().from(transactions);

      const now = new Date();
      const hourAgo = new Date(now.getTime() - (60 * 60 * 1000));

      const hourlyTransactions = transactionsList.filter(tx =>
        new Date(tx.createdAt) >= hourAgo &&
        tx.paymentStatus === "completed"
      );

      // Get current active sessions data
      const activeStations = stations.filter(s => s.currentCustomer && s.sessionStartTime);
      const activeSessions = activeStations.map(station => {
        const duration = station.sessionStartTime
          ? Math.ceil((Date.now() - new Date(station.sessionStartTime).getTime()) / (1000 * 60))
          : 0;

        const estimatedAmount = station.sessionType === "per_game"
          ? station.baseRate
          : Math.ceil(duration / 60) * station.hourlyRate;

        return {
          stationName: station.name,
          customerName: station.currentCustomer,
          duration: station.sessionType === "per_game" ? "1 game" : `${duration} minutes`,
          amount: estimatedAmount
        };
      });

      const report = {
        totalRevenue: hourlyTransactions.reduce((sum, tx) => sum + tx.amount, 0),
        activeSessions: activeStations.length,
        completedSessions: hourlyTransactions.length,
        activeSessionsData: activeSessions,
        completedSessionsData: hourlyTransactions.map(tx => ({
          stationName: stations.find(s => s.id === tx.stationId)?.name,
          customerName: tx.customerName,
          gameName: tx.gameName,
          duration: tx.sessionType === "per_game" ? "1 game" : `${tx.duration} minutes`,
          amount: tx.amount
        }))
      };

      res.json(report);
    } catch (error) {
      throw error;
    }
  }));

  app.get("/api/reports/daily", asyncHandler(async (_req, res) => {
    try {
      const stations = await db.select().from(gameStations);
      const transactions = await db.select().from(transactions);

      const now = new Date();
      const dayStart = new Date(now.setHours(0, 0, 0, 0));

      const dailyTransactions = transactions.flat().filter(tx =>
        new Date(tx.createdAt) >= dayStart
      );

      const report = {
        totalRevenue: dailyTransactions.reduce((sum, tx) => sum + tx.amount, 0),
        activeSessions: stations.filter(s => s.currentCustomer).length,
        completedSessions: dailyTransactions.length,
        sessions: dailyTransactions.map(tx => ({
          stationName: stations.find(s => s.id === tx.stationId)?.name || "Unknown",
          customerName: tx.customerName || "Unknown",
          duration: tx.sessionType === "per_game" ? "1 game" : `${tx.duration || 0} minutes`
        }))
      };

      res.json(report);
    } catch (error) {
      throw error;
    }
  }));

  app.get("/api/reports/revenue/:timeFrame", asyncHandler(async (req, res) => {
    try {
      const timeFrame = req.params.timeFrame as 'daily' | 'weekly' | 'monthly';
      if (!['daily', 'weekly', 'monthly'].includes(timeFrame)) {
        return res.status(400).json({ error: "Invalid time frame. Use daily, weekly, or monthly." });
      }

      // Implement database query for revenue data based on timeframe
      const revenueData = await storage.getRevenueByTimeFrame(timeFrame);
      res.json(revenueData);
    } catch (error) {
      throw error;
    }
  }));

  app.get("/api/reports/popular-games", asyncHandler(async (_req, res) => {
    try {
      const popularGames = await db.select().from(games).orderBy(games.popularity, desc());
      res.json(popularGames);
    } catch (error) {
      throw error;
    }
  }));

  app.get("/api/reports/station-utilization", asyncHandler(async (_req, res) => {
    try {
      // Implement database query for station utilization data
      const stationUtilization = await storage.getStationUtilization();
      res.json(stationUtilization);
    } catch (error) {
      throw error;
    }
  }));

  app.get("/api/reports/customer-activity", asyncHandler(async (_req, res) => {
    try {
      // Implement database query for customer activity data
      const customerActivity = await storage.getCustomerActivity();
      res.json(customerActivity);
    } catch (error) {
      throw error;
    }
  }));

  app.get("/api/reports/payment-methods", asyncHandler(async (_req, res) => {
    try {
      // Implement database query for payment methods data
      const paymentMethods = await storage.getPaymentMethods();
      res.json(paymentMethods);
    } catch (error) {
      throw error;
    }
  }));

  app.get("/api/reports/hourly-distribution", asyncHandler(async (_req, res) => {
    try {
      // Implement database query for hourly distribution data
      const hourlyDistribution = await storage.getHourlyDistribution();
      res.json(hourlyDistribution);
    } catch (error) {
      throw error;
    }
  }));

  app.get("/api/games", asyncHandler(async (_req, res) => {
    try {
      const gamesList = await db.select().from(games).orderBy(desc(games.name));
      res.json(gamesList);
    } catch (error) {
      console.error("Error fetching games:", error);
      throw error;
    }
  }));
  
  // Add route for creating a new game
  app.post("/api/games", asyncHandler(async (req, res) => {
    try {
      const gameData = req.body;
      const game = await storage.createGame(gameData);
      res.status(201).json(game);
    } catch (error) {
      console.error("Error creating game:", error);
      throw error;
    }
  }));

  // Add route for updating a game
  app.patch("/api/games/:id", asyncHandler(async (req, res) => {
    try {
      const gameId = Number(req.params.id);
      if (isNaN(gameId)) {
        return res.status(400).json({ message: "Invalid game ID" });
      }

      const gameData = req.body;
      const game = await storage.updateGame(gameId, gameData);
      
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      res.json(game);
    } catch (error) {
      console.error("Error updating game:", error);
      throw error;
    }
  }));

  // Add route for deleting a game
  app.delete("/api/games/:id", asyncHandler(async (req, res) => {
    try {
      const gameId = Number(req.params.id);
      if (isNaN(gameId)) {
        return res.status(400).json({ message: "Invalid game ID" });
      }

      const success = await storage.deleteGame(gameId);
      
      if (!success) {
        return res.status(404).json({ message: "Game not found or could not be deleted" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting game:", error);
      throw error;
    }
  }));

  app.post("/api/transactions", asyncHandler(async (req, res) => {
    try {
      // Ensure amount is a string and payment status is set to "pending" by default
      const rawData = req.body;
      console.log("Received transaction data:", rawData);

      // Convert amount to string if it's a number
      if (typeof rawData.amount === 'number') {
        rawData.amount = String(rawData.amount);
      }

      // Get actual database columns to ensure we only use valid ones
      const actualColumns = Object.keys(transactions);
      console.log("Actual database columns:", actualColumns);

      // Create a clean transaction object with proper typing to match database schema
      const transactionData = {
        stationId: Number(rawData.stationId),
        customerName: String(rawData.customerName || "Walk-in Customer"), 
        sessionType: rawData.sessionType === "hourly" ? "hourly" : "per_game" as const,
        amount: String(rawData.amount || "0"),
        paymentStatus: "pending" as const,
        gameName: rawData.gameName || null,
        duration: (rawData.duration !== undefined && rawData.duration !== null) ? 
          Number(rawData.duration) : null
      };

      console.log("Final transaction data:", transactionData);

      try {
        // Execute insert - ensure we're wrapping the transaction data in an array
        const [result] = await db.insert(transactions).values([transactionData]).returning();
        
        if (!result) {
          console.error("Transaction creation failed: No result returned");
          return res.status(500).json({ 
            success: false, 
            error: "No transaction record created" 
          });
        }
        
        // Return a standardized response with success flag and the transaction data
        return res.json({ 
          success: true, 
          transaction: result,
          transactionId: result.id
        });
      } catch (dbError) {
        console.error("Database error:", dbError);
        return res.status(500).json({ 
          success: false, 
          error: dbError.message || "Database error creating transaction" 
        });
      }
    } catch (error) {
      console.error("Transaction creation error:", error);
      return res.status(500).json({ 
        success: false, 
        error: error.message || "Failed to create transaction" 
      });
    }
  }));

  // Add a GET endpoint to retrieve all transactions
  app.get("/api/transactions", asyncHandler(async (_req, res) => {
    try {
      const allTransactions = await db.select().from(transactions).orderBy(desc(transactions.createdAt));
      res.json(allTransactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      throw error;
    }
  }));

  // Get a specific transaction by ID - used for receipt generation
  app.get("/api/transactions/:id", asyncHandler(async (req, res) => {
    try {
      const transactionId = Number(req.params.id);
      if (isNaN(transactionId)) {
        return res.status(400).json({ 
          success: false,
          error: "Invalid transaction ID" 
        });
      }

      const transaction = await db.select()
        .from(transactions)
        .where(eq(transactions.id, transactionId))
        .limit(1);

      if (!transaction || transaction.length === 0) {
        return res.status(404).json({ 
          success: false,
          error: "Transaction not found" 
        });
      }

      return res.json({ 
        success: true,
        transaction: transaction[0] 
      });
    } catch (error) {
      console.error("Error fetching transaction:", error);
      return res.status(500).json({ 
        success: false,
        error: "Failed to fetch transaction details" 
      });
    }
  }));

  // Get payment details for a specific transaction - used for receipt generation
  app.get("/api/payments/transaction/:transactionId", asyncHandler(async (req, res) => {
    try {
      const transactionId = Number(req.params.transactionId);
      if (isNaN(transactionId)) {
        return res.status(400).json({ 
          success: false,
          error: "Invalid transaction ID" 
        });
      }

      const payment = await db.select()
        .from(payments)
        .where(eq(payments.transactionId, transactionId))
        .limit(1);

      if (!payment || payment.length === 0) {
        return res.status(404).json({ 
          success: false,
          error: "Payment not found for this transaction" 
        });
      }

      return res.json({
        success: true,
        payment: payment[0]
      });
    } catch (error) {
      console.error("Error fetching payment details:", error);
      return res.status(500).json({ 
        success: false,
        error: "Failed to fetch payment details" 
      });
    }
  }));

  app.get("/api/transactions/station/:stationId", asyncHandler(async (req, res) => {
    try {
      const stationId = Number(req.params.stationId);
      if (isNaN(stationId)) {
        return res.status(400).json({ message: "Invalid station ID" });
      }

      const stationTransactions = await db.select()
        .from(transactions)
        .where(eq(transactions.stationId, stationId))
        .orderBy(desc(transactions.createdAt));

      res.json(stationTransactions);
    } catch (error) {
      console.error("Error fetching transactions by station:", error);
      throw error;
    }
  }));

  app.get("/api/transactions/user/current", asyncHandler(async (req, res) => {
    try {
      const userId = req.headers['user-id'];
      if (!userId) {
        return res.json([
          {
            id: 1,
            stationId: 1,
            customerName: "John Doe",
            gameName: "FIFA 24",
            sessionType: "per_game",
            amount: 500,
            paymentStatus: "completed",
            mpesaRef: "MP123456",
            duration: null,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // yesterday
          },
          {
            id: 2,
            stationId: 2,
            customerName: "John Doe",
            gameName: "Call of Duty",
            sessionType: "hourly",
            amount: 1000,
            paymentStatus: "completed",
            mpesaRef: "MP123457",
            duration: 60,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
          }
        ]);
      }

      const transactions = await db.select().from(transactions).where(transactions.userId.equals(Number(userId)));
      res.json(transactions);
    } catch (error) {
      throw error;
    }
  }));

  app.get("/api/leaderboard", asyncHandler(async (_req, res) => {
    // Implement database query for leaderboard data
    res.json([
      { rank: 1, name: "EliteGamer", points: 2500 },
      { rank: 2, name: "VictoryRoad", points: 2300 },
      { rank: 3, name: "GameMaster", points: 1200 },
      { rank: 4, name: "ProPlayer22", points: 750 }
    ]);
  }));

  app.get("/api/events", asyncHandler(async (_req, res) => {
    try {
      const eventsList = await db.select()
        .from(events)
        .orderBy(events.date);
      
      // If no events found, return empty array instead of mock data
      res.json(eventsList.length > 0 ? eventsList : []);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  }));

  app.get("/api/rewards", asyncHandler(async (_req, res) => {
    try {
      // Fetch available rewards from the database
      const rewardsList = await db.select()
        .from(rewards)
        .where(eq(rewards.available, true))
        .orderBy(rewards.points);

      res.json(rewardsList);
    } catch (error) {
      console.error("Error fetching rewards:", error);
      res.status(500).json({ error: "Failed to fetch rewards" });
    }
  }));

  // Add reward redemption endpoint
  app.post("/api/rewards/redeem", asyncHandler(async (req, res) => {
    try {
      const { userId, rewardId } = req.body;

      if (!userId || !rewardId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Get the reward
      const [reward] = await db.select()
        .from(rewards)
        .where(eq(rewards.id, rewardId));

      if (!reward) {
        return res.status(404).json({ error: "Reward not found" });
      }

      if (!reward.available) {
        return res.status(400).json({ error: "Reward is not available" });
      }

      // Check if user has enough points
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, userId));

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if ((user.points || 0) < reward.points) {
        return res.status(400).json({ 
          error: "Insufficient points", 
          required: reward.points,
          available: user.points || 0
        });
      }

      // Redeem points
      const newPointsBalance = await storage.redeemLoyaltyPoints(userId, reward.points);

      res.json({
        success: true,
        message: `Successfully redeemed ${reward.title}`,
        newPointsBalance,
        reward
      });
    } catch (error: any) {
      console.error("Error redeeming reward:", error);
      res.status(500).json({ 
        error: error.message || "Failed to redeem reward" 
      });
    }
  }));

  app.get("/api/users/friends", asyncHandler(async (req, res) => {
    try {
      const userId = req.headers['user-id'];
      
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      // Get accepted friend connections for this user
      const userFriends = await db.select({
        friendId: friends.friendId,
      })
      .from(friends)
      .where(eq(friends.userId, Number(userId)))
      .where(eq(friends.status, "accepted"));
      
      // Get friend details for each friend
      const friendIds = userFriends.map(f => f.friendId);
      
      if (friendIds.length === 0) {
        return res.json([]);
      }
      
      // Get friend details including points
      const friendsList = await db.select({
        id: users.id,
        name: users.displayName,
        points: users.points,
        // Default to offline for simplicity, in a real app would check last activity
        status: sql`CASE WHEN random() > 0.5 THEN 'online' ELSE 'offline' END`.as('status')
      })
      .from(users)
      .where(inArray(users.id, friendIds));
      
      res.json(friendsList);
    } catch (error) {
      console.error("Error fetching friends:", error);
      res.status(500).json({ error: "Failed to fetch friends" });
    }
  }));

  app.get("/api/users/current", asyncHandler(async (req, res) => {
    try {
      const userId = req.headers['user-id'];
      if (!userId) {
        // For demo purposes, return a default user instead of requiring authentication
        return res.json({
          id: 1,
          displayName: "John Doe",
          gamingName: "JDGamer",
          phoneNumber: "254700000000",
          role: "customer",
          points: 750,
          referralCode: "JDGAM123",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString() // 30 days ago
        });
      }

      const user = await db.select()
        .from(users)
        .where(eq(users.id, Number(userId)))
        .limit(1);
      
      if (!user || user.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(user[0]);
    } catch (error) {
      console.error("Error fetching current user:", error);
      throw error;
    }
  }));

  app.post("/api/users/register", asyncHandler(async (req, res) => {
    try {
      const userData = z.object({
        displayName: z.string(),
        gamingName: z.string(),
        phoneNumber: z.string(),
        referredBy: z.string().optional()
      }).parse(req.body);

      const existingUser = await db.select().from(users).where(users.phoneNumber.equals(userData.phoneNumber)).limit(1);
      if (existingUser) {
        return res.status(400).json({ error: "User with this phone number already exists" });
      }

      const user = await db.insert(users).values({
        displayName: userData.displayName,
        gamingName: userData.gamingName,
        phoneNumber: userData.phoneNumber,
        role: "customer"
      }).returning();

      if (userData.referredBy) {
        try {
          const referrer = await db.select().from(users).where(users.phoneNumber.equals(userData.referredBy)).limit(1);
          if (referrer) {
            await storage.awardLoyaltyPoints(referrer.id, 100); // Award 100 points for referral
          }
        } catch (error) {
          console.error("Error processing referral:", error);
        }
      }

      res.json(user);
    } catch (error) {
      throw error;
    }
  }));

  app.post("/api/users/points/award", asyncHandler(async (req, res) => {
    try {
      const data = z.object({
        userId: z.number(),
        points: z.number().positive()
      }).parse(req.body);

      const newPoints = await storage.awardLoyaltyPoints(data.userId, data.points);
      res.json({ success: true, newPoints });
    } catch (error) {
      throw error;
    }
  }));

  app.post("/api/users/points/redeem", asyncHandler(async (req, res) => {
    try {
      const data = z.object({
        userId: z.number(),
        points: z.number().positive()
      }).parse(req.body);

      const newPoints = await storage.redeemLoyaltyPoints(data.userId, data.points);
      res.json({ success: true, newPoints });
    } catch (error) {
      throw error;
    }
  }));

  app.post("/api/payments/mpesa", asyncHandler(async (req, res) => {
    try {
      const { PaymentDebugger } = await import('./paymentDebugger');

      PaymentDebugger.log('mpesa', 'request', req.body);
      const paymentData = mpesaPaymentSchema.parse(req.body);
      PaymentDebugger.log('mpesa', 'validated_data', paymentData);

      // Initiate STK Push
      const response = await mpesaService.initiateSTKPush({
        phoneNumber: paymentData.phoneNumber,
        amount: paymentData.amount,
        accountReference: `TXN-${paymentData.transactionId}`,
        transactionDesc: "Payment for gaming services"
      });

      PaymentDebugger.log('mpesa', 'stk_response', response);

      try {
        // Simple update with only the essential fields we know exist
        const updateData = {
          paymentStatus: "pending",
          mpesaRef: response.MerchantRequestID
        };

        PaymentDebugger.log('mpesa', 'update_data', updateData);
        await db.update(transactions)
          .set(updateData)
          .where(eq(transactions.id, paymentData.transactionId));

        PaymentDebugger.log('mpesa', 'transaction_updated', { transactionId: paymentData.transactionId });
      } catch (dbError) {
        PaymentDebugger.logError('mpesa', 'transaction_update', dbError);

        // If the update fails, try with just payment status as a fallback
        try {
          await db.update(transactions)
            .set({ 
              paymentStatus: "pending"
            })
            .where(eq(transactions.id, paymentData.transactionId));

          PaymentDebugger.log('mpesa', 'transaction_updated_fallback', { transactionId: paymentData.transactionId });
        } catch (fallbackError) {
          PaymentDebugger.logError('mpesa', 'transaction_update_fallback', fallbackError);
          // Continue anyway since we've already initiated the M-Pesa payment
        }
      }

      // Create a payment record in the payments table
      try {
        // Create a clean payment record with only the fields defined in the schema
        const paymentRecord: any = {
          transactionId: paymentData.transactionId,
          amount: String(paymentData.amount),
          paymentMethod: "mpesa",
          status: "pending",
          reference: response.MerchantRequestID,
          phoneNumber: paymentData.phoneNumber,
          createdAt: new Date()
        };

        PaymentDebugger.log('mpesa', 'payment_record', paymentRecord);
        const [payment] = await db.insert(payments).values([paymentRecord]).returning();
        PaymentDebugger.log('mpesa', 'payment_record_created', { 
          reference: response.MerchantRequestID,
          paymentId: payment?.id
        });
      } catch (paymentError) {
        PaymentDebugger.logError('mpesa', 'payment_record_creation', paymentError);
        // This is non-critical, so we won't throw the error
      }

      res.json({
        success: true,
        message: "M-Pesa payment initiated. Please check your phone to complete payment.",
        checkoutRequestId: response.CheckoutRequestID,
        merchantRequestId: response.MerchantRequestID
      });
    } catch (error: any) {
      const { PaymentDebugger } = await import('./paymentDebugger');
      PaymentDebugger.logError('mpesa', 'payment_initiation', error);

      res.status(500).json({
        success: false,
        error: error.message || "Failed to initiate M-Pesa payment"
      });
    }
  }));

  // Add M-Pesa verification endpoint
  // Add Airtel Money verification endpoint
app.get("/api/payments/airtel/status/:referenceId", asyncHandler(async (req, res) => {
  try {
    const { referenceId } = req.params;

    // Check transaction status
    const statusResponse = await airtelMoneyService.checkTransactionStatus(referenceId);

    // If successful, update transaction status
    if (statusResponse.status === "COMPLETED") {
      try {
        // Update transaction using payments table reference
        const payment = await db.select()
          .from(payments)
          .where(eq(payments.reference, referenceId))
          .limit(1);

        if (payment && payment[0]) {
          await db.update(transactions)
            .set({ paymentStatus: "completed" })
            .where(eq(transactions.id, payment[0].transactionId));

          // Also update payment status
          await db.update(payments)
            .set({ status: "completed" })
            .where(eq(payments.reference, referenceId));
        }
      } catch (dbError) {
        console.error("Error updating transaction status for Airtel payment:", dbError);
        // Continue anyway since we want to return the status to the client
      }

      return res.json({
        success: true,
        status: "COMPLETED",
        message: "Payment completed successfully"
      });
    }

    // Return appropriate status
    return res.json({
      success: true,
      status: statusResponse.status,
      message: statusResponse.message
    });
  } catch (error: any) {
    console.error("Airtel Money status check error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to check payment status"
    });
  }
}));

app.get("/api/payments/mpesa/status/:checkoutRequestId", asyncHandler(async (req, res) => {
    try {
      const { checkoutRequestId } = req.params;

      // Check transaction status
      const statusResponse = await mpesaService.checkTransactionStatus(checkoutRequestId);

      // If successful, update transaction status
      if (statusResponse.ResultCode === "0") {
        const transaction = await db.select()
          .from(transactions)
          .where(eq(transactions.mpesaRef, statusResponse.MerchantRequestID))
          .limit(1);

        if (transaction) {
          await db.update(transactions)
            .set({ paymentStatus: "completed" })
            .where(eq(transactions.mpesaRef, statusResponse.MerchantRequestID));
        }

        return res.json({
          success: true,
          status: "COMPLETED",
          message: "Payment completed successfully"
        });
      }

      // Return appropriate status
      return res.json({
        success: true,
        status: statusResponse.ResultCode === "0" ? "COMPLETED" : "PENDING",
        message: statusResponse.ResultDesc
      });
    } catch (error: any) {
      console.error("M-Pesa status check error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to check payment status"
      });
    }
  }));

  // Add M-Pesa callback endpoint
  app.post("/api/mpesa/callback", asyncHandler(async (req, res) => {
    try {
      const callbackData = req.body;
      console.log("M-Pesa callback received:", JSON.stringify(callbackData));

      // Extract the checkout request ID and Merchant Request ID
      const { CheckoutRequestID, ResultCode, MerchantRequestID } = callbackData.Body.stkCallback;

      // If payment was successful
      if (ResultCode === 0) {
        // Update transaction status using Merchant Request ID
        const [updatedTransaction] = await db.update(transactions)
          .set({ paymentStatus: "completed" })
          .where(eq(transactions.mpesaRef, MerchantRequestID))
          .returning();

        // If we have a transaction and the customer is a registered user, award loyalty points
        if (updatedTransaction) {
          try {
            // Find the payment with this transaction ID
            const payment = await db.select()
              .from(payments)
              .where(eq(payments.transactionId, updatedTransaction.id))
              .limit(1);

            if (payment[0]) {
              // Find the user by phone number 
              if (payment[0].phoneNumber) {
                const user = await db.select()
                  .from(users)
                  .where(eq(users.phoneNumber, payment[0].phoneNumber))
                  .limit(1);

                if (user[0]) {
                  // Award points based on payment amount (1 point for every 10 KES)
                  const amountNum = parseFloat(payment[0].amount);
                  const pointsToAward = Math.floor(amountNum / 10);

                  if (pointsToAward > 0) {
                    await storage.awardLoyaltyPoints(user[0].id, pointsToAward);
                    console.log(`Awarded ${pointsToAward} points to user ${user[0].id} for M-Pesa transaction`);
                  }
                }
              }
            }
          } catch (pointsError) {
            console.error("Error awarding points for M-Pesa payment:", pointsError);
            // Continue even if points award fails
          }
        }
      }

      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error("M-Pesa callback error:", error);
      res.status(200).json({ success: true }); // Always return 200 to M-Pesa
    }
  }));

  app.post("/api/transactions/payment", asyncHandler(async (req, res) => {
    try {
      const { transactionId, amount, paymentMethod, phoneNumber, reference } = req.body;

      console.log("Payment request received:", req.body);

      // Validate essential input
      if (!transactionId) {
        return res.status(400).json({
          success: false,
          error: "Missing transaction ID"
        });
      }

      // Default to cash payment if not specified
      const method = paymentMethod || "cash";

      // Find the transaction to get the amount if not provided
      let transactionAmount = amount;
      if (!transactionAmount) {
        try {
          const transaction = await db.select()
            .from(transactions)
            .where(eq(transactions.id, transactionId))
            .limit(1);

          if (transaction && transaction.length > 0) {
            transactionAmount = transaction[0].amount;
          } else {
            return res.status(404).json({
              success: false,
              error: "Transaction not found"
            });
          }
        } catch (err) {
          console.error("Error fetching transaction:", err);
          return res.status(500).json({
            success: false,
            error: "Error fetching transaction details"
          });
        }
      }

      // Create payment record
      const paymentData = {
        transactionId,
        amount: String(transactionAmount), // Always convert amount to string
        paymentMethod: method,
        status: method === "cash" ? "completed" : "pending",
        reference: reference || null,
        phoneNumber: phoneNumber || null,
        createdAt: new Date()
      };

      console.log("Creating payment record:", paymentData);
      const [payment] = await db.insert(payments).values([paymentData as any]).returning();

      if (!payment) {
        return res.status(400).json({
          success: false,
          error: "Failed to create payment record"
        });
      }

      // Always update the transaction status for cash payments
      if (method === "cash") {
        try {
          // Update transaction payment status to completed
          const result = await db.update(transactions)
            .set({ 
              paymentStatus: "completed" 
            })
            .where(eq(transactions.id, transactionId))
            .returning();

          console.log("Transaction updated:", result);
        } catch (err) {
          console.error("Error updating transaction:", err);
          // Continue anyway since we've created the payment record
        }
      }

      return res.json({
        success: true,
        payment,
        message: `${method.toUpperCase()} payment processed successfully`
      });
    } catch (error: any) {
      console.error("Payment error:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to process payment"
      });
    }
  }));

  // Cash payment route
  app.post("/api/payments/cash", asyncHandler(async (req, res) => {
    try {
      const { PaymentDebugger } = await import('./paymentDebugger');
      PaymentDebugger.log('cash', 'request', req.body);

      const paymentData = cashPaymentSchema.parse(req.body);
      PaymentDebugger.log('cash', 'validated_data', paymentData);

      // Check if this is a split payment
      const isSplitPayment = paymentData.splitPayment || false;
      
      // Create a clean payment record with only the fields defined in the schema
      const paymentRecord: any = {
        transactionId: paymentData.transactionId,
        amount: String(paymentData.amount),
        paymentMethod: "cash",
        status: "completed",
        createdAt: new Date(),
        // Use the provided reference or generate a new one
        reference: paymentData.reference || `CASH-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      };
      
      // Only add split payment fields if this is actually a split payment
      if (isSplitPayment) {
        // These fields are not in the schema, but we'll add them as custom properties
        // They'll be ignored by the database but used in our application logic
        paymentRecord.splitPayment = true;
        paymentRecord.splitIndex = paymentData.splitIndex;
        paymentRecord.splitTotal = paymentData.splitTotal;
      }

      PaymentDebugger.log('cash', 'payment_record', paymentRecord);
      
      try {
        // Insert payment record and return the result
        const [payment] = await db.insert(payments).values([paymentRecord]).returning();

        if (!payment) {
          PaymentDebugger.logError('cash', 'payment_record_creation', 'No payment record returned');
          return res.status(500).json({
            success: false,
            error: "Failed to create cash payment record"
          });
        }

        PaymentDebugger.log('cash', 'payment_record_created', payment);

        // For split payments, only mark the transaction as completed when all parts are paid
        if (!isSplitPayment) {
          // Regular payment - update transaction status to completed
          try {
            await db.update(transactions)
              .set({ 
                paymentStatus: "completed" 
              })
              .where(eq(transactions.id, paymentData.transactionId));

            PaymentDebugger.log('cash', 'transaction_updated', { transactionId: paymentData.transactionId });
          } catch (updateError) {
            PaymentDebugger.logError('cash', 'transaction_update', updateError);
            // Even if the update fails, we'll continue since we've created the payment record
          }
        } else {
          // For split payments, check if all splits have been paid
          try {
            // Count existing payments for this transaction
            const existingPayments = await db.select()
              .from(payments)
              .where(eq(payments.transactionId, paymentData.transactionId))
              .where(eq(payments.status, "completed"));

            // We can't check splitPayment directly since it's not in the schema
            // Instead, we'll check if we have enough payments matching our expected count
            if (existingPayments.length >= paymentData.splitTotal) {
              await db.update(transactions)
                .set({ 
                  paymentStatus: "completed" 
                })
                .where(eq(transactions.id, paymentData.transactionId));

              PaymentDebugger.log('cash', 'transaction_updated_after_all_splits', { 
                transactionId: paymentData.transactionId,
                totalSplits: paymentData.splitTotal
              });
            }
          } catch (checkError) {
            PaymentDebugger.logError('cash', 'split_payment_check', checkError);
          }
        }

        // Award loyalty points if userId is provided
        if (paymentData.userId) {
          try {
            // For split payments, award proportional points
            const pointsMultiplier = isSplitPayment ? (1 / paymentData.splitTotal) : 1;
            // Award points based on payment amount (1 point for every 10 KES)
            const pointsToAward = Math.floor((paymentData.amount * pointsMultiplier) / 10);

            if (pointsToAward > 0) {
              const newPoints = await storage.awardLoyaltyPoints(paymentData.userId, pointsToAward);

              PaymentDebugger.log('cash', 'loyalty_points_awarded', {
                userId: paymentData.userId,
                pointsAwarded: pointsToAward,
                newTotalPoints: newPoints,
                isSplitPayment
              });
            }
          } catch (pointsError) {
            PaymentDebugger.logError('cash', 'loyalty_points_award', pointsError);
            // Continue even if points award fails, as the payment was successful
          }
        }

        return res.json({
          success: true,
          message: isSplitPayment 
            ? `Split payment ${paymentData.splitIndex + 1} of ${paymentData.splitTotal} processed successfully` 
            : "Cash payment processed successfully",
          payment
        });
      } catch (dbError) {
        // Handle specific database errors
        PaymentDebugger.logError('cash', 'database_operation', dbError);
        return res.status(500).json({
          success: false,
          error: dbError.message || "Database error while processing payment"
        });
      }
    } catch (error: any) {
      const { PaymentDebugger } = await import('./paymentDebugger');
      PaymentDebugger.logError('cash', 'payment_processing', error);

      return res.status(500).json({
        success: false,
        error: error.message || "Failed to process cash payment"
      });
    }
  }));

  // Airtel Money payment route
  app.post("/api/payments/airtel", asyncHandler(async (req, res) => {
    try {
      const { PaymentDebugger } = await import('./paymentDebugger');
      PaymentDebugger.log('airtel', 'request', req.body);

      const paymentData = airtelPaymentSchema.parse(req.body);
      PaymentDebugger.log('airtel', 'validated_data', paymentData);

      // Check if this is a split payment
      const isSplitPayment = paymentData.splitPayment || false;

      // Initiate Airtel Money payment
      const response = await airtelMoneyService.initiatePayment({
        phoneNumber: paymentData.phoneNumber,
        amount: paymentData.amount,
        reference: paymentData.reference || `TXN-${paymentData.transactionId}${isSplitPayment ? `-${paymentData.splitIndex}` : ''}`,
        transactionDesc: paymentData.transactionDesc || 
          (isSplitPayment 
            ? `Split payment ${paymentData.splitIndex + 1}/${paymentData.splitTotal} for gaming services` 
            : "Payment for gaming services")
      });

      PaymentDebugger.log('airtel', 'service_response', response);

      // For regular payments, update the transaction status
      if (!isSplitPayment) {
        try {
          // Create update data object with only valid columns
          const updateData: Record<string, any> = {
            paymentStatus: "pending"
          };

          // Check if airtelRef column exists in the schema
          const transactionColumns = Object.keys(transactions);
          if (transactionColumns.includes('airtelRef')) {
            updateData.airtelRef = response.reference;
          }

          PaymentDebugger.log('airtel', 'update_data', updateData);
          await db.update(transactions)
            .set(updateData)
            .where(eq(transactions.id, paymentData.transactionId));

          PaymentDebugger.log('airtel', 'transaction_updated', { transactionId: paymentData.transactionId });
        } catch (dbError) {
          PaymentDebugger.logError('airtel', 'transaction_update', dbError);

          // If the update fails, try with just payment status as a fallback
          try {
            await db.update(transactions)
              .set({ 
                paymentStatus: "pending"
              })
              .where(eq(transactions.id, paymentData.transactionId));

            PaymentDebugger.log('airtel', 'transaction_updated_fallback', { transactionId: paymentData.transactionId });
          } catch (fallbackError) {
            PaymentDebugger.logError('airtel', 'transaction_update_fallback', fallbackError);
          }
        }
      }

      // Create payment record in payments table
      try {
        // Create a clean payment record with only the fields defined in the schema
        const paymentRecord: any = {
          transactionId: paymentData.transactionId,
          amount: String(paymentData.amount),
          paymentMethod: "airtel",
          status: "pending",
          reference: response.reference,
          phoneNumber: paymentData.phoneNumber,
          createdAt: new Date()
        };

        // Store split payment information in a separate way that won't affect DB schema
        if (isSplitPayment) {
          // We're adding these as any properties since they're not in the schema
          // They'll be ignored by the database but used in our application logic
          paymentRecord.splitPayment = true;
          paymentRecord.splitIndex = paymentData.splitIndex;
          paymentRecord.splitTotal = paymentData.splitTotal;
        }

        PaymentDebugger.log('airtel', 'payment_record', paymentRecord);
        const [payment] = await db.insert(payments).values([paymentRecord]).returning();
        PaymentDebugger.log('airtel', 'payment_record_created', payment);

        // If immediate success response, award loyalty points right away
        if (response.status === "SUCCESS" && paymentData.userId) {
          try {
            // For split payments, award proportional points
            const pointsMultiplier = isSplitPayment ? (1 / paymentData.splitTotal) : 1;
            // Award points based on payment amount (1 point for every 10 KES)
            const pointsToAward = Math.floor((paymentData.amount * pointsMultiplier) / 10);

            if (pointsToAward > 0) {
              const newPoints = await storage.awardLoyaltyPoints(paymentData.userId, pointsToAward);

              PaymentDebugger.log('airtel', 'loyalty_points_awarded', {
                userId: paymentData.userId,
                pointsAwarded: pointsToAward,
                newTotalPoints: newPoints,
                isSplitPayment
              });
            }
          } catch (pointsError) {
            PaymentDebugger.logError('airtel', 'loyalty_points_award', pointsError);
            // Continue even if points award fails, as the payment was successful
          }
        }

        res.json({
          success: true,
          message: isSplitPayment 
            ? `Split payment ${paymentData.splitIndex + 1} of ${paymentData.splitTotal} initiated. Please check your phone.` 
            : "Airtel Money payment initiated. Please check your phone to complete payment.",
          reference: response.reference,
          transactionId: response.transactionId,
          payment
        });
      } catch (paymentDbError) {
        PaymentDebugger.logError('airtel', 'payment_record_creation', paymentDbError);

        // Even if payment record creation fails, we still return success as the Airtel Money
        // payment was initiated successfully
        res.json({
          success: true,
          message: isSplitPayment 
            ? `Split payment ${paymentData.splitIndex + 1} of ${paymentData.splitTotal} initiated. Please check your phone.` 
            : "Airtel Money payment initiated. Please check your phone to complete payment.",
          reference: response.reference,
          transactionId: response.transactionId
        });
      }
    } catch (error: any) {
      const { PaymentDebugger } = await import('./paymentDebugger');
      PaymentDebugger.logError('airtel', 'payment_initiation', error);

      res.status(500).json({
        success: false,
        error: error.message || "Failed to initiate Airtel Money payment"
      });
    }
  }));

  // Add Airtel Money callback endpoint
  app.post("/api/airtel/callback", asyncHandler(async (req, res) => {
    try {
      const callbackData = req.body;
      console.log("Airtel Money callback received:", JSON.stringify(callbackData));

      // Extract the reference ID from the callback data
      const { reference, status } = callbackData;

      // If payment was successful
      if (status === "SUCCESS") {
        // Find the payment with this reference
        const payment = await db.select()
          .from(payments)
          .where(eq(payments.reference, reference))
          .limit(1);

        if (payment[0]) {
          // Update payment status
          await db.update(payments)
            .set({ status: "completed" })
            .where(eq(payments.reference, reference));

          // Update transaction status
          const [updatedTransaction] = await db.update(transactions)
            .set({ paymentStatus: "completed" })
            .where(eq(transactions.id, payment[0].transactionId))
            .returning();

          // Award loyalty points if the customer can be identified by phone number
          if (payment[0].phoneNumber) {
            try {
              // Find the user by phone number
              const user = await db.select()
                .from(users)
                .where(eq(users.phoneNumber, payment[0].phoneNumber))
                .limit(1);

              if (user[0]) {
                // Award points based on payment amount (1 point for every 10 KES)
                const amountNum = parseFloat(payment[0].amount);
                const pointsToAward = Math.floor(amountNum / 10);

                if (pointsToAward > 0) {
                  await storage.awardLoyaltyPoints(user[0].id, pointsToAward);
                  console.log(`Awarded ${pointsToAward} points to user ${user[0].id} for Airtel Money transaction`);
                }
              }
            } catch (pointsError) {
              console.error("Error awarding points for Airtel Money payment:", pointsError);
              // Continue even if points award fails
            }
          }
        }
      }

      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error("Airtel Money callback error:", error);
      res.status(200).json({ success: true }); // Always return 200 to payment provider
    }
  }));

  // Get payment details for a specific transaction
  app.get("/api/payments/transaction/:transactionId", asyncHandler(async (req, res) => {
    try {
      const transactionId = Number(req.params.transactionId);
      if (isNaN(transactionId)) {
        return res.status(400).json({ error: "Invalid transaction ID" });
      }
      
      // Retrieve the payment record for this transaction
      const payment = await db.select()
        .from(payments)
        .where(eq(payments.transactionId, transactionId))
        .limit(1);
        
      if (payment && payment.length > 0) {
        return res.json(payment[0]);
      }
      
      // No payment record found
      return res.status(404).json({ error: "Payment record not found" });
    } catch (error) {
      console.error("Error retrieving payment record:", error);
      return res.status(500).json({ error: "Failed to retrieve payment information" });
    }
  }));

  // Payment debug endpoint (only for development)
  app.get("/api/debug/payments", asyncHandler(async (_req, res) => {
    try {
      const { PaymentDebugger } = await import('./paymentDebugger');
      const debugInfo = PaymentDebugger.getDebugInfo();
      res.json(debugInfo);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Failed to retrieve payment debug information"
      });
    }
  }));

  // Register enhanced M-Pesa routes
  app.use('/api/mpesa', mpesaRoutes);

      // Error handling middleware
  app.use((err: any, _req: any, res: any, _next: any) => {
    log(`API Error: ${err.message}`);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ error: message });
  });

  // Create event endpoint
  app.post("/api/events", asyncHandler(async (req, res) => {
    try {
      const eventData = z.object({
        title: z.string(),
        description: z.string().optional(),
        date: z.string(),
        time: z.string(),
        prize: z.string().optional(),
        maxParticipants: z.number().optional()
      }).parse(req.body);
      
      const [event] = await db.insert(events)
        .values({
          title: eventData.title,
          description: eventData.description || null,
          date: eventData.date,
          time: eventData.time,
          prize: eventData.prize || null,
          maxParticipants: eventData.maxParticipants || null,
          createdAt: new Date()
        })
        .returning();
      
      res.json(event);
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(500).json({ error: "Failed to create event" });
    }
  }));
  
  // Book an event slot
  app.post("/api/events/:eventId/book", asyncHandler(async (req, res) => {
    try {
      const { eventId } = req.params;
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      // Check if event exists
      const event = await db.select()
        .from(events)
        .where(eq(events.id, Number(eventId)))
        .limit(1);
      
      if (!event || event.length === 0) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      // Check if user has already booked this event
      const existingBooking = await db.select()
        .from(bookings)
        .where(eq(bookings.userId, Number(userId)))
        .where(eq(bookings.eventId, Number(eventId)))
        .limit(1);
        
      if (existingBooking && existingBooking.length > 0) {
        return res.status(400).json({ 
          error: "You have already booked this event",
          booking: existingBooking[0]
        });
      }
      
      // Create a booking record
      const [booking] = await db.insert(bookings)
        .values({
          userId: Number(userId),
          eventId: Number(eventId),
          status: "confirmed",
          createdAt: new Date()
        })
        .returning();
      
      res.json({ 
        success: true,
        booking,
        message: "You have successfully booked a slot for this event!" 
      });
    } catch (error) {
      console.error("Error booking event:", error);
      res.status(500).json({ error: "Failed to book event" });
    }
  }));

  return server;
}

// Common payment schema
const basePaymentSchema = z.object({
  amount: z.number(),
  transactionId: z.number(),
  userId: z.number().optional(), // Optional user ID for loyalty points
  reference: z.string().optional() // Optional reference for tracking
});

// Mobile money payment schemas
const mpesaPaymentSchema = z.object({
  phoneNumber: z.string(),
  amount: z.number(),
  transactionId: z.number(),
  userId: z.number().optional() // Optional user ID for loyalty points
});

const airtelPaymentSchema = z.object({
  phoneNumber: z.string(),
  amount: z.number(),
  transactionId: z.number(),
  userId: z.number().optional(), // Optional user ID for loyalty points
  reference: z.string().optional(), // Make reference optional since it might be generated server-side
  transactionDesc: z.string().optional(),
  splitPayment: z.boolean().optional(),
  splitIndex: z.number().optional(),
  splitTotal: z.number().optional()
});

// Cash payment schema - no additional fields needed
const cashPaymentSchema = basePaymentSchema.extend({
  splitPayment: z.boolean().optional(),
  splitIndex: z.number().optional(),
  splitTotal: z.number().optional()
});

const updateStationSchema = z.object({
  currentCustomer: z.string().nullable(),
  currentGame: z.string().nullable(),
  sessionType: z.enum(["per_game", "hourly"]).nullable(),
  sessionStartTime: z.date().nullable()
});