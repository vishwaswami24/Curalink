function clean(value) {
  return String(value || "").trim();
}

function dedupe(items) {
  return [...new Set(items.filter(Boolean))];
}

export function buildExpandedQuery({
  disease,
  intent,
  naturalQuery,
  location,
  conversation
}) {
  const history = (conversation?.messages || [])
    .slice(-4)
    .map((item) => item.content)
    .join(" ");

  const diseaseValue = clean(disease) || clean(conversation?.disease);
  const intentValue = clean(intent) || clean(conversation?.intent);
  const locationValue = clean(location) || clean(conversation?.location);
  const queryValue = clean(naturalQuery);

  const fragments = dedupe([
    diseaseValue,
    intentValue,
    queryValue,
    locationValue,
    history
  ]);

  const keywordBag = dedupe([
    diseaseValue,
    intentValue,
    queryValue,
    `${queryValue} ${diseaseValue}`.trim(),
    `${intentValue} ${diseaseValue}`.trim(),
    `${queryValue} ${intentValue}`.trim(),
    `${queryValue} ${diseaseValue} clinical trial`.trim(),
    `${queryValue} ${diseaseValue} systematic review`.trim()
  ]);

  return {
    normalizedDisease: diseaseValue,
    normalizedIntent: intentValue,
    normalizedLocation: locationValue,
    normalizedQuestion: queryValue,
    expandedQuery: fragments.join(" ").replace(/\s+/g, " ").trim(),
    keywordBag
  };
}

