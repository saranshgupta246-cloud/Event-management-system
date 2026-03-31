function isValidDate(value) {
  if (!value) return false;
  const time = new Date(value).getTime();
  return Number.isFinite(time);
}

function hasRegistrationClosed(event, normalizedSeatsLeft) {
  if (event?.isRegistrationOpen === false) return true;
  if (isValidDate(event?.registrationEnd) && new Date(event.registrationEnd).getTime() < Date.now()) {
    return true;
  }
  const totalSeats = typeof event?.totalSeats === "number" ? event.totalSeats : 0;
  if (totalSeats > 0 && normalizedSeatsLeft === 0) return true;
  return false;
}

export function getStudentEventDisplayStatus({ event, registration, seatsLeft }) {
  const lifecycleStatus = String(event?.status || "").toLowerCase();
  const registrationStatus = String(registration?.status || "").toLowerCase();
  const normalizedSeatsLeft =
    typeof seatsLeft === "number"
      ? seatsLeft
      : typeof event?.seatsLeft === "number"
      ? event.seatsLeft
      : typeof event?.availableSeats === "number"
      ? event.availableSeats
      : null;
  const isRegistered = registrationStatus === "confirmed" || !!event?.isRegistered;
  const isClosedForRegistration = hasRegistrationClosed(event, normalizedSeatsLeft);

  if (lifecycleStatus === "cancelled") {
    return { key: "cancelled", label: "Cancelled" };
  }
  if (lifecycleStatus === "completed") {
    return { key: "completed", label: "Completed" };
  }
  if (isClosedForRegistration) {
    return { key: "locked", label: "Registration Closed" };
  }
  if (isRegistered && (lifecycleStatus === "ongoing" || lifecycleStatus === "upcoming" || !lifecycleStatus)) {
    return { key: "registered", label: "Registered" };
  }
  if (lifecycleStatus === "ongoing") {
    return { key: "ongoing", label: "Live Now" };
  }
  return { key: "upcoming", label: "Upcoming" };
}

export function canCancelStudentRegistration(registration) {
  const event = registration?.event || {};
  const lifecycleStatus = String(event.status || "").toLowerCase();
  const registrationStatus = String(registration?.status || "").toLowerCase();
  const normalizedSeatsLeft =
    typeof event?.seatsLeft === "number"
      ? event.seatsLeft
      : typeof event?.availableSeats === "number"
      ? event.availableSeats
      : null;
  if (registrationStatus !== "confirmed") return false;
  if (lifecycleStatus === "completed" || lifecycleStatus === "cancelled") return false;
  if (hasRegistrationClosed(event, normalizedSeatsLeft)) return false;
  return true;
}
