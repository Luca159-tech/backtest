(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CourseManager = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function normaliseValues(values) {
    const minutes = Number(values.weeklyTargetMinutes);
    return {
      title: String(values.title || '').trim(),
      code: String(values.code || '').trim(),
      examDate: String(values.examDate || ''),
      weeklyTargetMinutes: Math.min(2000, Math.max(20, Number.isFinite(minutes) ? Math.round(minutes) : 240))
    };
  }

  function updateCourse(state, courseId, values) {
    const course = state?.courses?.find((item) => item.id === courseId);
    if (!course) return null;
    Object.assign(course, normaliseValues(values));
    return course;
  }

  function removeCourse(state, courseId) {
    if (!state?.courses || state.courses.length <= 1) return { removed: false, reason: 'last-course' };
    const index = state.courses.findIndex((course) => course.id === courseId);
    if (index < 0) return { removed: false, reason: 'not-found' };
    const [course] = state.courses.splice(index, 1);
    if (state.activeCourseId === courseId || !state.courses.some((item) => item.id === state.activeCourseId)) {
      const next = state.courses[Math.min(index, state.courses.length - 1)];
      state.activeCourseId = next.id;
      state.selectedConceptId = next.concepts?.[0]?.id || null;
    }
    return { removed: true, course };
  }

  return { normaliseValues, updateCourse, removeCourse };
});
