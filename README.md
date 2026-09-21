# Recall Lab — STEM Mastery Map Prototype

An interactive front-end prototype for a prerequisite-aware learning product aimed at university STEM students.

## Product thesis

Traditional knowledge graphs show what information is connected. Recall Lab adds a personal mastery layer so learners can see:

- what they understand;
- which prerequisites are blocking progress;
- why a concept is weak;
- what evidence supports each concept; and
- the highest-impact topic to study next.

## Prototype features

- Interactive engineering concept graph
- Mastery, learning, weak and locked states
- Concept inspector with prerequisite navigation
- Evidence/source cards
- Prerequisite-aware study recommendation
- 20-minute personalised study-session modal
- Interactive diagnostic question with feedback
- Knowledge, mastery, path and source view modes
- Responsive desktop, tablet and mobile layouts
- Keyboard and reduced-motion accessibility considerations

## Important scope

This branch is a product prototype. Scores and course data are illustrative and stored in the front-end. Authentication, document processing, AI generation, persistence and billing will require a backend in a later phase.

## Run locally

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.
