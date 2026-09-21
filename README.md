# Recall Lab — STEM Mastery MVP

Recall Lab is a browser-based, prerequisite-aware study tool for technical students. It turns a course into an editable concept graph, records demonstrated performance, and recommends the next highest-impact topic to study.

This MVP is deliberately local-first: all course and learning data stays in the browser's `localStorage` until the user exports a JSON backup. There is no account, server database, analytics service, or credential collection in this version.

## What works

- Create and switch between courses.
- Add, edit and delete concepts.
- Connect concepts with `prerequisite`, `supports`, `example`, or `contradicts` relationships.
- Prevent circular prerequisite chains.
- Complete short multiple-choice diagnostics.
- Calculate mastery from initial knowledge, weighted attempts, confidence and time-based decay.
- Show prerequisite readiness, locked topics, review status and ranked study recommendations.
- Generate focused 20-minute study sessions and mark them complete.
- Track diagnostic and session activity.
- Export and import a validated JSON backup.
- Reset to realistic Year 1 Mechatronics sample content.
- Use responsive layouts, keyboard controls, visible focus states and reduced-motion preferences.

## Run locally

No build step or dependency install is required.

```bash
python -m http.server 8000
```

Open `http://localhost:8000`.

## Run tests

```bash
node tests/mastery.test.js
node tests/ui.test.js
```

The calculation suite covers mastery, prerequisite readiness, recommendations, session allocation and backup validation. The UI suite checks required screens, controls, accessible labels, unique element IDs and script wiring.

## How mastery works

Each concept has a starting score and a history of scored attempts. Newer attempts receive more weight. Repeated evidence raises confidence, while an overdue concept receives gradual decay. Prerequisite averages determine whether a downstream concept is ready or locked. Recommendations prioritize the combination of knowledge gap, course importance, downstream influence and review urgency.

The model is intentionally understandable rather than opaque. It is a useful MVP heuristic, not a validated assessment of a learner's ability.

## Data and privacy

- Browser storage key: `recall-lab-mvp-v1`
- Export format: versioned JSON containing courses, concepts, relationships, attempts, sessions and activity
- Import behavior: validates the backup shape before replacing local data
- Credentials/tokens: none are requested or stored

Clearing browser storage deletes unexported progress. Export a backup before clearing site data or changing browser/device.

## Deployment safety

Development is isolated on the `codex/functional-mastery-mvp` branch. The live site remains unchanged until the branch is reviewed and merged by Luca.
