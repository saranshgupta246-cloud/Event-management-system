export function isCompletedEvent(event) {
  return String(event?.status || "").toLowerCase() === "completed";
}

export function isPresentRegistration(registration) {
  return String(registration?.attendanceStatus || "").toLowerCase() === "present";
}

export function canSubmitEventFeedback(registration) {
  return registration?.status === "confirmed" && isCompletedEvent(registration?.event) && isPresentRegistration(registration);
}

export function normalizeFeedbackSummary(raw) {
  const data = raw || {};
  return {
    averageRating: Number(data.averageRating || 0),
    feedbackCount: Number(data.feedbackCount || 0),
    distribution: data.distribution || {},
    items: Array.isArray(data.items) ? data.items : Array.isArray(data.feedback) ? data.feedback : [],
  };
}
