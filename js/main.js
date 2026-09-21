const conceptData = {
  algebra: {
    name: 'Algebra', status: 'Mastered', score: 91, label: 'Strong',
    description: 'Manipulate expressions, equations, ratios and functions with confidence.',
    review: 'Reviewed today',
    insight: 'Consistently correct across recent diagnostics. Review is only needed for long-term retention.',
    prereqs: []
  },
  calculus: {
    name: 'Calculus', status: 'Strong foundation', score: 82, label: 'Strong',
    description: 'Reason about rates of change, accumulation and continuous systems.',
    review: 'Reviewed yesterday',
    insight: 'Differentiation is strong. Integration by parts caused one recent error.',
    prereqs: [['algebra', 'Algebra', 91, 'mastered']]
  },
  differential: {
    name: 'Differential equations', status: 'Learning', score: 58, label: 'Developing',
    description: 'Model changing physical systems using equations involving derivatives.',
    review: 'Reviewed 2 days ago',
    insight: 'You can identify equation types, but rearranging and solving first-order examples is inconsistent.',
    prereqs: [['algebra', 'Algebra', 91, 'mastered'], ['calculus', 'Calculus', 82, 'strong']]
  },
  transfer: {
    name: 'Transfer functions', status: 'Needs attention', score: 42, label: 'Developing',
    description: 'Represent a system’s output-to-input relationship in the Laplace domain.',
    review: 'Reviewed 3 days ago',
    insight: 'You understand the definition, but made two mistakes rearranging differential equations.',
    prereqs: [['algebra', 'Algebra', 91, 'mastered'], ['calculus', 'Calculus', 82, 'strong'], ['differential', 'Differential equations', 58, 'learning']]
  },
  feedback: {
    name: 'Feedback systems', status: 'Prerequisite locked', score: 0, label: 'Not assessed',
    description: 'Use measured output to alter a system’s future response.',
    review: 'Waiting on transfer functions',
    insight: 'Complete the transfer-functions checkpoint before beginning this concept.',
    prereqs: [['transfer', 'Transfer functions', 42, 'weak']]
  },
  pid: {
    name: 'PID control', status: 'Target concept', score: 0, label: 'Not assessed',
    description: 'Combine proportional, integral and derivative action to control a system.',
    review: 'Learning path not reached',
    insight: 'Your route passes through differential equations, transfer functions and feedback systems.',
    prereqs: [['transfer', 'Transfer functions', 42, 'weak'], ['feedback', 'Feedback systems', 0, 'locked']]
  }
};

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

function openDialog(id) {
  const dialog = $(id);
  if (dialog && typeof dialog.showModal === 'function') dialog.showModal();
}

function selectConcept(key) {
  const concept = conceptData[key];
  if (!concept) return;

  $$('.concept-node').forEach(node => node.classList.toggle('selected', node.dataset.concept === key));
  $('#concept-name').textContent = concept.name;
  $('#concept-status').textContent = concept.status;
  $('#concept-description').textContent = concept.description;
  $('#concept-score').textContent = concept.score ? concept.score + '%' : '—';
  $('#score-label').textContent = concept.label;
  $('#review-date').textContent = concept.review;
  $('#concept-insight').textContent = concept.insight;
  $('#score-ring').style.setProperty('--score', concept.score);
  $('#prereq-count').textContent = concept.prereqs.length ? concept.prereqs.length + ' linked' : 'Foundation concept';

  const list = $('#prereq-list');
  list.innerHTML = concept.prereqs.length
    ? concept.prereqs.map(([id, name, score, state]) =>
      '<button data-concept="' + id + '"><span class="mini-dot ' + state + '"></span>' +
      name + '<b>' + (score || '—') + (score ? '%' : '') + '</b></button>'
    ).join('')
    : '<p class="empty-state">No prerequisites — this is a foundation concept.</p>';

  $$('[data-concept]', list).forEach(button => button.addEventListener('click', () => selectConcept(button.dataset.concept)));
}

$$('.concept-node').forEach(node => node.addEventListener('click', () => selectConcept(node.dataset.concept)));
$$('#prereq-list [data-concept]').forEach(button => button.addEventListener('click', () => selectConcept(button.dataset.concept)));

$$('[data-mode]').forEach(button => {
  button.addEventListener('click', () => {
    $$('[data-mode]').forEach(item => item.classList.remove('active'));
    button.classList.add('active');
    $('#graph-stage').classList.toggle('links-mode', button.dataset.mode === 'links');
  });
});

const viewCopy = {
  mastery: ['Interactive mastery map', 'Control systems pathway', 'See what you understand, uncover prerequisite gaps, and choose the highest-impact next step.'],
  knowledge: ['Connected knowledge', 'Concept relationships', 'Explore typed links between concepts, notes and evidence across your course.'],
  path: ['Adaptive learning path', 'Route to PID control', 'Follow prerequisites in the right order and avoid studying concepts before you are ready.'],
  sources: ['Evidence map', 'Course sources', 'Trace every concept and generated question back to its supporting material.']
};

$$('.nav-link[data-view]').forEach(button => {
  button.addEventListener('click', () => {
    $$('.nav-link[data-view]').forEach(item => item.classList.remove('active'));
    button.classList.add('active');
    const copy = viewCopy[button.dataset.view];
    $('#graph-eyebrow').textContent = copy[0];
    $('#graph-title').textContent = copy[1];
    $('#view-description').textContent = copy[2];
    $('#graph-stage').dataset.view = button.dataset.view;
  });
});

['#start-study', '#build-session', '#review-concept', '#sidebar-study'].forEach(id => {
  $(id)?.addEventListener('click', () => openDialog('#study-dialog'));
});
$('#diagnostic-button')?.addEventListener('click', () => openDialog('#diagnostic-dialog'));

$('#diagnostic-form')?.addEventListener('submit', event => {
  event.preventDefault();
  const answer = new FormData(event.currentTarget).get('answer');
  const feedback = $('#answer-feedback');
  if (!answer) {
    feedback.textContent = 'Choose an answer first.';
    feedback.className = 'answer-feedback visible';
    return;
  }
  const correct = answer === 'laplace';
  feedback.textContent = correct
    ? 'Correct — the Laplace transform converts derivatives into algebraic terms in s.'
    : 'Not quite. The Laplace transform is used for this conversion.';
  feedback.className = 'answer-feedback visible ' + (correct ? 'correct' : 'incorrect');
});

$('#reset-graph')?.addEventListener('click', () => selectConcept('transfer'));

$('#collapse-sidebar')?.addEventListener('click', () => {
  document.body.classList.toggle('sidebar-collapsed');
  $('#collapse-sidebar').firstChild.textContent = document.body.classList.contains('sidebar-collapsed') ? '› ' : '‹ ';
});

document.addEventListener('keydown', event => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    $('#graph-stage')?.focus();
  }
});
