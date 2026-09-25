(() => {
  'use strict';

  const STORAGE_KEY = 'recall-lab-mvp-v1';
  const engine = window.MasteryEngine;
  const courseManager = window.CourseManager;
  const sample = window.RecallSampleData;
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const uid = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
  const formatDate = (value) => value ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value)) : 'Not scheduled';
  const relativeDate = (value) => {
    if (!value) return 'Not reviewed yet';
    const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000));
    return days === 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days} days ago`;
  };

  let state = loadState();
  let currentView = 'map';
  let pendingSession = null;
  let diagnostic = null;

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (engine.validateBackup(saved)) return saved;
    } catch (error) {
      console.warn('Could not load saved Recall Lab data.', error);
    }
    return sample.createSampleState();
  }

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function activeCourse() {
    return state.courses.find((course) => course.id === state.activeCourseId) || state.courses[0];
  }

  function selectedConcept() {
    const course = activeCourse();
    return course?.concepts.find((concept) => concept.id === state.selectedConceptId) || course?.concepts[0] || null;
  }

  function addActivity(text, type = 'update') {
    const course = activeCourse();
    course.activity ||= [];
    course.activity.unshift({ id: uid('activity'), type, text, createdAt: new Date().toISOString() });
    course.activity = course.activity.slice(0, 100);
  }

  function toast(message, tone = 'success') {
    const region = $('#toast-region');
    const item = document.createElement('div');
    item.className = `toast ${tone}`;
    item.textContent = message;
    region.append(item);
    setTimeout(() => item.remove(), 3200);
  }

  function openDialog(selector) {
    const dialog = $(selector);
    if (dialog && typeof dialog.showModal === 'function') dialog.showModal();
  }

  function switchView(view) {
    currentView = view;
    $$('.nav-link[data-view]').forEach((button) => button.classList.toggle('active', button.dataset.view === view));
    $$('.app-view').forEach((panel) => panel.classList.toggle('active', panel.dataset.panel === view));
    renderAll();
    $('#main-content').focus({ preventScroll: true });
  }

  function relationshipLabel(type) {
    return ({ prerequisite: 'prerequisite for', supports: 'supports', example: 'example of', contradicts: 'contradicts' })[type] || type;
  }

  function renderHeader() {
    const course = activeCourse();
    $('#active-course-title').textContent = course?.title || 'Create a course';
    const menu = $('#course-menu');
    menu.innerHTML = state.courses.map((item) => `<button type="button" role="option" aria-selected="${item.id === state.activeCourseId}" data-course-id="${escapeHtml(item.id)}"><span>${escapeHtml(item.title)}</span><small>${item.concepts.length} concepts</small></button>`).join('') + '<button type="button" data-create-course><span>＋ Create new course</span></button>';
    $$('[data-course-id]', menu).forEach((button) => button.addEventListener('click', () => {
      state.activeCourseId = button.dataset.courseId;
      state.selectedConceptId = activeCourse().concepts[0]?.id || null;
      persist();
      menu.hidden = true;
      renderAll();
    }));
    $('[data-create-course]', menu)?.addEventListener('click', () => { menu.hidden = true; showCourseForm(); });
  }

  function renderWeeklyProgress() {
    const course = activeCourse();
    const weekAgo = Date.now() - 7 * 86_400_000;
    const minutes = (course.sessions || []).filter((session) => session.completed && new Date(session.completedAt).getTime() >= weekAgo).reduce((sum, session) => sum + session.duration, 0);
    const target = course.weeklyTargetMinutes || 240;
    const percent = Math.min(100, Math.round((minutes / target) * 100));
    $('#weekly-percent').textContent = `${percent}%`;
    $('#weekly-progress').textContent = `${minutes}m / ${Math.round(target / 60 * 10) / 10}h`;
    $('#weekly-ring').style.setProperty('--weekly', percent);
  }

  function renderMetrics() {
    const course = activeCourse();
    const summary = engine.courseSummary(course);
    const examDays = course.examDate ? Math.ceil((new Date(course.examDate).getTime() - Date.now()) / 86_400_000) : null;
    const metrics = [
      ['↗', 'Overall mastery', `${summary.mastery}%`, `${course.concepts.length} mapped concepts`, 'green'],
      ['!', 'Needs attention', `${summary.weak} concepts`, `${course.relationships.filter((edge) => edge.type === 'prerequisite').length} prerequisite links`, 'amber'],
      ['◷', 'Reviews due', `${summary.due}`, 'Calculated from retrieval history', 'blue'],
      ['◆', 'Exam horizon', examDays === null ? 'Not set' : examDays < 0 ? 'Passed' : `${examDays} days`, course.code || 'Course plan', 'violet']
    ];
    $('#metric-grid').innerHTML = metrics.map(([icon, label, value, detail, tone]) => `<article class="metric-card"><span class="metric-icon ${tone}">${icon}</span><div><small>${label}</small><strong>${value}</strong><span>${detail}</span></div></article>`).join('');
  }

  function graphEdge(edge, concepts) {
    const from = concepts.find((item) => item.id === edge.from);
    const to = concepts.find((item) => item.id === edge.to);
    if (!from || !to) return '';
    const x1 = from.x * 9;
    const y1 = from.y * 5.2;
    const x2 = to.x * 9;
    const y2 = to.y * 5.2;
    const bend = Math.max(35, Math.abs(x2 - x1) * 0.35);
    const path = `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`;
    return `<path class="edge edge-${escapeHtml(edge.type)}" d="${path}"><title>${escapeHtml(from.name)} ${relationshipLabel(edge.type)} ${escapeHtml(to.name)}</title></path>`;
  }

  function renderGraph() {
    const course = activeCourse();
    $('#graph-title').textContent = `${course.title} pathway`;
    const stage = $('#graph-stage');
    if (!course.concepts.length) {
      stage.innerHTML = '<div class="empty-state large"><strong>Your graph is empty</strong><p>Add the first concept to begin mapping this course.</p><button class="primary-button" type="button" data-empty-add>＋ Add concept</button></div>';
      $('[data-empty-add]', stage)?.addEventListener('click', () => showConceptForm());
      return;
    }
    const edges = course.relationships.map((edge) => graphEdge(edge, course.concepts)).join('');
    const nodes = course.concepts.map((concept) => {
      const mastery = engine.calculateMastery(course, concept.id);
      const ready = engine.readiness(course, concept.id);
      const status = engine.statusFor(mastery, ready);
      return `<button class="concept-node ${status} ${concept.id === state.selectedConceptId ? 'selected' : ''}" style="--x:${concept.x}%;--y:${concept.y}%" data-concept-id="${escapeHtml(concept.id)}" type="button" aria-label="${escapeHtml(concept.name)}, ${mastery}% mastery"><span class="node-dot"></span><small>${status === 'locked' ? 'Prerequisite gap' : status}</small><strong>${escapeHtml(concept.name)}</strong><em>${mastery}%</em></button>`;
    }).join('');
    stage.innerHTML = `<svg class="connections" viewBox="0 0 900 520" preserveAspectRatio="none" aria-hidden="true">${edges}</svg>${nodes}<div class="graph-legend"><span><i class="legend-dot mastered"></i>Mastered</span><span><i class="legend-dot strong"></i>Strong</span><span><i class="legend-dot learning"></i>Learning</span><span><i class="legend-dot weak"></i>Weak</span><span><i class="legend-dot locked"></i>Locked</span></div>`;
    $$('[data-concept-id]', stage).forEach((button) => button.addEventListener('click', () => {
      state.selectedConceptId = button.dataset.conceptId;
      persist();
      renderMap();
    }));
  }

  function renderInspector() {
    const course = activeCourse();
    const concept = selectedConcept();
    const target = $('#inspector');
    if (!concept) {
      target.innerHTML = '<div class="empty-state"><strong>No concept selected</strong><p>Add a concept to inspect mastery and prerequisites.</p></div>';
      return;
    }
    const score = engine.calculateMastery(course, concept.id);
    const ready = engine.readiness(course, concept.id);
    const status = engine.statusFor(score, ready);
    const prerequisites = engine.prerequisites(course, concept.id);
    const connected = course.relationships.filter((edge) => edge.from === concept.id || edge.to === concept.id);
    const attempts = (course.attempts || []).filter((attempt) => attempt.conceptId === concept.id);
    const latest = attempts.at(-1)?.createdAt || concept.lastReviewed;
    target.innerHTML = `
      <div class="inspector-top"><span class="status-pill ${status}">${status}</span><button class="icon-button" type="button" data-edit-concept aria-label="Edit ${escapeHtml(concept.name)}">✎</button></div>
      <h2>${escapeHtml(concept.name)}</h2><p>${escapeHtml(concept.description)}</p>
      <div class="mastery-score"><div class="score-ring" style="--score:${score}"><span>${score}%</span></div><div><small>Calculated mastery</small><strong>${score >= 80 ? 'Secure' : score >= 60 ? 'Building' : 'Needs practice'}</strong><span>Last evidence: ${relativeDate(latest)}</span></div></div>
      <div class="readiness"><div><span>Prerequisite readiness</span><strong>${ready}%</strong></div><progress max="100" value="${ready}">${ready}%</progress></div>
      <section class="detail-section"><div class="section-title"><h3>Prerequisites</h3><span>${prerequisites.length}</span></div><div class="prereq-list">${prerequisites.length ? prerequisites.map((item) => `<button type="button" data-jump-concept="${escapeHtml(item.id)}"><span class="mini-dot ${engine.statusFor(engine.calculateMastery(course, item.id), engine.readiness(course, item.id))}"></span>${escapeHtml(item.name)}<b>${engine.calculateMastery(course, item.id)}%</b></button>`).join('') : '<p class="empty-copy">This is a foundation concept.</p>'}</div></section>
      <section class="detail-section"><div class="section-title"><h3>Connections</h3><span>${connected.length}</span></div><div class="connection-list">${connected.map((edge) => { const otherId = edge.from === concept.id ? edge.to : edge.from; const other = course.concepts.find((item) => item.id === otherId); return `<div><span>${escapeHtml(other?.name || 'Missing concept')} · ${relationshipLabel(edge.type)}</span><button type="button" data-delete-edge="${escapeHtml(edge.id)}" aria-label="Remove connection">×</button></div>`; }).join('') || '<p class="empty-copy">No connections yet.</p>'}</div></section>
      <section class="detail-section"><div class="section-title"><h3>Evidence & notes</h3></div><div class="evidence-card"><strong>${escapeHtml(concept.source || 'No source added')}</strong><p>${escapeHtml(concept.notes || 'Add personal notes to explain what still feels uncertain.')}</p></div></section>
      <button class="primary-button full-width" type="button" data-review-concept>Test this concept →</button>`;
    $('[data-edit-concept]', target)?.addEventListener('click', () => showConceptForm(concept));
    $$('[data-jump-concept]', target).forEach((button) => button.addEventListener('click', () => { state.selectedConceptId = button.dataset.jumpConcept; persist(); renderMap(); }));
    $$('[data-delete-edge]', target).forEach((button) => button.addEventListener('click', () => {
      course.relationships = course.relationships.filter((edge) => edge.id !== button.dataset.deleteEdge);
      addActivity(`Removed a connection from ${concept.name}`, 'graph');
      persist(); renderMap(); toast('Connection removed.');
    }));
    $('[data-review-concept]', target)?.addEventListener('click', () => startDiagnostic([concept.id]));
  }

  function renderRecommendation() {
    const course = activeCourse();
    const next = engine.rankRecommendations(course)[0];
    const target = $('#recommendation');
    if (!next) { target.innerHTML = '<div><h2>Add a concept to receive a recommendation.</h2></div>'; return; }
    target.innerHTML = `<div class="recommendation-icon">✦</div><div><span class="eyebrow">Recommended next</span><h2>Strengthen ${escapeHtml(next.concept.name)}</h2><p>${next.downstream ? `This concept supports ${next.downstream} downstream topic${next.downstream === 1 ? '' : 's'}.` : next.due ? 'It is due for retrieval practice.' : 'It offers the highest current mastery gain.'} Current mastery is ${next.mastery}%.</p></div><div class="impact"><span>Priority score</span><strong>${Math.round(next.priority)}</strong><small>adaptive ranking</small></div><button class="secondary-button" type="button" data-build-session>Build session →</button>`;
    $('[data-build-session]', target)?.addEventListener('click', showSessionPreview);
  }

  function renderMap() {
    renderMetrics(); renderGraph(); renderInspector(); renderRecommendation();
  }

  function renderCourses() {
    const target = $('#course-grid');
    target.innerHTML = state.courses.map((course) => {
      const summary = engine.courseSummary(course);
      return `<article class="course-card ${course.id === state.activeCourseId ? 'active' : ''}"><span class="course-code">${escapeHtml(course.code || 'COURSE')}</span><h2>${escapeHtml(course.title)}</h2><p>${course.concepts.length} concepts · ${course.relationships.length} connections</p><div class="course-progress"><span style="width:${summary.mastery}%"></span></div><div class="course-card-foot"><strong>${summary.mastery}% mastery</strong><span>Exam: ${formatDate(course.examDate)}</span></div><div class="course-card-actions"><button type="button" data-edit-course="${escapeHtml(course.id)}">Settings</button><button type="button" data-open-course="${escapeHtml(course.id)}">${course.id === state.activeCourseId ? 'Open course' : 'Switch to course'}</button></div></article>`;
    }).join('');
    $$('[data-open-course]', target).forEach((button) => button.addEventListener('click', () => { state.activeCourseId = button.dataset.openCourse; state.selectedConceptId = activeCourse().concepts[0]?.id || null; persist(); switchView('map'); }));
    $$('[data-edit-course]', target).forEach((button) => button.addEventListener('click', () => showCourseForm(state.courses.find((course) => course.id === button.dataset.editCourse))));
  }

  function renderDiagnosticCoverage() {
    const course = activeCourse();
    $('#diagnostic-coverage').innerHTML = course.concepts.map((concept) => {
      const score = engine.calculateMastery(course, concept.id);
      const attempts = (course.attempts || []).filter((attempt) => attempt.conceptId === concept.id).length;
      return `<button class="coverage-row" type="button" data-diagnose="${escapeHtml(concept.id)}"><span class="mini-dot ${engine.statusFor(score, engine.readiness(course, concept.id))}"></span><strong>${escapeHtml(concept.name)}</strong><span>${attempts} answer${attempts === 1 ? '' : 's'}</span><b>${score}%</b></button>`;
    }).join('') || '<div class="empty-state">Add concepts before running a diagnostic.</div>';
    $$('[data-diagnose]').forEach((button) => button.addEventListener('click', () => startDiagnostic([button.dataset.diagnose])));
  }

  function renderSessions() {
    const course = activeCourse();
    const sessions = [...(course.sessions || [])].reverse();
    $('#session-list').innerHTML = sessions.length ? sessions.map((session) => `<article class="session-card ${session.completed ? 'completed' : ''}"><div class="session-time"><strong>${session.duration}</strong><span>minutes</span></div><div><span class="eyebrow">${session.completed ? 'Completed' : 'Ready to begin'}</span><h2>${session.steps.map((step) => escapeHtml(course.concepts.find((item) => item.id === step.conceptId)?.name || 'Concept')).join(' · ')}</h2><p>${session.steps.map((step) => `${step.minutes}m ${escapeHtml(step.action.toLowerCase())}`).join(' · ')}</p></div><button class="${session.completed ? 'secondary-button' : 'primary-button'}" type="button" data-complete-session="${escapeHtml(session.id)}" ${session.completed ? 'disabled' : ''}>${session.completed ? 'Done ✓' : 'Complete session'}</button></article>`).join('') : '<div class="empty-state large"><strong>No sessions yet</strong><p>Generate a plan from your current mastery gaps.</p><button class="primary-button" type="button" data-empty-session>Generate session</button></div>';
    $$('[data-complete-session]').forEach((button) => button.addEventListener('click', () => completeSession(button.dataset.completeSession)));
    $('[data-empty-session]')?.addEventListener('click', showSessionPreview);
  }

  function renderActivity() {
    const activity = activeCourse().activity || [];
    $('#activity-list').innerHTML = activity.length ? activity.map((item) => `<div class="timeline-item"><span class="timeline-dot"></span><div><strong>${escapeHtml(item.text)}</strong><span>${formatDate(item.createdAt)} · ${new Date(item.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span></div></div>`).join('') : '<div class="empty-state">No activity recorded yet.</div>';
  }

  function renderAll() {
    if (!activeCourse()) { state = sample.createSampleState(); persist(); }
    renderHeader(); renderWeeklyProgress();
    if (currentView === 'map') renderMap();
    if (currentView === 'courses') renderCourses();
    if (currentView === 'diagnostic') renderDiagnosticCoverage();
    if (currentView === 'sessions') renderSessions();
    if (currentView === 'activity') renderActivity();
  }

  function showConceptForm(concept = null) {
    const form = $('#concept-form');
    form.reset();
    form.elements.id.value = concept?.id || '';
    form.elements.name.value = concept?.name || '';
    form.elements.description.value = concept?.description || '';
    form.elements.importance.value = concept?.importance || 3;
    form.elements.initialMastery.value = concept?.initialMastery || 0;
    form.elements.source.value = concept?.source || '';
    form.elements.notes.value = concept?.notes || '';
    $('#concept-form-title').textContent = concept ? 'Edit concept' : 'Add concept';
    $('#delete-concept').hidden = !concept;
    openDialog('#concept-dialog');
    setTimeout(() => form.elements.name.focus(), 50);
  }

  function showCourseForm(course = null) {
    const form = $('#course-form');
    form.reset();
    form.elements.id.value = course?.id || '';
    form.elements.title.value = course?.title || '';
    form.elements.code.value = course?.code || '';
    form.elements.examDate.value = course?.examDate || '';
    form.elements.weeklyTargetMinutes.value = course?.weeklyTargetMinutes || 240;
    $('#course-form-eyebrow').textContent = course ? 'Course settings' : 'New learning space';
    $('#course-form-title').textContent = course ? `Edit ${course.title}` : 'Create a course';
    $('#save-course').textContent = course ? 'Save changes' : 'Create course';
    const deleteButton = $('#delete-course');
    deleteButton.hidden = !course;
    deleteButton.disabled = Boolean(course && state.courses.length === 1);
    $('#course-delete-hint').hidden = !course || state.courses.length > 1;
    openDialog('#course-dialog');
    setTimeout(() => form.elements.title.focus(), 50);
  }

  function nextPosition(count) {
    const columns = [15, 35, 55, 75, 85];
    const rows = [20, 48, 76];
    return { x: columns[count % columns.length], y: rows[Math.floor(count / columns.length) % rows.length] };
  }

  function saveConcept(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const course = activeCourse();
    const data = new FormData(form);
    const existingId = data.get('id');
    const values = {
      name: data.get('name').trim(), description: data.get('description').trim(), importance: Number(data.get('importance')),
      initialMastery: engine.clamp(data.get('initialMastery')), source: data.get('source').trim(), notes: data.get('notes').trim()
    };
    if (existingId) {
      const concept = course.concepts.find((item) => item.id === existingId);
      Object.assign(concept, values);
      addActivity(`Updated ${values.name}`, 'graph');
    } else {
      const position = nextPosition(course.concepts.length);
      const id = uid('concept');
      course.concepts.push({ id, ...values, ...position, lastReviewed: null, questions: [{ prompt: `Which statement best describes ${values.name}?`, options: [values.description, 'It has no relationship to this course', 'It can only be learned through memorisation'], answer: 0, explanation: values.description }] });
      state.selectedConceptId = id;
      addActivity(`Added ${values.name} to the knowledge graph`, 'graph');
    }
    persist(); $('#concept-dialog').close(); renderAll(); toast('Concept saved.');
  }

  function deleteSelectedConcept() {
    const course = activeCourse();
    const concept = course.concepts.find((item) => item.id === $('#concept-form').elements.id.value);
    if (!concept || !confirm(`Delete ${concept.name} and all its connections?`)) return;
    course.concepts = course.concepts.filter((item) => item.id !== concept.id);
    course.relationships = course.relationships.filter((edge) => edge.from !== concept.id && edge.to !== concept.id);
    course.attempts = (course.attempts || []).filter((attempt) => attempt.conceptId !== concept.id);
    state.selectedConceptId = course.concepts[0]?.id || null;
    addActivity(`Deleted ${concept.name}`, 'graph');
    persist(); $('#concept-dialog').close(); renderAll(); toast('Concept deleted.', 'warning');
  }

  function saveCourse(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const existingId = data.get('id');
    const values = { title: data.get('title'), code: data.get('code'), examDate: data.get('examDate'), weeklyTargetMinutes: data.get('weeklyTargetMinutes') };
    if (existingId) {
      const course = courseManager.updateCourse(state, existingId, values);
      if (!course) { toast('That course could not be found.', 'error'); return; }
      state.activeCourseId = course.id;
      state.selectedConceptId = course.concepts[0]?.id || null;
      addActivity(`Updated course settings for ${course.title}`, 'course-updated');
      persist(); $('#course-dialog').close(); renderAll(); toast('Course settings saved.');
      return;
    }
    const course = { id: uid('course'), ...courseManager.normaliseValues(values), concepts: [], relationships: [], attempts: [], sessions: [], activity: [] };
    state.courses.push(course); state.activeCourseId = course.id; state.selectedConceptId = null;
    addActivity(`Created ${course.title}`, 'course-created');
    persist(); form.reset(); $('#course-dialog').close(); switchView('map'); toast('Course created. Add its first concept.');
  }

  function deleteCourse() {
    const courseId = $('#course-form').elements.id.value;
    const course = state.courses.find((item) => item.id === courseId);
    if (!course) return;
    if (state.courses.length === 1) { toast('Keep at least one course in Recall Lab.', 'warning'); return; }
    const detail = `${course.concepts.length} concept${course.concepts.length === 1 ? '' : 's'}, ${course.relationships.length} connection${course.relationships.length === 1 ? '' : 's'} and its activity`;
    if (!confirm(`Delete ${course.title}? This permanently removes ${detail} from this browser.`)) return;
    const result = courseManager.removeCourse(state, courseId);
    if (!result.removed) { toast('That course could not be deleted.', 'error'); return; }
    persist(); $('#course-dialog').close(); renderAll(); toast(`${course.title} deleted.`, 'warning');
  }

  function wouldCreateCycle(course, from, to) {
    const adjacency = new Map();
    course.relationships.filter((edge) => edge.type === 'prerequisite').forEach((edge) => { if (!adjacency.has(edge.from)) adjacency.set(edge.from, []); adjacency.get(edge.from).push(edge.to); });
    if (!adjacency.has(from)) adjacency.set(from, []);
    adjacency.get(from).push(to);
    const seen = new Set();
    function visit(node, stack = new Set()) {
      if (stack.has(node)) return true;
      if (seen.has(node)) return false;
      seen.add(node); stack.add(node);
      const cycle = (adjacency.get(node) || []).some((next) => visit(next, new Set(stack)));
      return cycle;
    }
    return [...adjacency.keys()].some((node) => visit(node));
  }

  function showRelationshipForm() {
    const course = activeCourse();
    if (course.concepts.length < 2) { toast('Add at least two concepts first.', 'warning'); return; }
    const options = course.concepts.map((concept) => `<option value="${escapeHtml(concept.id)}">${escapeHtml(concept.name)}</option>`).join('');
    const form = $('#relationship-form');
    form.elements.from.innerHTML = options; form.elements.to.innerHTML = options;
    form.elements.from.value = state.selectedConceptId || course.concepts[0].id;
    form.elements.to.value = course.concepts.find((concept) => concept.id !== form.elements.from.value)?.id || course.concepts[1].id;
    openDialog('#relationship-dialog');
  }

  function saveRelationship(event) {
    event.preventDefault();
    const course = activeCourse();
    const data = new FormData(event.currentTarget);
    const from = data.get('from'), to = data.get('to'), type = data.get('type');
    if (from === to) { toast('A concept cannot connect to itself.', 'warning'); return; }
    if (course.relationships.some((edge) => edge.from === from && edge.to === to && edge.type === type)) { toast('That connection already exists.', 'warning'); return; }
    if (type === 'prerequisite' && wouldCreateCycle(course, from, to)) { toast('That prerequisite would create a circular learning path.', 'warning'); return; }
    course.relationships.push({ id: uid('relationship'), from, to, type });
    const fromName = course.concepts.find((item) => item.id === from)?.name;
    const toName = course.concepts.find((item) => item.id === to)?.name;
    addActivity(`Connected ${fromName} to ${toName}`, 'graph');
    persist(); $('#relationship-dialog').close(); renderAll(); toast('Connection added.');
  }

  function diagnosticQueue(ids = null) {
    const course = activeCourse();
    const candidates = ids ? ids.map((id) => course.concepts.find((item) => item.id === id)).filter(Boolean) : engine.rankRecommendations(course).map((item) => item.concept);
    return candidates.filter((concept) => concept.questions?.length).slice(0, 5);
  }

  function startDiagnostic(ids = null) {
    const queue = diagnosticQueue(ids);
    if (!queue.length) { toast('Add a concept with a question first.', 'warning'); return; }
    diagnostic = { queue, index: 0, checked: false, results: [] };
    renderDiagnosticQuestion(); openDialog('#diagnostic-dialog');
  }

  function renderDiagnosticQuestion() {
    const concept = diagnostic.queue[diagnostic.index];
    const question = concept.questions[0];
    $('#diagnostic-progress').textContent = `Question ${diagnostic.index + 1} of ${diagnostic.queue.length} · ${concept.name}`;
    $('#diagnostic-question').textContent = question.prompt;
    $('#diagnostic-options').innerHTML = question.options.map((option, index) => `<label class="answer-option"><input type="radio" name="answer" value="${index}" />${escapeHtml(option)}</label>`).join('');
    $('#answer-feedback').className = 'answer-feedback'; $('#answer-feedback').textContent = '';
    $('#check-answer').textContent = 'Check answer'; diagnostic.checked = false;
  }

  function handleDiagnostic(event) {
    event.preventDefault();
    if (diagnostic.checked) {
      diagnostic.index += 1;
      if (diagnostic.index >= diagnostic.queue.length) { finishDiagnostic(); return; }
      renderDiagnosticQuestion(); return;
    }
    const answer = new FormData(event.currentTarget).get('answer');
    if (answer === null) { toast('Choose an answer first.', 'warning'); return; }
    const concept = diagnostic.queue[diagnostic.index];
    const question = concept.questions[0];
    const correct = Number(answer) === question.answer;
    activeCourse().attempts.push({ id: uid('attempt'), conceptId: concept.id, correct, createdAt: new Date().toISOString() });
    concept.lastReviewed = new Date().toISOString();
    diagnostic.results.push({ conceptId: concept.id, correct }); diagnostic.checked = true;
    const feedback = $('#answer-feedback'); feedback.className = `answer-feedback visible ${correct ? 'correct' : 'incorrect'}`;
    feedback.textContent = `${correct ? 'Correct.' : 'Not quite.'} ${question.explanation}`;
    $('#check-answer').textContent = diagnostic.index === diagnostic.queue.length - 1 ? 'Finish diagnostic' : 'Next question';
    persist();
  }

  function finishDiagnostic() {
    const correct = diagnostic.results.filter((item) => item.correct).length;
    addActivity(`Completed a ${diagnostic.results.length}-question diagnostic: ${correct}/${diagnostic.results.length} correct`, 'diagnostic');
    persist(); $('#diagnostic-dialog').close(); diagnostic = null; renderAll(); toast(`Diagnostic complete: ${correct} correct.`);
  }

  function showSessionPreview() {
    const course = activeCourse();
    if (!course.concepts.length) { toast('Add concepts before building a session.', 'warning'); return; }
    pendingSession = engine.buildStudySession(course, 20);
    $('#session-preview').innerHTML = pendingSession.steps.map((step, index) => { const concept = course.concepts.find((item) => item.id === step.conceptId); return `<div class="session-step"><span>0${index + 1} · ${step.minutes} min</span><div><strong>${escapeHtml(step.action)}: ${escapeHtml(concept?.name || 'Concept')}</strong><p>${escapeHtml(step.reason)}</p></div></div>`; }).join('');
    openDialog('#session-dialog');
  }

  function saveSession(event) {
    event.preventDefault(); if (!pendingSession) return;
    activeCourse().sessions.push(pendingSession);
    addActivity('Generated a new 20-minute adaptive study session', 'session');
    persist(); $('#session-dialog').close(); pendingSession = null; switchView('sessions'); toast('Study session added.');
  }

  function completeSession(id) {
    const course = activeCourse();
    const session = course.sessions.find((item) => item.id === id);
    if (!session || session.completed) return;
    session.completed = true; session.completedAt = new Date().toISOString();
    session.steps.forEach((step) => course.attempts.push({ id: uid('practice'), conceptId: step.conceptId, correct: true, createdAt: session.completedAt, source: 'study-session' }));
    addActivity(`Completed a ${session.duration}-minute study session`, 'session');
    persist(); renderAll(); toast('Session completed. Mastery updated.');
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = `recall-lab-backup-${new Date().toISOString().slice(0, 10)}.json`; link.click();
    URL.revokeObjectURL(url); toast('Backup exported.');
  }

  async function importData(event) {
    const file = event.target.files[0]; if (!file) return;
    try {
      const value = JSON.parse(await file.text());
      if (!engine.validateBackup(value)) throw new Error('Invalid Recall Lab backup');
      if (!confirm('Replace the current local data with this backup?')) return;
      state = value; state.activeCourseId = state.activeCourseId || state.courses[0]?.id; state.selectedConceptId = state.selectedConceptId || activeCourse()?.concepts[0]?.id;
      persist(); renderAll(); switchView('map'); toast('Backup imported.');
    } catch (error) { toast('That file is not a valid Recall Lab backup.', 'error'); }
    event.target.value = '';
  }

  function bindEvents() {
    $$('.nav-link[data-view]').forEach((button) => button.addEventListener('click', () => switchView(button.dataset.view)));
    $('#course-switcher').addEventListener('click', () => { $('#course-menu').hidden = !$('#course-menu').hidden; });
    document.addEventListener('click', (event) => { if (!event.target.closest('#course-switcher') && !event.target.closest('#course-menu')) $('#course-menu').hidden = true; });
    $('#quick-add').addEventListener('click', () => showConceptForm()); $('#add-concept').addEventListener('click', () => showConceptForm());
    $('#add-relationship').addEventListener('click', showRelationshipForm);
    $('#start-diagnostic').addEventListener('click', () => startDiagnostic()); $('#diagnostic-page-start').addEventListener('click', () => startDiagnostic());
    $('#generate-session').addEventListener('click', showSessionPreview); $('#create-course').addEventListener('click', () => showCourseForm());
    $('#course-form').addEventListener('submit', saveCourse); $('#delete-course').addEventListener('click', deleteCourse); $('#concept-form').addEventListener('submit', saveConcept); $('#delete-concept').addEventListener('click', deleteSelectedConcept);
    $('#relationship-form').addEventListener('submit', saveRelationship); $('#diagnostic-form').addEventListener('submit', handleDiagnostic); $('#session-form').addEventListener('submit', saveSession);
    $('#export-data').addEventListener('click', exportData); $('#import-data').addEventListener('change', importData);
    $('#reset-data').addEventListener('click', () => { if (!confirm('Erase local changes and restore the sample course?')) return; state = sample.createSampleState(); persist(); switchView('map'); toast('Sample data restored.'); });
    document.addEventListener('keydown', (event) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); showConceptForm(); } });
  }

  bindEvents(); renderAll();
})();
