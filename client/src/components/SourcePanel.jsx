function SourceCard({ item, type }) {
  const publicationActionLabel =
    item.source === "PubMed"
      ? "Open in PubMed"
      : item.source === "OpenAlex"
        ? "Open in OpenAlex"
        : "Open source";

  return (
    <article className="source-card">
      <div className="source-card__meta">
        <span>{item.source}</span>
        <span>{type === "publication" ? item.year || "Unknown year" : item.status}</span>
      </div>
      <h4>{item.title}</h4>
      {type === "publication" ? (
        <>
          <p>{item.supportingSnippet}</p>
          <div className="source-card__footer">
            <span>{(item.authors || []).slice(0, 3).join(", ") || "Authors unavailable"}</span>
            <a className="secondary-button secondary-button--link" href={item.url} target="_blank" rel="noreferrer">
              <span>{publicationActionLabel}</span>
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </>
      ) : (
        <>
          <p>{item.supportingSnippet}</p>
          <div className="trial-details">
            <span>{item.location}</span>
            <span>{item.contact}</span>
          </div>
          <a className="secondary-button secondary-button--link" href={item.url} target="_blank" rel="noreferrer">
            <span>Open Trial Record</span>
            <span aria-hidden="true">↗</span>
          </a>
        </>
      )}
    </article>
  );
}

export function SourcePanel({ publications, clinicalTrials }) {
  const hasPublications = publications.length > 0;
  const hasTrials = clinicalTrials.length > 0;

  if (!hasPublications && !hasTrials) {
    return null;
  }

  return (
    <section className="sources-layout">
      {hasPublications ? (
        <div>
          <div className="panel-heading">
            <span className="eyebrow">Publications</span>
            <h3>Ranked evidence</h3>
          </div>
          <div className="source-grid">
            {publications.map((item) => (
              <SourceCard key={item.id} item={item} type="publication" />
            ))}
          </div>
        </div>
      ) : null}

      {hasTrials ? (
        <div>
          <div className="panel-heading">
            <span className="eyebrow">Clinical Trials</span>
            <h3>Live study matches</h3>
          </div>
          <div className="source-grid">
            {clinicalTrials.map((item) => (
              <SourceCard key={item.id} item={item} type="trial" />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
