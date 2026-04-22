import mongoose from "mongoose";
import { env } from "./env.js";

let mongoReady = false;

export async function connectDatabase() {
  if (!env.enableMongo) {
    return { mongoReady: false, reason: "Mongo disabled by configuration" };
  }

  try {
    await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 3000
    });
    mongoReady = true;
    return { mongoReady: true };
  } catch (error) {
    console.warn("MongoDB unavailable, using in-memory conversation store.");
    console.warn(error.message);
    mongoReady = false;
    return { mongoReady: false, reason: error.message };
  }
}

export function isMongoReady() {
  return mongoReady;
}

