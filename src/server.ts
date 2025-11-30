import { Server } from "http";
import app from "./app";
import dbConfig from "./config/db.config";

async function travelBuddyServer() {
  let server: Server;

  try {
    // Start the server
    server = app.listen(dbConfig.port, () => {
      console.log(
        `🚀 TravelBuddyServer is running on http://localhost:${dbConfig.port}`
      );
      console.log(`🌱 Environment: ${dbConfig.node_env}`);
      console.log(`💾 Database URL: ${dbConfig.database_url}`);
    });

    // Function to gracefully shut down the server
    const exitHandler = (options?: { exit?: boolean }) => {
      if (server) {
        server.close(() => {
          console.log("TravelBuddyServer closed gracefully.");
          if (options?.exit) process.exit(0);
        });
      } else if (options?.exit) {
        process.exit(0);
      }
    };

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason: any) => {
      console.error("Unhandled Rejection detected, closing server...");
      console.error(reason);
      exitHandler({ exit: true });
    });

    // Handle uncaught exceptions
    process.on("uncaughtException", (error: any) => {
      console.error("Uncaught Exception detected, closing server...");
      console.error(error);
      exitHandler({ exit: true });
    });

    // Handle SIGTERM
    process.on("SIGTERM", () => {
      console.log("SIGTERM received, closing server...");
      exitHandler({ exit: true });
    });

    // Handle SIGINT (Ctrl+C)
    process.on("SIGINT", () => {
      console.log("SIGINT received, closing server...");
      exitHandler({ exit: true });
    });
  } catch (error) {
    console.error("Error during TravelBuddyServer startup:", error);
    process.exit(1);
  }
}

// Start the server
travelBuddyServer();
