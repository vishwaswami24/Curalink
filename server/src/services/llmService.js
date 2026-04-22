import { env } from "../config/env.js";

function buildPrompt({ context, publications, trials }) {
  return `
You are Curalink, an AI medical research assistant.
Your job is to produce a careful, structured, source-backed answer.
Do not invent facts. If evidence is limited or mixed, say so clearly.
Do not provide diagnosis. Focus on medical research synthesis.

User context:
${JSON.stringify(context, null, 2)}

Top publications:
${JSON.stringify(publications, null, 2)}

Top clinical trials:
${JSON.stringify(trials, null, 2)}

Respond as JSON with this exact shape:
{
  "conditionOverview": "short paragraph",
  "researchInsights": [
    "insight 1",
    "insight 2",
    "insight 3"
  ],
  "clinicalTakeaways": [
    "takeaway 1",
    "takeaway 2"
  ],
  "trialSummary": "short paragraph",
  "personalizedGuidance": [
    "guidance 1",
    "guidance 2"
  ],
  "safetyNotes": [
    "note 1",
    "note 2"
  ]
}
`.trim();
}

function fallbackSynthesis({ context, publications, trials }) {
  const topTitles = publications.slice(0, 3).map((item) => item.title).filter(Boolean);
  const trialTitles = trials.slice(0, 2).map((item) => item.title).filter(Boolean);

  return {
    conditionOverview: context.disease
      ? `${context.disease} was used as the primary condition anchor for retrieval. The response combines research literature with live clinical-trial evidence so follow-up answers remain context-aware.`
      : "The response combines research literature with live clinical-trial evidence to answer the user's question.",
    researchInsights: [
      topTitles[0]
        ? `The highest ranked publication was "${topTitles[0]}", indicating strong relevance to the current query.`
        : "The system retrieved multiple relevant publications and prioritized the most query-aligned evidence.",
      "Ranking favored disease match, query relevance, recency, and source quality rather than returning only the first result.",
      "Evidence was merged across OpenAlex and PubMed to improve depth before final selection."
    ],
    clinicalTakeaways: [
      trialTitles[0]
        ? `Clinical trial retrieval surfaced "${trialTitles[0]}" as a relevant study candidate.`
        : "Clinical trial results were checked alongside the literature to capture emerging therapies.",
      context.location
        ? `Location context (${context.location}) was included during retrieval to improve practical relevance.`
        : "The system can incorporate location constraints when provided."
    ],
    trialSummary: trialTitles.length
      ? `Relevant trials were found, including ${trialTitles.join(" and ")}.`
      : "No high-confidence clinical trial summary could be generated from the current result set.",
    personalizedGuidance: [
      context.question
        ? `This answer was tailored to the user question: "${context.question}".`
        : "This answer was tailored using the structured intake and conversation history.",
      "Use the cited publications and trial links as the primary evidence anchors for any follow-up discussion."
    ],
    safetyNotes: [
      "This prototype summarizes research evidence and is not a substitute for clinical advice.",
      "If evidence is mixed, prioritize physician review and current treatment guidelines."
    ]
  };
}

export async function generateReasonedAnswer(payload) {
  const prompt = buildPrompt(payload);

  if (env.groqApiKey) {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.groqApiKey}`
        },
        body: JSON.stringify({
          model: env.groqModel,
          messages: [
            { role: "system", content: "You are Curalink, an AI medical research assistant. Always respond with valid JSON only." },
            { role: "user", content: prompt }
          ],
          temperature: 0.3,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) throw new Error(`Groq returned ${response.status}`);

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      console.warn("Groq unavailable, trying Ollama.", error.message);
    }
  }

  try {
    const response = await fetch(`${env.ollamaBaseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: env.ollamaModel,
        prompt,
        stream: false,
        format: "json"
      })
    });

    if (!response.ok) throw new Error(`Ollama returned ${response.status}`);

    const data = await response.json();
    return JSON.parse(data.response);
  } catch (error) {
    console.warn("Ollama unavailable, falling back to deterministic synthesis.", error.message);
    return fallbackSynthesis(payload);
  }
}

