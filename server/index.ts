import express, { type Express } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import cors from "cors";

// Initialize express app
const app = express();

// CORS configuration
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true
}));

// Basic middleware
app.use(express.json());

// Simple request logging
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

// Clear error handler
app.use((err: Error, _req: any, _res: any, next: any) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

// Direct port binding
const port = 5000;
console.log("Starting server...");
console.log(`Attempting to bind to port ${port}...`);

(async () => {
  try {
    // Register routes first
    const server = await registerRoutes(app);

    // Then set up Vite in development mode
    if (process.env.NODE_ENV !== "production") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Start server
    server.listen(port, "0.0.0.0", () => {
      console.log(`Server is listening on http://0.0.0.0:${port}`);
    });

    // Handle server startup errors
    server.on("error", (error: any) => {
      console.error("Server startup error:", error);
      process.exit(1);
    });

  } catch (error) {
    console.error("Failed to initialize server:", error);
    process.exit(1);
  }
})();

// Global promise error handler
process.on("unhandledRejection", (error: Error) => {
  console.error("Unhandled promise rejection:", error);
  process.exit(1);
});