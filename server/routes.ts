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