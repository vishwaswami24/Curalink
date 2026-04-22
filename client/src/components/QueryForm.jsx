import { useEffect, useState } from "react";

const initialState = {
  patientName: "",
  disease: "",
  intent: "",
  location: "",
  question: ""
};

export function QueryForm({ onSubmit, loading, selectedPrompt }) {
  const [form, setForm] = useState(initialState);
  const [mode, setMode] = useState("quick");

  useEffect(() => {
    const savedQuestion = localStorage.getItem("formQuestion");
    if (savedQuestion) {
      setForm((current) => ({
        ...current,
        question: savedQuestion
      }));
    }
  }, []);

  useEffect(() => {
    if (form.question) {
      localStorage.setItem("formQuestion", form.question);
    }
  }, [form.question]);

  useEffect(() => {
    if (!selectedPrompt) {
      return;
    }

    setMode("quick");
    setForm((current) => ({
      ...current,
      question: selectedPrompt
    }));
  }, [selectedPrompt]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit(form);
    if (form.question) localStorage.removeItem("formQuestion");
  }

  return (
    <form className="query-form query-form--dark" onSubmit={handleSubmit}>
      <div className="query-form__tabs">
        <button
          className={`query-form__tab ${mode === "structured" ? "query-form__tab--active" : ""}`}
          type="button"
          onClick={() => setMode("structured")}
        >
          Structured Input
        </button>
        <button
          className={`query-form__tab ${mode === "quick" ? "query-form__tab--active" : ""}`}
          type="button"
          onClick={() => setMode("quick")}
        >
          Quick Chat
        </button>
      </div>

      {mode === "structured" ? (
        <div className="query-form__structured">
          <div className="query-form__grid">
            <label>
              <span>Patient Name</span>
              <input name="patientName" value={form.patientName} onChange={updateField} placeholder="e.g. John Smith" />
            </label>
            <label>
              <span>Disease / Condition</span>
              <input name="disease" value={form.disease} onChange={updateField} placeholder="e.g. Parkinson's disease" />
            </label>
          </div>

          <label className="query-form__question">
            <span>Research Query *</span>
            <input
              name="question"
              value={form.question}
              onChange={updateField}
              placeholder="e.g. Deep Brain Stimulation outcomes in late-stage Parkinson's"
              required
            />
          </label>

          <div className="query-form__footer">
            <label className="query-form__location">
              <span>Location (for trial matching)</span>
              <input name="location" value={form.location} onChange={updateField} placeholder="e.g. Toronto, Canada" />
            </label>
            <button className="primary-button primary-button--dark" type="submit" disabled={loading}>
              <span className="primary-button__label">{loading ? "Researching..." : "Run Research"}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="query-form__quick">
          <div className="query-form__quick-row">
            <input
              className="query-form__quick-input"
              name="question"
              value={form.question}
              onChange={updateField}
              placeholder='Ask anything, e.g. "Latest treatment for lung cancer"'
              required
            />
            <button className="send-button" type="submit" disabled={loading}>
              <span aria-hidden="true">{loading ? "..." : "↑"}</span>
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
