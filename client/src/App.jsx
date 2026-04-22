import { useState, useEffect } from "react";
import { sendResearchQuery } from "./api/client";
import { AssistantResponse } from "./components/AssistantResponse";
import { QueryForm } from "./components/QueryForm";
import { SourcePanel } from "./components/SourcePanel";

const demoPrompts = [
  "Latest treatment for lung cancer",
  "Clinical trials for diabetes",
  "Top researchers in Alzheimer's disease",
  "Recent studies on heart disease"
];

function LogoIcon() {
  return (
    <div className="brand-icon">
      <span className="brand-icon__core" />
    </div>
  );
}

export default function App() {
  const [conversationId, setConversationId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [selectedPrompt, setSelectedPrompt] = useState("");
  const [pendingQuery, setPendingQuery] = useState("");
  const [pendingTime, setPendingTime] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("selectedPrompt");
    if (saved) {
      setSelectedPrompt(saved);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("selectedPrompt", selectedPrompt);
  }, [selectedPrompt]);

  async function handleSubmit(payload) {
    setLoading(true);
    setError("");
    setPendingQuery(payload.question || payload.intent || "Medical research query");
    setPendingTime(
      new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      })
    );

    try {
      const data = await sendResearchQuery({
        ...payload,
        conversationId
      });
      setConversationId(data.conversationId);
      setResult(data);
      setSelectedPrompt("");
      localStorage.removeItem("selectedPrompt");
    } catch (submissionError) {
      setError(submissionError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-shell app-shell--fullscreen">
      <section className="main-shell">
        <header className="topbar">
          <div className="topbar__left">
            <div className="topbar__brandmark">
              <LogoIcon />
            </div>
            <div className="topbar__title">
              <strong>Curalink</strong>
            </div>
          </div>
          <div className="topbar__live">
            <span className="topbar__live-dot" />
            <span>Live</span>
          </div>
        </header>

        <section className="content-shell">
          {!result && !loading ? (
            <section className="welcome-stage">
              <div className="welcome-panel">
                <div className="welcome-panel__orb">
                  <LogoIcon />
                </div>
                <h2>
                  Medical Research, <span>Powered by AI</span>
                </h2>
                <p>
                  Enter your medical research query below. Curalink retrieves research from PubMed,
                  OpenAlex, and ClinicalTrials.gov, then reasons over it to deliver structured, source-backed insights.
                </p>
                <div className="welcome-panel__chips">
                  {demoPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      className="welcome-chip"
                      type="button"
                      onClick={() => setSelectedPrompt(prompt)}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          ) : loading && !result ? (
            <section className="loading-stage">
              <div className="loading-stage__row loading-stage__row--user">
                <div className="loading-stage__query">{pendingQuery}</div>
                <div className="loading-stage__avatar">U</div>
              </div>
              <div className="loading-stage__time">{pendingTime}</div>
              <div className="loading-stage__row loading-stage__row--assistant">
                <div className="loading-stage__brand">
                  <LogoIcon />
                </div>
                <div className="loading-stage__bubble">
                  <span className="loading-stage__dots">
                    <span />
                    <span />
                    <span />
                  </span>
                  <span>Curalink is researching...</span>
                </div>
              </div>
            </section>
          ) : (
            <section className="results-stage">
              <div className="results-stage__query-block">
                <div className="loading-stage__row loading-stage__row--user">
                  <div className="loading-stage__query">{pendingQuery}</div>
                  <div className="loading-stage__avatar">U</div>
                </div>
                <div className="loading-stage__time">{pendingTime}</div>
              </div>
              <AssistantResponse answer={result.answer} metadata={result} />
              <SourcePanel publications={result.publications || []} clinicalTrials={result.clinicalTrials || []} />
            </section>
          )}
        </section>

        <section className="composer-shell">
          {error ? <div className="error-banner">{error}</div> : null}
          <QueryForm onSubmit={handleSubmit} loading={loading} selectedPrompt={selectedPrompt} />
        </section>
      </section>
    </main>
  );
}
