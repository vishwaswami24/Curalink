function normalizeText(value) {
  return String(value || "").toLowerCase();
}

const STOP_WORDS = new Set([
  "about",
  "after",
  "against",
  "are",
  "can",
  "clinical",
  "condition",
  "disease",
  "for",
  "from",
  "how",
  "into",
  "latest",
  "medical",
  "options",
  "relevant",
  "studies",
  "take",
  "that",
  "the",
  "their",
  "treatment",
  "trials",
  "what",
  "with"
]);

function splitTerms(value) {
  return normalizeText(value)
    .split(/[^a-z0-9]+/i)
    .filter((term) => term.length > 2 && !STOP_WORDS.has(term));
}

function countMatches(text, terms) {
  const haystack = normalizeText(text);
  return terms.reduce((score, term) => {
    if (!term) {
      return score;
    }
    return haystack.includes(normalizeText(term)) ? score + 1 : score;
  }, 0);
}

function computeRecencyScore(year) {
  const numericYear = Number(year);
  if (!numericYear) {
    return 0;
  }
  const delta = new Date().getFullYear() - numericYear;
  if (delta <= 1) {
    return 1;
  }
  if (delta <= 3) {
    return 0.75;
  }
  if (delta <= 6) {
    return 0.45;
  }
  return 0.2;
}

export function rankPublications(publications, { disease, intent, question }) {
  const diseaseTerms = splitTerms(disease);
  const intentTerms = splitTerms(intent);
  const questionTerms = splitTerms(question).slice(0, 6);

  return publications
    .map((item) => {
      const titleText = normalizeText(item.title);
      const content = `${item.title} ${item.abstract} ${(item.authors || []).join(" ")}`;
      const diseaseMatch = countMatches(content, diseaseTerms);
      const intentMatch = countMatches(content, intentTerms);
      const questionMatch = countMatches(content, questionTerms);
      const titleBoost =
        countMatches(titleText, diseaseTerms) * 0.6 + countMatches(titleText, intentTerms) * 0.9;
      const recency = computeRecencyScore(item.year);
      const credibility =
        item.source === "PubMed"
          ? 1
          : Math.min(1, Number(item.citedByCount || 0) / 100);
      const penalty = diseaseTerms.length && diseaseMatch === 0 ? 0.45 : 0;

      const score =
        diseaseMatch * 0.45 +
        intentMatch * 0.3 +
        questionMatch * 0.08 +
        titleBoost * 0.17 +
        recency * 0.15 +
        credibility * 0.2 -
        penalty;

      return {
        ...item,
        score: Number(score.toFixed(3)),
        supportingSnippet: (item.abstract || item.title || "").slice(0, 240)
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function rankClinicalTrials(trials, { disease, intent, question, location }) {
  const diseaseTerms = splitTerms(disease);
  const intentTerms = splitTerms(intent);
  const locationTerms = splitTerms(location);
  const questionTerms = splitTerms(question).slice(0, 6);

  return trials
    .map((item) => {
      const haystack = `${item.title} ${item.summary} ${item.eligibility} ${item.location}`;
      const diseaseMatch = countMatches(haystack, diseaseTerms);
      const intentMatch = countMatches(haystack, intentTerms);
      const locationMatch = countMatches(haystack, locationTerms);
      const questionMatch = countMatches(haystack, questionTerms);
      const recruitingBoost = /recruiting|not yet recruiting|active/i.test(item.status)
        ? 1
        : 0.5;
      const score =
        diseaseMatch * 0.42 +
        intentMatch * 0.28 +
        locationMatch * 0.12 +
        questionMatch * 0.08 +
        recruitingBoost * 0.1;

      return {
        ...item,
        score: Number(score.toFixed(3)),
        supportingSnippet: (item.summary || item.eligibility || item.title || "").slice(0, 240)
      };
    })
    .sort((a, b) => b.score - a.score);
}
