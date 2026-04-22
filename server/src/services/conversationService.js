import { randomUUID } from "node:crypto";
import { Conversation } from "../models/Conversation.js";
import { isMongoReady } from "../config/db.js";

const memoryStore = new Map();

function createMemoryConversation(seed = {}) {
  return {
    _id: randomUUID(),
    patientName: seed.patientName || "",
    disease: seed.disease || "",
    location: seed.location || "",
    intent: seed.intent || "",
    latestQuery: "",
    lastEvidenceSnapshot: null,
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

export async function getOrCreateConversation({
  conversationId,
  patientName,
  disease,
  location,
  intent
}) {
  if (isMongoReady()) {
    if (conversationId) {
      const existing = await Conversation.findById(conversationId);
      if (existing) {
        return existing;
      }
    }

    return Conversation.create({
      patientName,
      disease,
      location,
      intent,
      messages: []
    });
  }

  if (conversationId && memoryStore.has(conversationId)) {
    const existing = memoryStore.get(conversationId);
    existing.patientName = patientName || existing.patientName;
    existing.disease = disease || existing.disease;
    existing.location = location || existing.location;
    existing.intent = intent || existing.intent;
    return existing;
  }

  const conversation = createMemoryConversation({
    patientName,
    disease,
    location,
    intent
  });
  memoryStore.set(conversation._id, conversation);
  return conversation;
}

export async function appendConversationMessage(conversation, message) {
  if (isMongoReady()) {
    conversation.messages.push(message);
    conversation.updatedAt = new Date();
    await conversation.save();
    return conversation;
  }

  conversation.messages.push({
    ...message,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  conversation.updatedAt = new Date();
  memoryStore.set(conversation._id, conversation);
  return conversation;
}

export async function updateConversationEvidence(conversation, update) {
  if (isMongoReady()) {
    Object.assign(conversation, update, { updatedAt: new Date() });
    await conversation.save();
    return conversation;
  }

  Object.assign(conversation, update, { updatedAt: new Date() });
  memoryStore.set(conversation._id, conversation);
  return conversation;
}

