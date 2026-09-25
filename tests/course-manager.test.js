const assert = require('node:assert/strict');
const courseManager = require('../js/course-manager.js');
const engine = require('../js/mastery-engine.js');

const state = {
  activeCourseId: 'course-a',
  selectedConceptId: 'concept-a',
  courses: [
    { id: 'course-a', title: 'Old title', code: 'OLD', examDate: '', weeklyTargetMinutes: 240, concepts: [{ id: 'concept-a' }], relationships: [], attempts: [], sessions: [] },
    { id: 'course-b', title: 'Second course', code: 'TWO', examDate: '', weeklyTargetMinutes: 180, concepts: [{ id: 'concept-b' }], relationships: [], attempts: [], sessions: [] }
  ]
};

const updated = courseManager.updateCourse(state, 'course-a', {
  title: '  Engineering Mathematics  ', code: ' MEC101 ', examDate: '2027-05-20', weeklyTargetMinutes: '300'
});
assert.equal(updated.title, 'Engineering Mathematics');
assert.equal(updated.code, 'MEC101');
assert.equal(updated.weeklyTargetMinutes, 300);
assert.equal(updated.concepts[0].id, 'concept-a', 'editing must preserve course learning data');
assert.equal(engine.validateBackup(state), true, 'edited state remains export/import compatible');

const removed = courseManager.removeCourse(state, 'course-a');
assert.equal(removed.removed, true);
assert.equal(state.activeCourseId, 'course-b');
assert.equal(state.selectedConceptId, 'concept-b');
assert.equal(engine.validateBackup(state), true, 'state remains backup compatible after deletion');

const blocked = courseManager.removeCourse(state, 'course-b');
assert.deepEqual(blocked, { removed: false, reason: 'last-course' });
assert.equal(state.courses.length, 1, 'the last course must never be deleted');

assert.equal(courseManager.normaliseValues({ title: ' Test ', weeklyTargetMinutes: 5 }).weeklyTargetMinutes, 20);
assert.equal(courseManager.normaliseValues({ title: ' Test ', weeklyTargetMinutes: 5000 }).weeklyTargetMinutes, 2000);

console.log('Course manager tests passed.');
