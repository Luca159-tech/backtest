const assert = require('node:assert/strict');
const engine = require('../js/mastery-engine.js');

const now = new Date('2026-09-21T12:00:00Z').getTime();
const course = {
  concepts: [
    { id: 'foundation', name: 'Foundation', initialMastery: 80, importance: 5, lastReviewed: '2026-09-20T12:00:00Z' },
    { id: 'target', name: 'Target', initialMastery: 20, importance: 5, lastReviewed: '2026-09-01T12:00:00Z' }
  ],
  relationships: [{ id: 'r1', from: 'foundation', to: 'target', type: 'prerequisite' }],
  attempts: [
    { conceptId: 'foundation', correct: true, createdAt: '2026-09-20T12:00:00Z' },
    { conceptId: 'foundation', correct: true, createdAt: '2026-09-21T10:00:00Z' },
    { conceptId: 'target', correct: false, createdAt: '2026-09-20T12:00:00Z' }
  ]
};

assert.ok(engine.calculateMastery(course, 'foundation', now) > engine.calculateMastery(course, 'target', now));
assert.equal(engine.prerequisites(course, 'target')[0].id, 'foundation');
assert.ok(engine.readiness(course, 'target', now) >= 80);
assert.equal(engine.statusFor(20, 40), 'locked');
assert.equal(engine.statusFor(85, 100), 'mastered');
assert.equal(engine.rankRecommendations(course, now)[0].concept.id, 'target');

const session = engine.buildStudySession(course, 20, now);
assert.equal(session.duration, 20);
assert.equal(session.steps.reduce((sum, step) => sum + step.minutes, 0), 20);
assert.equal(session.completed, false);

assert.equal(engine.validateBackup({ courses: [course] }), false, 'course requires id and title');
assert.equal(engine.validateBackup({ courses: [{ ...course, id: 'c1', title: 'Course' }] }), true);
assert.equal(engine.validateBackup({ nope: true }), false);

console.log('Mastery engine tests passed.');
