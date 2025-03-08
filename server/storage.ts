
import { GameSession, Payment, User, UserWithoutPassword } from "../shared/schema";

// In-memory storage for development
// In a production environment, this would be replaced with actual DB connections
class UserStorage {
  private users: User[] = [];

  async getAll(): Promise<UserWithoutPassword[]> {
    return this.users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }

  async getById(id: number): Promise<UserWithoutPassword | null> {
    const user = this.users.find(u => u.id === id);
    if (!user) return null;
    
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async getByPhoneNumber(phoneNumber: string): Promise<User | null> {
    return this.users.find(u => u.phoneNumber === phoneNumber) || null;
  }

  async create(user: Omit<User, "id" | "createdAt">): Promise<UserWithoutPassword> {
    const newUser: User = {
      ...user,
      id: this.users.length + 1,
      createdAt: new Date(),
      points: user.points || 0
    };
    this.users.push(newUser);
    
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  async update(id: number, updates: Partial<User>): Promise<UserWithoutPassword | null> {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) return null;
    
    this.users[index] = { ...this.users[index], ...updates };
    
    const { password, ...userWithoutPassword } = this.users[index];
    return userWithoutPassword;
  }
}

class GameSessionStorage {
  private sessions: GameSession[] = [];

  async getAll(): Promise<GameSession[]> {
    return this.sessions;
  }

  async getById(id: number): Promise<GameSession | null> {
    return this.sessions.find(s => s.id === id) || null;
  }

  async getActiveByUserId(userId: number): Promise<GameSession | null> {
    return this.sessions.find(s => s.userId === userId && !s.endTime) || null;
  }

  async create(session: Omit<GameSession, "id">): Promise<GameSession> {
    const newSession: GameSession = {
      ...session,
      id: this.sessions.length + 1,
      startTime: session.startTime || new Date()
    };
    this.sessions.push(newSession);
    return newSession;
  }

  async update(id: number, updates: Partial<GameSession>): Promise<GameSession | null> {
    const index = this.sessions.findIndex(s => s.id === id);
    if (index === -1) return null;
    
    this.sessions[index] = { ...this.sessions[index], ...updates };
    return this.sessions[index];
  }
}

class PaymentStorage {
  private payments: Payment[] = [];

  async getAll(): Promise<Payment[]> {
    return this.payments;
  }

  async getById(id: number): Promise<Payment | null> {
    return this.payments.find(p => p.id === id) || null;
  }

  async getByUserId(userId: number): Promise<Payment[]> {
    return this.payments.filter(p => p.userId === userId);
  }

  async create(payment: Omit<Payment, "id" | "timestamp">): Promise<Payment> {
    const newPayment: Payment = {
      ...payment,
      id: this.payments.length + 1,
      timestamp: new Date()
    };
    this.payments.push(newPayment);
    return newPayment;
  }
}

class BonusGameStorage {
  private bonusGames: any[] = [];

  async getByUserId(userId: number): Promise<any[]> {
    return this.bonusGames.filter(bg => bg.userId === userId && !bg.used);
  }

  async create(bonusGame: any): Promise<any> {
    const newBonusGame = {
      ...bonusGame,
      id: this.bonusGames.length + 1
    };
    this.bonusGames.push(newBonusGame);
    return newBonusGame;
  }

  async markAsUsed(id: number): Promise<any | null> {
    const index = this.bonusGames.findIndex(bg => bg.id === id);
    if (index === -1) return null;
    
    this.bonusGames[index] = { ...this.bonusGames[index], used: true };
    return this.bonusGames[index];
  }
}

// Export singleton instances
export const db = {
  users: new UserStorage(),
  gameSessions: new GameSessionStorage(),
  payments: new PaymentStorage(),
  bonusGames: new BonusGameStorage()
};

// Initialize with mock data
export async function initializeMockData() {
  // Check if data already exists
  const users = await db.users.getAll();
  if (users.length > 0) {
    console.log("Mock data already exists, skipping initialization");
    return;
  }
  
  console.log("Initializing mock data...");
  
  // Create mock users
  const admin = await db.users.create({
    displayName: "Admin Test",
    gamingName: "admin",
    phoneNumber: "254700000000",
    password: "password", // In production, this would be hashed
    role: "admin",
    points: 0
  });
  
  const staff = await db.users.create({
    displayName: "Staff Test",
    gamingName: "staff",
    phoneNumber: "254700000001",
    password: "password", // In production, this would be hashed
    role: "staff",
    points: 0
  });
  
  const customer1 = await db.users.create({
    displayName: "Customer One",
    gamingName: "gamer1",
    phoneNumber: "254700000002",
    password: "password", // In production, this would be hashed
    role: "customer",
    points: 50
  });
  
  const customer2 = await db.users.create({
    displayName: "Customer Two",
    gamingName: "gamer2",
    phoneNumber: "254700000003",
    password: "password", // In production, this would be hashed
    role: "customer",
    points: 25
  });
  
  // Create mock game sessions
  await db.gameSessions.create({
    userId: customer1.id,
    gameType: "fc25",
    startTime: new Date(Date.now() - 3600000), // 1 hour ago
    endTime: new Date(Date.now() - 3000000), // 50 minutes ago
    pointsEarned: 5,
    cost: 40
  });
  
  await db.gameSessions.create({
    userId: customer2.id,
    gameType: "nba2k",
    startTime: new Date(Date.now() - 1800000), // 30 minutes ago
    endTime: null, // Still active
    pointsEarned: null, // Not calculated yet
    cost: 40
  });
  
  // Create mock payments
  await db.payments.create({
    userId: customer1.id,
    amount: 200,
    paymentMethod: "mpesa",
    description: "5 games of FC25",
    pointsEarned: 25
  });
  
  await db.payments.create({
    userId: customer2.id,
    amount: 40,
    paymentMethod: "cash",
    description: "1 game of NBA2K",
    pointsEarned: 5
  });
  
  // Create mock bonus games
  await db.bonusGames.create({
    userId: customer1.id,
    gameType: "fc25",
    used: false,
    createdAt: new Date()
  });
  
  console.log("Mock data initialized successfully");
}
