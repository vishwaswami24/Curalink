import express from "express";
import cors from "cors";
import chatRoutes from "./routes/chatRoutes.js";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  app.use(cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (
        origin === env.clientUrl ||
        origin === 'https://curalink-v.netlify.app'
      ) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }));
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

