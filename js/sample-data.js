(function (root) {
  function createSampleState() {
    const now = Date.now();
    const daysAgo = (days) => new Date(now - days * 86_400_000).toISOString();
    return {
      version: 1,
      activeCourseId: 'mechatronics-y1',
      selectedConceptId: 'transfer-functions',
      courses: [{
        id: 'mechatronics-y1',
        title: 'Year 1 Mechatronics',
        code: 'MEC101',
        examDate: new Date(now + 42 * 86_400_000).toISOString().slice(0, 10),
        weeklyTargetMinutes: 240,
        concepts: [
          {
            id: 'algebra', name: 'Engineering algebra', description: 'Rearrange equations, manipulate complex expressions and work confidently with functions.',
            importance: 5, initialMastery: 88, lastReviewed: daysAgo(1), x: 12, y: 48,
            source: 'Engineering Mathematics · Chapter 2', notes: 'Strong foundation. Watch sign errors in simultaneous equations.',
            questions: [{ prompt: 'Rearrange V = IR to make R the subject.', options: ['R = V/I', 'R = I/V', 'R = VI'], answer: 0, explanation: 'Divide both sides by I, giving R = V/I.' }]
          },
          {
            id: 'calculus', name: 'Differentiation', description: 'Calculate and interpret rates of change in physical and dynamic systems.',
            importance: 5, initialMastery: 78, lastReviewed: daysAgo(2), x: 33, y: 22,
            source: 'Engineering Mathematics · Chapter 7', notes: 'Power and chain rules are secure; revisit product-rule word problems.',
            questions: [{ prompt: 'Differentiate x³ + 4x with respect to x.', options: ['3x² + 4', '3x + 4', 'x² + 4'], answer: 0, explanation: 'Apply the power rule to x³ and differentiate 4x to obtain 3x² + 4.' }]
          },
          {
            id: 'differential-equations', name: 'Differential equations', description: 'Model systems whose behaviour depends on rates of change.',
            importance: 5, initialMastery: 55, lastReviewed: daysAgo(4), x: 34, y: 72,
            source: 'Control Systems · Lecture 2', notes: 'Practise separating variables and recognising first-order linear equations.',
            questions: [{ prompt: 'What does dy/dt represent?', options: ['The rate of change of y with time', 'The total value of y', 'The area beneath y'], answer: 0, explanation: 'dy/dt is the instantaneous rate at which y changes with time.' }]
          },
          {
            id: 'laplace', name: 'Laplace transforms', description: 'Convert time-domain differential equations into algebraic expressions in the s-domain.',
            importance: 5, initialMastery: 38, lastReviewed: daysAgo(6), x: 55, y: 65,
            source: 'Control Systems · Lecture 3', notes: 'Main gap: transforming derivatives with non-zero initial conditions.',
            questions: [{ prompt: 'What is L{dy/dt} when y(0)=0?', options: ['sY(s)', 'Y(s)/s', 's/Y(s)'], answer: 0, explanation: 'L{dy/dt} = sY(s) − y(0), which becomes sY(s) when y(0)=0.' }]
          },
          {
            id: 'transfer-functions', name: 'Transfer functions', description: 'Represent a system’s output-to-input relationship in the Laplace domain.',
            importance: 5, initialMastery: 42, lastReviewed: daysAgo(3), x: 58, y: 30,
            source: 'Control Systems · Lecture 4, pages 12–19', notes: 'Definition understood. Errors occur while rearranging transformed equations.',
            questions: [{ prompt: 'A transfer function is normally defined as…', options: ['Output divided by input with zero initial conditions', 'Input multiplied by time', 'Output differentiated twice'], answer: 0, explanation: 'G(s) = Y(s)/U(s), assuming zero initial conditions.' }]
          },
          {
            id: 'feedback', name: 'Feedback systems', description: 'Use measured output to alter a system’s future response.',
            importance: 4, initialMastery: 22, lastReviewed: daysAgo(11), x: 79, y: 24,
            source: 'Control Systems · Lecture 5', notes: 'Blocked until transfer functions are more secure.',
            questions: [{ prompt: 'Negative feedback commonly…', options: ['Reduces error', 'Removes the sensor', 'Makes every system unstable'], answer: 0, explanation: 'Negative feedback compares output with the reference and acts to reduce error.' }]
          },
          {
            id: 'pid', name: 'PID control', description: 'Combine proportional, integral and derivative actions to control a system.',
            importance: 5, initialMastery: 10, lastReviewed: null, x: 84, y: 68,
            source: 'Control Systems · Lecture 7', notes: 'Target concept for this learning path.',
            questions: [{ prompt: 'Which PID term responds to accumulated error?', options: ['Integral', 'Proportional', 'Derivative'], answer: 0, explanation: 'The integral term accumulates error over time.' }]
          },
          {
            id: 'circuit-laws', name: 'Circuit laws', description: 'Apply Ohm’s and Kirchhoff’s laws to electrical networks.',
            importance: 4, initialMastery: 72, lastReviewed: daysAgo(5), x: 13, y: 82,
            source: 'Electronics · Week 1', notes: 'KVL strong; practise node-current sign conventions.',
            questions: [{ prompt: 'Kirchhoff’s current law states that…', options: ['Current entering a node equals current leaving it', 'Voltage is always zero', 'Resistance adds in parallel'], answer: 0, explanation: 'Charge conservation means total current into a node equals total current out.' }]
          }
        ],
        relationships: [
          { id: 'r1', from: 'algebra', to: 'calculus', type: 'prerequisite' },
          { id: 'r2', from: 'algebra', to: 'differential-equations', type: 'prerequisite' },
          { id: 'r3', from: 'calculus', to: 'differential-equations', type: 'prerequisite' },
          { id: 'r4', from: 'differential-equations', to: 'laplace', type: 'prerequisite' },
          { id: 'r5', from: 'laplace', to: 'transfer-functions', type: 'prerequisite' },
          { id: 'r6', from: 'transfer-functions', to: 'feedback', type: 'prerequisite' },
          { id: 'r7', from: 'feedback', to: 'pid', type: 'prerequisite' },
          { id: 'r8', from: 'circuit-laws', to: 'feedback', type: 'supports' }
        ],
        attempts: [
          { id: 'a1', conceptId: 'algebra', correct: true, createdAt: daysAgo(1) },
          { id: 'a2', conceptId: 'algebra', correct: true, createdAt: daysAgo(1) },
          { id: 'a3', conceptId: 'calculus', correct: true, createdAt: daysAgo(2) },
          { id: 'a4', conceptId: 'differential-equations', correct: false, createdAt: daysAgo(4) },
          { id: 'a5', conceptId: 'differential-equations', correct: true, createdAt: daysAgo(3) },
          { id: 'a6', conceptId: 'laplace', correct: false, createdAt: daysAgo(3) },
          { id: 'a7', conceptId: 'transfer-functions', correct: false, createdAt: daysAgo(3) },
          { id: 'a8', conceptId: 'circuit-laws', correct: true, createdAt: daysAgo(5) }
        ],
        sessions: [],
        activity: [
          { id: 'activity-1', type: 'course-created', text: 'Started the Year 1 Mechatronics mastery map', createdAt: daysAgo(12) },
          { id: 'activity-2', type: 'diagnostic', text: 'Completed an 8-question baseline diagnostic', createdAt: daysAgo(3) }
        ]
      }]
    };
  }

  root.RecallSampleData = { createSampleState };
})(typeof globalThis !== 'undefined' ? globalThis : this);
