import { pgTable, text, serial, integer, boolean, timestamp, numeric, pgEnum } from "drizzle-orm/pg-core";
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

export const stationMaintenanceStatusEnum = pgEnum('station_maintenance_status', [
  'operational', 'maintenance', 'repair', 'offline'
]);

export const stationCategoryTypes = pgEnum('station_category_type', [
  'console', 'pc', 'vr', 'racing', 'arcade', 'mobile', 'other'
]);

export const stationCategories = pgTable("station_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: stationCategoryTypes("type").notNull(),
  description: text("description"),
  color: text("color").default("#6366F1"), // Default color for the category
  icon: text("icon").default("gamepad"), // Default icon name
  createdAt: timestamp("created_at").defaultNow()
});

export const gameStations = pgTable("game_stations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // "Game Station 1" etc
  isActive: boolean("is_active").default(true),
  categoryId: integer("category_id"), // FK to stationCategories
  status: stationMaintenanceStatusEnum("status").default("operational"),
  specs: text("specs"), // Hardware/software specs
  location: text("location"), // Physical location in the gaming lounge
  currentCustomer: text("current_customer"),
  currentGame: text("current_game"),
  sessionType: text("session_type", { enum: ["per_game", "hourly"] }),
  sessionStartTime: timestamp("session_start_time"),
  baseRate: integer("base_rate").default(40), // 40 KES per game
  hourlyRate: integer("hourly_rate").default(200), // 200 KES per hour
  peakHourRate: integer("peak_hour_rate"), // Optional rate for peak hours
  offPeakRate: integer("off_peak_rate"), // Optional rate for off-peak hours
  weekendRate: integer("weekend_rate"), // Optional rate for weekends
  lastMaintenance: timestamp("last_maintenance"), // When was the last maintenance
  nextMaintenance: timestamp("next_maintenance"), // When is the next scheduled maintenance
  notes: text("notes"), // Additional notes
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // FC25, GTA 5, etc.
  description: text("description"),
  pricePerSession: integer("price_per_session").default(40), // 40 KES per game session
  pricePerHour: integer("price_per_hour").default(200), // 200 KES per hour
  popularity: integer("popularity").default(0), // tracks game popularity
  isActive: boolean("is_active").default(true)
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  stationId: integer("station_id").notNull(),
  customerName: text("customer_name").notNull(),
  gameName: text("game_name"),
  sessionType: text("session_type", { enum: ["per_game", "hourly"] }).notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull().default("0"),
  paymentStatus: text("payment_status", { enum: ["pending", "completed", "failed"] }).notNull(),
  mpesaRef: text("mpesa_ref"),
  // Note: These columns are in the schema but not in the database
  // mpesaCheckoutId: text("mpesa_checkout_id"),
  // mpesaPhoneNumber: text("mpesa_phone_number"),
  duration: integer("duration"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  transactionId: integer("transaction_id").notNull(),
  amount: text("amount").notNull(),
  paymentMethod: text("payment_method", { enum: ["cash", "mpesa", "qr-mpesa"] }).notNull(),
  status: text("status", { enum: ["pending", "completed", "failed"] }).notNull(),
  reference: text("reference"), // Generic reference for any payment method
  phoneNumber: text("phone_number"), // Phone number for mobile money payments
  mpesaRef: text("mpesa_ref"), // M-Pesa receipt number
  merchantRequestId: text("merchant_request_id"), // M-Pesa merchant request ID
  checkoutRequestId: text("checkout_request_id"), // M-Pesa checkout request ID
  userId: integer("user_id"), // Optional user ID for loyalty points
  splitPayment: boolean("split_payment").default(false),
  splitIndex: integer("split_index"),
  splitTotal: integer("split_total"),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertUserSchema = createInsertSchema(users).pick({
  displayName: true,
  gamingName: true,
  phoneNumber: true,
  role: true
});

export const insertStationCategorySchema = createInsertSchema(stationCategories).pick({
  name: true,
  type: true,
  description: true,
  color: true,
  icon: true
});

export const insertGameStationSchema = createInsertSchema(gameStations).pick({
  name: true,
  isActive: true,
  categoryId: true,
  status: true,
  specs: true,
  location: true,
  hourlyRate: true,
  baseRate: true,
  peakHourRate: true,
  offPeakRate: true,
  weekendRate: true,
  notes: true,
  sessionType: true
});

export const insertGameSchema = createInsertSchema(games);

export const insertTransactionSchema = createInsertSchema(transactions)
  .pick({
    stationId: true,
    customerName: true,
    gameName: true,
    sessionType: true,
    amount: true,
    duration: true
  })
  .transform((data) => {
    // Create a new object to avoid modifying the original
    const result = { ...data };
    
    // Ensure amount is always a string
    if (data.amount !== undefined) {
      result.amount = typeof data.amount === 'number' ? String(data.amount) : data.amount;
    }
    
    return result;
  });

export const insertPaymentSchema = createInsertSchema(payments).pick({
  transactionId: true,
  amount: true,
  paymentMethod: true,
  reference: true,
  phoneNumber: true,
  status: true,
  mpesaRef: true,
  merchantRequestId: true,
  checkoutRequestId: true,
  userId: true,
  splitPayment: true,
  splitIndex: true,
  splitTotal: true
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type StationCategory = typeof stationCategories.$inferSelect;
export type InsertStationCategory = z.infer<typeof insertStationCategorySchema>;
export type GameStation = typeof gameStations.$inferSelect;
export type InsertGameStation = z.infer<typeof insertGameStationSchema>;
export type Game = typeof games.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;