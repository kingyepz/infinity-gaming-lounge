import { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import { InferModel } from "drizzle-orm";
import { db } from "./db";
import { users } from "../shared/schema"; // Assuming the schema is defined in a separate file and imported

// Define the type for a new user
type NewUser = InferModel<typeof users, "insert">;

async function migrateUsers() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      displayName VARCHAR(255) NOT NULL,
      gamingName VARCHAR(255) NOT NULL UNIQUE,
      phoneNumber VARCHAR(12) NOT NULL UNIQUE,
      points INTEGER NOT NULL DEFAULT 0,
      createdAt VARCHAR(255) NOT NULL,
      referralCode VARCHAR(8) UNIQUE,
      role VARCHAR(50) DEFAULT 'customer',
      status VARCHAR(20) DEFAULT 'offline'
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS friends (
      userId INTEGER NOT NULL REFERENCES users(id),
      friendId INTEGER NOT NULL REFERENCES users(id),
      createdAt VARCHAR(255) NOT NULL,
      PRIMARY KEY (userId, friendId)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS loyalty_history (
      id SERIAL PRIMARY KEY,
      userId INTEGER NOT NULL REFERENCES users(id),
      points INTEGER NOT NULL,
      description VARCHAR(255) NOT NULL,
      createdAt VARCHAR(255) NOT NULL
    )
  `;

  await db.execute(sql`SELECT 1;`);
}

migrateUsers().catch(console.error);

export async function addCustomer({
  displayName,
  gamingName,
  phoneNumber,
  points = 0,
  createdAt,
}: {
  displayName: string;
  gamingName: string;
  phoneNumber: string;
  points?: number;
  createdAt?: string;
}) {
  try {
    // Default to today's date if createdAt is not provided
    const formattedDate = createdAt ? new Date(createdAt) : new Date();

    const newUser: NewUser = {
      displayName,
      gamingName,
      phoneNumber,
      points,
      createdAt: formattedDate,
      referralCode: null, // Explicitly set as optional
      role: "customer", // Match schema default
    };

    const newCustomer = await db.insert(users).values(newUser).returning();
    return newCustomer[0]; // returning() gives an array, so return the first item
  } catch (error: any) {
    if (error.message.includes("unique constraint")) {
      if (error.message.includes("gamingName")) {
        throw new Error("Gaming Name is already in use.");
      } else if (error.message.includes("phoneNumber")) {
        throw new Error("Phone Number is already in use.");
      }
    }
    throw new Error("Failed to add customer: " + error.message);
  }
}
