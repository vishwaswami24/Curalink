import { buildExpandedQuery } from "./queryExpansionService.js";
import { fetchPublications } from "./publicationService.js";
import { fetchClinicalTrials } from "./clinicalTrialService.js";
import { rankClinicalTrials, rankPublications } from "./rankingService.js";
import { generateReasonedAnswer } from "./llmService.js";

function compressPublication(item) {
  return {
    id: item.id,
    title: item.title,
    abstract: item.abstract,
    authors: item.authors,
    year: item.year,
    source: item.source,
    url: item.url,
    venue: item.venue,
    score: item.score,
    supportingSnippet: item.supportingSnippet
  };
}

function compressTrial(item) {
  return {
    id: item.id,
    title: item.title,
    status: item.status,
    phase: item.phase,
    summary: item.summary,
    conditions: item.conditions,
    eligibility: item.eligibility,
    location: item.location,
    contact: item.contact,
    url: item.url,
    source: item.source,
    score: item.score,
    supportingSnippet: item.supportingSnippet
  };
}

export async function runResearchPipeline({
  conversation,
  patientName,
  disease,
  intent,
  location,
  question
}) {
  const expansion = buildExpandedQuery({
    disease,
    intent,
    naturalQuery: question,
    location,
    conversation
  });

  const [publicationCandidates, trialCandidates] = await Promise.all([
    fetchPublications({
      ...expansion,
      disease: expansion.normalizedDisease,
      intent: expansion.normalizedIntent
    }),
    fetchClinicalTrials({
      expandedQuery: expansion.expandedQuery,
      disease: expansion.normalizedDisease,
      location: expansion.normalizedLocation
    })
  ]);

  const rankedPublications = rankPublications(publicationCandidates, {
    disease: expansion.normalizedDisease,
    intent: expansion.normalizedIntent,
    question: expansion.normalizedQuestion
  });

  const rankedTrials = rankClinicalTrials(trialCandidates, {
    disease: expansion.normalizedDisease,
    intent: expansion.normalizedIntent,
    question: expansion.normalizedQuestion,
    location: expansion.normalizedLocation
  });

  const topPublications = rankedPublications.slice(0, 6).map(compressPublication);
  const topTrials = rankedTrials.slice(0, 4).map(compressTrial);

  const answer = await generateReasonedAnswer({
    context: {
      patientName,
      disease: expansion.normalizedDisease,
      intent: expansion.normalizedIntent,
      location: expansion.normalizedLocation,
      question: expansion.normalizedQuestion
    },
    publications: topPublications,
    trials: topTrials
  });

  return {
    queryExpansion: expansion,
    candidateCounts: {
      publications: publicationCandidates.length,
      clinicalTrials: trialCandidates.length
    },
    answer,
    publications: topPublications,
    clinicalTrials: topTrials
  };
}
