import express from "express";

// Initialize express app
const app = express();

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
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

// Direct port binding
const port = 5000;
console.log("Starting server...");
console.log(`Attempting to bind to port ${port}...`);

app.listen(port, "0.0.0.0", () => {
  console.log(`Server is listening on http://0.0.0.0:${port}`);
}).on("error", (error: Error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});

// Global promise error handler
process.on("unhandledRejection", (error: Error) => {
  console.error("Unhandled promise rejection:", error);
  process.exit(1);
});