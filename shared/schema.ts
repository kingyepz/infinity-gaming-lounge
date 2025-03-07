import { createInsertSchema } from 'drizzle-zod';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { z } from 'zod';

// Users table - for both staff and customers
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  role: text('role', { enum: ['admin', 'staff', 'customer'] }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Gaming sessions table
export const gamingSessions = pgTable('gaming_sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  status: text('status', { enum: ['active', 'completed', 'cancelled'] }).notNull(),
  consoleType: text('console_type', { enum: ['ps5', 'xbox'] }).notNull(),
  amount: integer('amount').notNull(),
});

// Payments table
export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').references(() => gamingSessions.id),
  amount: integer('amount').notNull(),
  status: text('status', { enum: ['pending', 'completed', 'failed'] }).notNull(),
  mpesaReference: text('mpesa_reference'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const insertGamingSessionSchema = createInsertSchema(gamingSessions);
export const insertPaymentSchema = createInsertSchema(payments);

// Define types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type GamingSession = typeof gamingSessions.$inferSelect;
export type InsertGamingSession = z.infer<typeof insertGamingSessionSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
