const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function sendResearchQuery(payload) {
  const response = await fetch(`${API_BASE_URL}api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to generate medical research response.");
  }

  return response.json();
}

