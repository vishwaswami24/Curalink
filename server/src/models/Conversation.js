import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    metadata: {
      type: Object,
      default: {}
    }
  },
  { _id: false, timestamps: true }
);

const ConversationSchema = new mongoose.Schema(
  {
    patientName: String,
    disease: String,
    location: String,
    intent: String,
    messages: {
      type: [MessageSchema],
      default: []
    },
    latestQuery: String,
    lastEvidenceSnapshot: {
      type: Object,
      default: null
    }
  },
  { timestamps: true }
);

export const Conversation = mongoose.model("Conversation", ConversationSchema);

