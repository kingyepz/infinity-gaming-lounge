import express from "express";
import cors from "cors";
import { setupVite, serveStatic } from "./vite";
import { registerRoutes } from "./routes";
import { createServer } from "http";
import { storage } from "./storage"; // Import storage module

// Initialize express app
const app = express();

// Basic middleware
app.use(express.json());
app.use(cors());

// Add CSP headers
app.use((_req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  );
  next();
});

// Basic request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get("/api/health", (_req, res) => {
  console.log("Health check endpoint called");
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    message: "Server is running correctly"
  });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

// Start server
(async () => {
  try {
    console.log("Starting server initialization...");

    // Initialize mock data before registering routes
    await storage.initializeMockData();
    console.log("Database initialized with mock data");

    // Create HTTP server
    const httpServer = createServer(app);

    // Register API routes first
    await registerRoutes(app);

    // Setup environment-specific middleware
    if (process.env.NODE_ENV !== "production") {
      console.log("Setting up Vite development middleware...");
      await setupVite(app, httpServer);
    } else {
      console.log("Setting up static file serving for production...");
      serveStatic(app);
    }

    const port = 5000;
    httpServer.listen(port, "0.0.0.0", () => {
      console.log(`Server is running on http://0.0.0.0:${port}`);
      console.log(`Mode: ${process.env.NODE_ENV || 'development'}`);
    }).on("error", (error: Error) => {
      console.error("Failed to start server:", error);
      process.exit(1);
    });
  } catch (error) {
    console.error("Failed to initialize server:", error);
    process.exit(1);
  }
})();

// Global error handlers
process.on("unhandledRejection", (error: Error) => {
  console.error("Unhandled Promise Rejection:", error);
  process.exit(1);
});

process.on("uncaughtException", (error: Error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});