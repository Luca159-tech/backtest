(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MasteryEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const DAY = 86_400_000;

  function clamp(value, min = 0, max = 100) {
    return Math.min(max, Math.max(min, Number(value) || 0));
  }

  function daysSince(value, now = Date.now()) {
    if (!value) return 0;
    return Math.max(0, (now - new Date(value).getTime()) / DAY);
  }

  function conceptAttempts(course, conceptId) {
    return (course.attempts || []).filter((attempt) => attempt.conceptId === conceptId);
  }

  function calculateMastery(course, conceptId, now = Date.now()) {
    const concept = course.concepts.find((item) => item.id === conceptId);
    if (!concept) return 0;
    const attempts = conceptAttempts(course, conceptId).slice(-12);
    const starting = clamp(concept.initialMastery || 0);
    if (!attempts.length) return Math.round(starting);

    let earned = 0;
    let possible = 0;
    attempts.forEach((attempt, index) => {
      const recencyWeight = 1 + index / Math.max(1, attempts.length - 1);
      possible += recencyWeight;
      if (attempt.correct) earned += recencyWeight;
    });
    const accuracy = possible ? (earned / possible) * 100 : starting;
    const practiceConfidence = Math.min(1, attempts.length / 5);
    const blended = starting * (1 - practiceConfidence) + accuracy * practiceConfidence;
    const last = attempts.at(-1)?.createdAt || concept.lastReviewed;
    const decay = Math.max(0.72, 1 - daysSince(last, now) * 0.006);
    return Math.round(clamp(blended * decay));
  }

  function prerequisites(course, conceptId) {
    return (course.relationships || [])
      .filter((edge) => edge.to === conceptId && edge.type === 'prerequisite')
      .map((edge) => course.concepts.find((item) => item.id === edge.from))
      .filter(Boolean);
  }

  function dependants(course, conceptId) {
    return (course.relationships || [])
      .filter((edge) => edge.from === conceptId && edge.type === 'prerequisite')
      .map((edge) => edge.to);
  }

  function readiness(course, conceptId, now = Date.now()) {
    const required = prerequisites(course, conceptId);
    if (!required.length) return 100;
    return Math.round(required.reduce((total, item) => total + calculateMastery(course, item.id, now), 0) / required.length);
  }

  function statusFor(score, ready = 100) {
    if (ready < 55) return 'locked';
    if (score >= 80) return 'mastered';
    if (score >= 60) return 'strong';
    if (score >= 40) return 'learning';
    return 'weak';
  }

  function dueForReview(course, conceptId, now = Date.now()) {
    const concept = course.concepts.find((item) => item.id === conceptId);
    const attempts = conceptAttempts(course, conceptId);
    const last = attempts.at(-1)?.createdAt || concept?.lastReviewed;
    const score = calculateMastery(course, conceptId, now);
    const interval = score >= 85 ? 21 : score >= 70 ? 10 : score >= 50 ? 4 : 1;
    return !last || daysSince(last, now) >= interval;
  }

  function rankRecommendations(course, now = Date.now()) {
    return course.concepts
      .map((concept) => {
        const mastery = calculateMastery(course, concept.id, now);
        const ready = readiness(course, concept.id, now);
        const downstream = dependants(course, concept.id).length;
        const due = dueForReview(course, concept.id, now);
        const priority = (100 - mastery) * (concept.importance || 3) + downstream * 18 + (due ? 24 : 0) + Math.min(ready, 70) * 0.1;
        return { concept, mastery, readiness: ready, downstream, due, priority };
      })
      .filter((item) => item.readiness >= 45 || !prerequisites(course, item.concept.id).length)
      .sort((a, b) => b.priority - a.priority);
  }

  function buildStudySession(course, minutes = 20, now = Date.now()) {
    const ranked = rankRecommendations(course, now).slice(0, 3);
    const allocation = ranked.length === 1 ? [minutes] : ranked.length === 2 ? [12, 8] : [8, 7, 5];
    return {
      id: `session-${now}`,
      createdAt: new Date(now).toISOString(),
      duration: minutes,
      completed: false,
      steps: ranked.map((item, index) => ({
        conceptId: item.concept.id,
        minutes: allocation[index] || 5,
        action: index === ranked.length - 1 ? 'Prove recall' : item.mastery < 45 ? 'Repair the gap' : 'Strengthen the link',
        reason: item.downstream
          ? `Unlocks ${item.downstream} downstream concept${item.downstream === 1 ? '' : 's'}`
          : item.due ? 'Due for retrieval practice' : 'High-value practice'
      }))
    };
  }

  function courseSummary(course, now = Date.now()) {
    if (!course.concepts.length) return { mastery: 0, readiness: 0, due: 0, weak: 0 };
    const scores = course.concepts.map((concept) => calculateMastery(course, concept.id, now));
    const readinessScores = course.concepts.map((concept) => readiness(course, concept.id, now));
    return {
      mastery: Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length),
      readiness: Math.round(readinessScores.reduce((sum, value) => sum + value, 0) / readinessScores.length),
      due: course.concepts.filter((concept) => dueForReview(course, concept.id, now)).length,
      weak: scores.filter((score) => score < 50).length
    };
  }

  function validateBackup(value) {
    if (!value || typeof value !== 'object' || !Array.isArray(value.courses)) return false;
    return value.courses.every((course) =>
      course && typeof course.id === 'string' && typeof course.title === 'string' &&
      Array.isArray(course.concepts) && Array.isArray(course.relationships)
    );
  }

  return {
    clamp,
    calculateMastery,
    prerequisites,
    dependants,
    readiness,
    statusFor,
    dueForReview,
    rankRecommendations,
    buildStudySession,
    courseSummary,
    validateBackup
  };
});
