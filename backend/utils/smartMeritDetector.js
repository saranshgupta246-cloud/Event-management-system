import Registration from "../models/Registration.js";

/**
 * Compute merit suggestions for a set of students in an event.
 * @param {import("mongoose").Types.ObjectId | string} eventId
 * @param {Array<import("mongoose").Types.ObjectId | string>} studentIds
 */
export async function detectMeritSuggestions(eventId, studentIds) {
  if (!eventId || !Array.isArray(studentIds) || studentIds.length === 0) {
    return [];
  }

  const uniqueStudentIds = [...new Set(studentIds.map((id) => String(id)))];

  const registrations = await Registration.find({
    event: eventId,
    user: { $in: uniqueStudentIds },
    status: "confirmed",
  })
    .lean()
    .exec();

  const regByStudent = new Map();
  for (const reg of registrations) {
    const key = String(reg.user);
    regByStudent.set(key, reg);
  }

  function computeAttendanceScore(reg) {
    let percentage;
    if (typeof reg.attendancePercentage === "number") {
      percentage = reg.attendancePercentage;
    } else {
      percentage = reg.attendanceStatus === "present" ? 100 : 0;
    }

    if (percentage >= 100) return 40;
    if (percentage >= 80) return 25;
    if (percentage >= 60) return 15;
    return 0;
  }

  function computeQuizScore(reg) {
    const hasQuizField = Object.prototype.hasOwnProperty.call(reg, "quizScore");
    const quizScore = typeof reg.quizScore === "number" ? reg.quizScore : null;

    if (!hasQuizField) {
      return 15;
    }
    if (quizScore === null) {
      return 0;
    }
    if (quizScore >= 90) return 30;
    if (quizScore >= 70) return 20;
    if (quizScore >= 50) return 10;
    return 0;
  }

  function computeSubmissionScore(reg) {
    const hasSubmissionUrl = Object.prototype.hasOwnProperty.call(reg, "submissionUrl");
    const hasProjectUrl = Object.prototype.hasOwnProperty.call(reg, "projectUrl");

    const submissionUrl = reg.submissionUrl;
    const projectUrl = reg.projectUrl;

    const anyFieldExists = hasSubmissionUrl || hasProjectUrl;
    const anySubmitted =
      (typeof submissionUrl === "string" && submissionUrl.trim().length > 0) ||
      (typeof projectUrl === "string" && projectUrl.trim().length > 0);

    if (!anyFieldExists) {
      return 15;
    }
    if (anySubmitted) {
      return 30;
    }
    return 0;
  }

  function buildReason({ attendance, quiz, submission }) {
    const parts = [];
    if (attendance >= 40) {
      parts.push("perfect attendance");
    } else if (attendance >= 25) {
      parts.push("strong attendance");
    } else if (attendance >= 15) {
      parts.push("good attendance");
    } else {
      parts.push("low attendance");
    }

    if (quiz >= 30) {
      parts.push("excellent quiz performance");
    } else if (quiz >= 20) {
      parts.push("good quiz performance");
    } else if (quiz >= 10) {
      parts.push("fair quiz performance");
    } else if (quiz === 15) {
      parts.push("neutral quiz score");
    } else {
      parts.push("no significant quiz score");
    }

    if (submission >= 30) {
      parts.push("project/submission completed");
    } else if (submission === 15) {
      parts.push("no project data (neutral)");
    } else {
      parts.push("no project/submission");
    }

    return parts.join("; ");
  }

  const results = [];

  for (const rawId of uniqueStudentIds) {
    const reg = regByStudent.get(String(rawId));

    if (!reg) {
      results.push({
        studentId: rawId,
        meritScore: 0,
        suggestion: "participation",
        reason: "No registration data found",
        breakdown: {
          attendance: 0,
          quiz: 0,
          submission: 0,
        },
      });
      continue;
    }

    const attendance = computeAttendanceScore(reg);
    const quiz = computeQuizScore(reg);
    const submission = computeSubmissionScore(reg);

    let meritScore = attendance + quiz + submission;
    if (meritScore > 100) {
      meritScore = 100;
    }

    let suggestion;
    if (meritScore >= 85) {
      suggestion = "winner";
    } else if (meritScore >= 60) {
      suggestion = "merit";
    } else {
      suggestion = "participation";
    }

    const breakdown = { attendance, quiz, submission };
    const reason = buildReason(breakdown);

    results.push({
      studentId: rawId,
      meritScore,
      suggestion,
      reason,
      breakdown,
    });
  }

  return results;
}

