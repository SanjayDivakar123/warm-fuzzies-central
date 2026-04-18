export function parseJsonResponse(raw, fallback = null) {
  if (!raw || typeof raw !== 'string') {
    return fallback;
  }

  const cleaned = raw.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    return fallback;
  }
}
