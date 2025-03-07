import { Express } from 'express';
import { db } from './db';
import { users, gamingSessions, payments } from '../shared/schema';
import { eq } from 'drizzle-orm';

export function setupRoutes(app: Express) {
  // User routes
  app.post('/api/users', async (req, res) => {
    try {
      const [user] = await db.insert(users).values(req.body).returning();
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create user' });
    }
  });

  // Gaming session routes
  app.post('/api/sessions', async (req, res) => {
    try {
      const [session] = await db.insert(gamingSessions).values(req.body).returning();
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create gaming session' });
    }
  });

  // Payment routes
  app.post('/api/payments', async (req, res) => {
    try {
      const [payment] = await db.insert(payments).values(req.body).returning();
      res.json(payment);
    } catch (error) {
      res.status(500).json({ error: 'Failed to process payment' });
    }
  });
}
