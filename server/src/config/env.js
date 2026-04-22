import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 5000),
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  mongoUri:
    process.env.MONGODB_URI ||
    "mongodb://127.0.0.1:27017/medical-research-assistant",
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434",
  ollamaModel: process.env.OLLAMA_MODEL || "llama3.1:8b",
  groqApiKey: process.env.GROQ_API_KEY || "",
  groqModel: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
  pubmedTool: process.env.PUBMED_TOOL || "medical-research-assistant",
  pubmedEmail: process.env.PUBMED_EMAIL || "demo@example.com",
  enableMongo: String(process.env.ENABLE_MONGO || "true") === "true"
};

