function Section({ title, items, paragraph }) {
  return (
    <section className="response-section">
      <h3>{title}</h3>
      {paragraph ? <p>{paragraph}</p> : null}
      {items?.length ? (
        <ul>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export function AssistantResponse({ answer, metadata }) {
  if (!answer) {
    return null;
  }

  return (
    <article className="assistant-response">
      <div className="assistant-response__header">
        <span className="eyebrow">Structured answer</span>
        <h2>Research-backed synthesis</h2>
        <p>
          Query expanded to <strong>{metadata?.queryExpansion?.expandedQuery || "context-aware search"}</strong> with{" "}
          {metadata?.candidateCounts?.publications || 0} publication candidates and{" "}
          {metadata?.candidateCounts?.clinicalTrials || 0} clinical trial candidates.
        </p>
      </div>

      <Section title="Condition Overview" paragraph={answer.conditionOverview} />
      <Section title="Research Insights" items={answer.researchInsights} />
      <Section title="Clinical Takeaways" items={answer.clinicalTakeaways} />
      <Section title="Clinical Trials" paragraph={answer.trialSummary} />
      <Section title="Personalized Guidance" items={answer.personalizedGuidance} />
      <Section title="Safety Notes" items={answer.safetyNotes} />
    </article>
  );
}

