import { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTransactionSchema, insertUserSchema, insertGameSchema } from "@shared/schema";
import { z } from "zod";

const mpesaPaymentSchema = z.object({
  phoneNumber: z.string(),
  amount: z.number(),
  transactionId: z.number()
});

export async function registerRoutes(app: Express): Promise<Server> {
  // User Routes
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    const user = await storage.getUser(Number(req.params.id));
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  });

  app.get("/api/users/phone/:phoneNumber", async (req, res) => {
    try {
      const users = Array.from(storage.users.values());
      const user = users.find(u => u.phoneNumber === req.params.phoneNumber);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Game Routes
  app.get("/api/games", async (_req, res) => {
    const games = await storage.getGames();
    res.json(games);
  });

  app.post("/api/games", async (req, res) => {
    try {
      const gameData = insertGameSchema.parse(req.body);
      const game = await storage.createGame(gameData);
      res.json(game);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
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

  app.get("/api/transactions/user/:userId", async (req, res) => {
    const transactions = await storage.getTransactionsByUser(Number(req.params.userId));
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

  app.get("/api/payments/status/:transactionId", async (req, res) => {
    const transaction = await storage.getTransactionsByUser(Number(req.params.transactionId));
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    res.json({ status: transaction[0].paymentStatus });
  });

  const httpServer = createServer(app);
  return httpServer;
}