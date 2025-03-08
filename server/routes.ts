
import { Router } from "express";
import { GameSession, Payment, UserWithoutPassword } from "../shared/schema";
import { db } from "./storage";

export function registerRoutes(app: Router) {
  // User routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await db.users.getAll();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await db.users.getById(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Game sessions routes
  app.get("/api/game-sessions", async (req, res) => {
    try {
      const sessions = await db.gameSessions.getAll();
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching game sessions:", error);
      res.status(500).json({ error: "Failed to fetch game sessions" });
    }
  });

  app.post("/api/game-sessions", async (req, res) => {
    try {
      const session = req.body as GameSession;
      const newSession = await db.gameSessions.create(session);
      res.status(201).json(newSession);
    } catch (error) {
      console.error("Error creating game session:", error);
      res.status(500).json({ error: "Failed to create game session" });
    }
  });

  app.patch("/api/game-sessions/:id", async (req, res) => {
    try {
      const updates = req.body;
      const updated = await db.gameSessions.update(parseInt(req.params.id), updates);
      res.json(updated);
    } catch (error) {
      console.error("Error updating game session:", error);
      res.status(500).json({ error: "Failed to update game session" });
    }
  });

  // Payments routes
  app.get("/api/payments", async (req, res) => {
    try {
      const payments = await db.payments.getAll();
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  app.post("/api/payments", async (req, res) => {
    try {
      const payment = req.body as Payment;
      const newPayment = await db.payments.create(payment);
      
      // Update user points if applicable
      if (payment.pointsEarned && payment.userId) {
        const user = await db.users.getById(payment.userId);
        if (user) {
          const updatedUser = await db.users.update(payment.userId, {
            points: user.points + payment.pointsEarned
          });
        }
      }
      
      res.status(201).json(newPayment);
    } catch (error) {
      console.error("Error creating payment:", error);
      res.status(500).json({ error: "Failed to create payment" });
    }
  });

  // Bonus games routes
  app.post("/api/bonus-games", async (req, res) => {
    try {
      const { userId, gameType } = req.body;
      // Logic to award a bonus game
      const bonusGame = await db.bonusGames.create({
        userId,
        gameType,
        used: false,
        createdAt: new Date()
      });
      res.status(201).json(bonusGame);
    } catch (error) {
      console.error("Error creating bonus game:", error);
      res.status(500).json({ error: "Failed to create bonus game" });
    }
  });

  app.get("/api/bonus-games/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const bonusGames = await db.bonusGames.getByUserId(userId);
      res.json(bonusGames);
    } catch (error) {
      console.error("Error fetching bonus games:", error);
      res.status(500).json({ error: "Failed to fetch bonus games" });
    }
  });
}
