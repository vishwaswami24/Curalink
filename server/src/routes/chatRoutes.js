import { Router } from "express";
import { getConversation, handleChat } from "../controllers/chatController.js";

const router = Router();

router.post("/chat", handleChat);
router.get("/conversations/:conversationId", getConversation);

export default router;

