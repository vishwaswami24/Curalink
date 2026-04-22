# Curalink Medical Research Assistant Prototype

Full-stack MERN-style prototype for the Curalink hackathon. The app combines structured intake, deep research retrieval, clinical trial discovery, context-aware follow-ups, and open-source LLM reasoning.

## What it does

- Accepts structured medical context: disease, intent, optional location, patient name, and a natural-language question.
- Expands queries intelligently before retrieval.
- Pulls a broad candidate pool from:
  - OpenAlex
  - PubMed
  - ClinicalTrials.gov
- Re-ranks and compresses evidence before sending it to a custom/open-source LLM.
- Produces source-backed structured responses with condition overview, research insights, and relevant clinical trials.
- Persists conversation context in MongoDB when available, with an in-memory fallback for demo reliability.

## Architecture

### Backend

- `Express` API for chat and conversation state
- `MongoDB + Mongoose` for persistent conversations
- Retrieval pipeline:
  1. Normalize structured + natural input
  2. Expand query using disease + intent + follow-up context
  3. Retrieve 50-300 publication candidates from OpenAlex and PubMed
  4. Retrieve clinical trials from ClinicalTrials.gov
  5. Score by relevance, recency, and source strength
  6. Send compact evidence bundle to an open-source LLM through Ollama

### Frontend

- `React + Vite`
- Conversational interface with structured intake panel
- Source cards for publications and clinical trials
- Multi-turn context using `conversationId`

## Run locally

### 1. Backend

```bash
cd server
copy .env.example .env
npm install
npm run dev
```

### 2. Frontend

```bash
cd client
npm install
npm run dev
```

## Environment variables

Backend `.env`:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/medical-research-assistant
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.1:8b
PUBMED_TOOL=medical-research-assistant
PUBMED_EMAIL=demo@example.com
ENABLE_MONGO=true
```

## Suggested demo prompts

- Latest treatment for lung cancer
- Clinical trials for diabetes in Toronto
- Top researchers in Alzheimer's disease
- Recent studies on heart disease and vitamin D

## Hackathon positioning

- Deep retrieval before precision
- Transparent, source-backed outputs
- Open-source LLM only
- Context-aware follow-up handling
- Scalable pipeline that can later add embeddings, caching, and async ingestion

