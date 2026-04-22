import {
  appendConversationMessage,
  getOrCreateConversation,
  updateConversationEvidence
} from "../services/conversationService.js";
import { runResearchPipeline } from "../services/researchPipelineService.js";

export async function handleChat(request, response, next) {
  try {
    const {
      conversationId,
      patientName = "",
      disease = "",
      intent = "",
      location = "",
      question = ""
    } = request.body || {};

    if (!question && !intent) {
      return response.status(400).json({
        message: "A question or intent is required."
      });
    }

    const conversation = await getOrCreateConversation({
      conversationId,
      patientName,
      disease,
      location,
      intent
    });

    await appendConversationMessage(conversation, {
      role: "user",
      content: question || intent,
      metadata: {
        patientName,
        disease,
        intent,
        location
      }
    });

    const result = await runResearchPipeline({
      conversation,
      patientName,
      disease,
      intent,
      location,
      question: question || intent
    });

    await appendConversationMessage(conversation, {
      role: "assistant",
      content: JSON.stringify(result.answer),
      metadata: {
        sources: {
          publications: result.publications.length,
          clinicalTrials: result.clinicalTrials.length
        }
      }
    });

    await updateConversationEvidence(conversation, {
      patientName: patientName || conversation.patientName,
      disease: disease || conversation.disease,
      location: location || conversation.location,
      intent: intent || conversation.intent,
      latestQuery: question || intent,
      lastEvidenceSnapshot: {
        publications: result.publications,
        clinicalTrials: result.clinicalTrials,
        queryExpansion: result.queryExpansion,
        candidateCounts: result.candidateCounts
      }
    });

    return response.json({
      conversationId: conversation._id,
      ...result
    });
  } catch (error) {
    return next(error);
  }
}

export async function getConversation(request, response, next) {
  try {
    const { conversationId } = request.params;
    const conversation = await getOrCreateConversation({ conversationId });

    return response.json({
      conversationId: conversation._id,
      conversation
    });
  } catch (error) {
    return next(error);
  }
}

