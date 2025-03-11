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
  referralCode: text("referral_code"),
  referredBy: integer("referred_by"),
  level: text("level", { enum: ["beginner", "pro", "elite"] }).default("beginner"),
  createdAt: timestamp("created_at").defaultNow()
});

export const friends = pgTable("friends", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  friendId: integer("friend_id").notNull(),
  status: text("status", { enum: ["pending", "accepted", "rejected"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  date: text("date").notNull(),
  time: text("time").notNull(),
  prize: text("prize"),
  maxParticipants: integer("max_participants"),
  createdAt: timestamp("created_at").defaultNow()
});

export const rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  points: integer("points").notNull(),
  available: boolean("available").default(true),
  createdAt: timestamp("created_at").defaultNow()
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  stationId: integer("station_id").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  duration: integer("duration").notNull(), // in hours
  status: text("status", { enum: ["pending", "confirmed", "cancelled"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const gameStations = pgTable("game_stations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // "Game Station 1" etc
  isActive: boolean("is_active").default(true),
  currentCustomer: text("current_customer"),
  currentGame: text("current_game"),
  sessionType: text("session_type", { enum: ["per_game", "hourly"] }),
  sessionStartTime: timestamp("session_start_time"),
  baseRate: integer("base_rate").default(40), // 40 KES per game
  hourlyRate: integer("hourly_rate").default(200), // 200 KES per hour
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // FC25, GTA 5, etc.
  isActive: boolean("is_active").default(true)
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  stationId: integer("station_id").notNull(),
  customerName: text("customer_name").notNull(),
  gameName: text("game_name").notNull(),
  sessionType: text("session_type", { enum: ["per_game", "hourly"] }).notNull(),
  amount: integer("amount").notNull(),
  paymentStatus: text("payment_status", { enum: ["pending", "completed", "failed"] }).notNull(),
  mpesaRef: text("mpesa_ref"),
  duration: integer("duration"), // in minutes, for hourly sessions
  createdAt: timestamp("created_at").defaultNow()
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  transactionId: integer("transaction_id").notNull(),
  amount: integer("amount").notNull(),
  paymentMethod: text("payment_method", { enum: ["cash", "mpesa"] }).notNull(),
  status: text("status", { enum: ["pending", "completed", "failed"] }).notNull(),
  mpesaRef: text("mpesa_ref"),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertUserSchema = createInsertSchema(users).pick({
  displayName: true,
  gamingName: true,
  phoneNumber: true,
  role: true
});

export const insertGameStationSchema = createInsertSchema(gameStations).pick({
  name: true,
  isActive: true
});

export const insertGameSchema = createInsertSchema(games);

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  stationId: true,
  customerName: true,
  gameName: true,
  sessionType: true,
  amount: true,
  duration: true
});

export const insertPaymentSchema = createInsertSchema(payments).pick({
  transactionId: true,
  amount: true,
  paymentMethod: true
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type GameStation = typeof gameStations.$inferSelect;
export type InsertGameStation = z.infer<typeof insertGameStationSchema>;
export type Game = typeof games.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;