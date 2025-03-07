import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email"),
  displayName: text("display_name").notNull(),
  gamingName: text("gaming_name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  role: text("role", { enum: ["admin", "staff", "customer"] }).notNull(),
  points: integer("points").default(0),
  createdAt: timestamp("created_at").defaultNow()
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  hourlyRate: integer("hourly_rate").notNull(),
  isActive: boolean("is_active").default(true)
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  gameId: integer("game_id").notNull(),
  amount: integer("amount").notNull(),
  paymentStatus: text("payment_status", { enum: ["pending", "completed", "failed"] }).notNull(),
  mpesaRef: text("mpesa_ref"),
  duration: integer("duration").notNull(), // in minutes
  createdAt: timestamp("created_at").defaultNow(),
  points: integer("points").default(0)
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  displayName: true,
  gamingName: true,
  phoneNumber: true,
  role: true
});

export const insertGameSchema = createInsertSchema(games);

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  userId: true,
  gameId: true,
  amount: true,
  duration: true
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Game = typeof games.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;