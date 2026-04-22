import express from "express";
import cors from "cors";
import chatRoutes from "./routes/chatRoutes.js";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.clientUrl
    })
  );
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (request, response) => {
    response.json({
      ok: true,
      service: "medical-research-assistant-api"
    });
  });

  app.use("/api", chatRoutes);
  app.use(errorHandler);

  return app;
}

