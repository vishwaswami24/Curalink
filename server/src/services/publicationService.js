import { env } from "../config/env.js";

const GENERIC_TERMS = new Set([
  "clinical",
  "disease",
  "latest",
  "medical",
  "research",
  "studies",
  "study",
  "treatment",
  "trial",
  "trials"
]);

function splitTerms(value) {
  return String(value || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((term) => term.length > 2 && !GENERIC_TERMS.has(term));
}

function parseOpenAlexWork(work) {
  return {
    id: work.id,
    title: work.title,
    abstract:
      work.abstract_inverted_index
        ? Object.entries(work.abstract_inverted_index)
            .flatMap(([word, positions]) =>
              positions.map((position) => ({ word, position }))
            )
            .sort((a, b) => a.position - b.position)
            .map((item) => item.word)
            .join(" ")
        : work.primary_location?.source?.display_name || "",
    authors: (work.authorships || [])
      .map((entry) => entry.author?.display_name)
      .filter(Boolean),
    year: work.publication_year,
    source: "OpenAlex",
    url: work.primary_location?.landing_page_url || work.id,
    citedByCount: work.cited_by_count || 0,
    venue: work.primary_location?.source?.display_name || "",
    raw: work
  };
}

function safeSlice(text, limit = 1200) {
  return String(text || "").slice(0, limit);
}

async function fetchOpenAlex(keywordBag) {
  const query = encodeURIComponent(keywordBag.slice(0, 6).join(" "));
  const url = `https://api.openalex.org/works?search=${query}&per-page=30&sort=relevance_score:desc`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "medical-research-assistant/1.0"
    }
  });

  if (!response.ok) {
    throw new Error(`OpenAlex request failed with ${response.status}`);
  }

  const data = await response.json();
  return (data.results || []).map(parseOpenAlexWork);
}

async function fetchPubMedIds(term) {
  const url =
    "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi" +
    `?db=pubmed&retmode=json&retmax=30&sort=relevance&term=${encodeURIComponent(term)}` +
    `&tool=${encodeURIComponent(env.pubmedTool)}&email=${encodeURIComponent(env.pubmedEmail)}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`PubMed search failed with ${response.status}`);
  }

  const data = await response.json();
  return data.esearchresult?.idlist || [];
}

function parsePubMedArticle(article) {
  const medline = article?.MedlineCitation || {};
  const articleData = medline?.Article || {};
  const journal = articleData?.Journal || {};
  const abstractText = articleData?.Abstract?.AbstractText || [];
  const authors = (articleData?.AuthorList || [])
    .map((author) => [author.ForeName, author.LastName].filter(Boolean).join(" "))
    .filter(Boolean);
  const pubDate =
    journal?.JournalIssue?.PubDate?.Year ||
    journal?.JournalIssue?.PubDate?.MedlineDate ||
    "";
  const pmid = medline?.PMID?._ || medline?.PMID || "";

  return {
    id: `pubmed:${pmid}`,
    title: articleData?.ArticleTitle || "",
    abstract: safeSlice(
      Array.isArray(abstractText) ? abstractText.join(" ") : abstractText
    ),
    authors,
    year: String(pubDate).match(/\d{4}/)?.[0] || "",
    source: "PubMed",
    url: pmid ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/` : "",
    citedByCount: 0,
    venue: journal?.Title || "",
    raw: article
  };
}

async function fetchPubMedDetails(ids) {
  if (!ids.length) {
    return [];
  }

  const url =
    "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi" +
    `?db=pubmed&id=${ids.join(",")}&retmode=xml&tool=${encodeURIComponent(env.pubmedTool)}` +
    `&email=${encodeURIComponent(env.pubmedEmail)}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`PubMed details failed with ${response.status}`);
  }

  const xml = await response.text();
  const articles = [...xml.matchAll(/<PubmedArticle>([\s\S]*?)<\/PubmedArticle>/g)].map(
    (match) => match[1]
  );

  return articles.map((articleXml) => {
    const getTag = (tag) => {
      const match = articleXml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
      return match ? match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "";
    };

    const authorMatches = [...articleXml.matchAll(/<Author[\s\S]*?<ForeName>(.*?)<\/ForeName>[\s\S]*?<LastName>(.*?)<\/LastName>[\s\S]*?<\/Author>/g)];
    const authors = authorMatches.map((match) => `${match[1]} ${match[2]}`.trim());
    const pmid = getTag("PMID");

    return {
      id: `pubmed:${pmid}`,
      title: getTag("ArticleTitle"),
      abstract: safeSlice(getTag("AbstractText")),
      authors,
      year: getTag("Year") || (getTag("MedlineDate").match(/\d{4}/)?.[0] || ""),
      source: "PubMed",
      url: pmid ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/` : "",
      citedByCount: 0,
      venue: getTag("Title"),
      raw: { xml: articleXml }
    };
  });
}

export async function fetchPublications({ expandedQuery, keywordBag, disease, intent }) {
  const pubmedTerms = [
    [disease, intent].filter(Boolean).join(" "),
    disease,
    intent
  ].filter(Boolean);

  const [openAlexItems, pubMedIdGroups] = await Promise.all([
    fetchOpenAlex(keywordBag),
    Promise.all(pubmedTerms.map((term) => fetchPubMedIds(term)))
  ]);

  const pubMedIds = [...new Set(pubMedIdGroups.flat())];

  const pubmedItems = await fetchPubMedDetails(pubMedIds.slice(0, 25));

  const combined = [...openAlexItems, ...pubmedItems];
  const seen = new Set();
  const diseaseTerms = splitTerms(disease);
  const intentTerms = splitTerms(intent);

  return combined.filter((item) => {
    const key = `${item.source}:${item.title}`.toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);

    if (item.source !== "OpenAlex") {
      return true;
    }

    const text = `${item.title} ${item.abstract}`.toLowerCase();
    const diseaseMatch = diseaseTerms.some((term) => text.includes(term));
    const intentMatch = intentTerms.length
      ? intentTerms.some((term) => text.includes(term))
      : true;

    return diseaseMatch && intentMatch;
  });
}
