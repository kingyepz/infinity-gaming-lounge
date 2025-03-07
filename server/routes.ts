import { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTransactionSchema } from "@shared/schema";
import { z } from "zod";

const mpesaPaymentSchema = z.object({
  phoneNumber: z.string(),
  amount: z.number(),
  transactionId: z.number()
});

const updateStationSchema = z.object({
  currentCustomer: z.string().nullable(),
  currentGame: z.string().nullable(),
  sessionType: z.enum(["per_game", "hourly"]).nullable(),
  sessionStartTime: z.date().nullable()
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Game Station Routes
  app.get("/api/stations", async (_req, res) => {
    const stations = await storage.getGameStations();
    res.json(stations);
  });

  app.patch("/api/stations/:id", async (req, res) => {
    try {
      const stationData = updateStationSchema.parse(req.body);
      const station = await storage.updateGameStation(Number(req.params.id), stationData);
      res.json(station);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Report Generation Routes
  app.get("/api/reports/current", async (_req, res) => {
    try {
      const stations = await storage.getGameStations();
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
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/reports/hourly", async (_req, res) => {
    try {
      const stations = await storage.getGameStations();
      const transactions = await Promise.all(
        stations.map(station => storage.getTransactionsByStation(station.id))
      );

      const now = new Date();
      const hourAgo = new Date(now.getTime() - (60 * 60 * 1000));

      const hourlyTransactions = transactions.flat().filter(tx => 
        new Date(tx.createdAt) >= hourAgo
      );

      const report = {
        totalRevenue: hourlyTransactions.reduce((sum, tx) => sum + tx.amount, 0),
        activeSessions: stations.filter(s => s.currentCustomer).length,
        completedSessions: hourlyTransactions.length,
        sessions: hourlyTransactions.map(tx => ({
          stationName: stations.find(s => s.id === tx.stationId)?.name,
          customerName: tx.customerName,
          duration: tx.sessionType === "per_game" ? "1 game" : `${tx.duration} minutes`
        }))
      };

      res.json(report);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/reports/daily", async (_req, res) => {
    try {
      const stations = await storage.getGameStations();
      const transactions = await Promise.all(
        stations.map(station => storage.getTransactionsByStation(station.id))
      );

      const now = new Date();
      const dayStart = new Date(now.setHours(0,0,0,0));

      const dailyTransactions = transactions.flat().filter(tx => 
        new Date(tx.createdAt) >= dayStart
      );

      const report = {
        totalRevenue: dailyTransactions.reduce((sum, tx) => sum + tx.amount, 0),
        activeSessions: stations.filter(s => s.currentCustomer).length,
        completedSessions: dailyTransactions.length,
        sessions: dailyTransactions.map(tx => ({
          stationName: stations.find(s => s.id === tx.stationId)?.name,
          customerName: tx.customerName,
          duration: tx.sessionType === "per_game" ? "1 game" : `${tx.duration} minutes`
        }))
      };

      res.json(report);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Game Routes
  app.get("/api/games", async (_req, res) => {
    const games = await storage.getGames();
    res.json(games);
  });

  // Transaction Routes
  app.post("/api/transactions", async (req, res) => {
    try {
      const transactionData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(transactionData);
      res.json(transaction);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/transactions/station/:stationId", async (req, res) => {
    const transactions = await storage.getTransactionsByStation(Number(req.params.stationId));
    res.json(transactions);
  });

  // M-Pesa Payment Routes
  app.post("/api/payments/mpesa", async (req, res) => {
    try {
      const paymentData = mpesaPaymentSchema.parse(req.body);

      // TODO: Integrate with actual M-Pesa API
      // For now, simulate payment success
      const mpesaRef = `MP${Date.now()}`;

      await storage.updateTransactionStatus(
        paymentData.transactionId,
        "completed",
        mpesaRef
      );

      res.json({
        success: true,
        message: "Payment initiated",
        mpesaRef
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}