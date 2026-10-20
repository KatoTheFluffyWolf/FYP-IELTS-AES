# IELTS AES Writing Lab — Vue Frontend Prototype

A self-contained Vue 3 + Vite UI package based on the supplied IELTS-red wireframes. This updated release keeps the original four writing and assessment screens and adds three **question-management workflows** for UC-21, UC-22 and UC-26.

- **UC-03** — Take Mock Test
- **UC-04** — Practice Writing
- **UC-05** — View Score and Feedback
- **UC-06** — View Changes to Improve Score (UI placeholder)
- **UC-08** — Revise Response
- **UC-09** — Input Essay from Image
- **UC-14** — Manage Progress (dashboard UI)
- **UC-19** — View Improvement Plan (UI placeholder)
- **UC-21** — Suggest New Question (student)
- **UC-22** — Manage Question Bank (admin)
- **UC-26** — Review Question Suggestion (admin)

## Run locally

Install Node.js **20.19+ or 22+** (the included Vite 6 toolchain runs with contemporary supported Node releases).

```bash
npm install
npm run dev
```

Open the local URL from Vite, usually http://localhost:5173.

To build production files:

```bash
npm run build
npm run preview
```

## Implemented prototype features

| Feature | Behavior |
|---|---|
| Shared writing interface | Switch between practice and mock test in left navigation |
| Task types | Task 1 and Task 2 have different word-count recommendations |
| Practice question | Write a custom prompt or browse the learner Question Bank; selecting **Use in Practice** fills the Task 1/2 question and attached visual |
| Question image | Browser-side OCR text extraction with optional Task 1 image attachment |
| Essay image | Browser-side OCR (Tesseract.js), editable correction before insertion |
| Practice timer | Disabled and grey by default, configurable for 20/30/40/60 minutes; auto-submit at expiry |
| Mock test | Must explicitly start; randomly picks a task-specific sample question; fixed 20/40 minute countdown; auto-submit; no drafts or revisions |
| Essay editor | Plain textarea supports long essays; live word count and minimum-word guidance |
| Drafts | Practice drafts are saved in the current browser's localStorage |
| Submission history | Local, demonstrative history and revision chain; previous version never overwritten |
| Results & Feedback (redesigned) | Side-by-side question and read-only essay, estimated overall/criterion bands, interactive criterion tabs, suggestions and practice-only revision actions |
| Progress Dashboard | Task 1/2, 7/30-day/all-time filters, average bands, per-criterion trends, SVG score progress and target-band line |
| Empty progress state | No fabricated performance data by default; explicit **Preview sample data** button displays illustrative trend data |
| Target-band settings | Per-task goals stored locally in your browser, adjustable in 0.5 increments from 1.0 to 9.0 |
| Example result shortcut | Open **My Results → Preview sample result** to examine the assessment design immediately |
| Assessment view | **Sample scores and example feedback only**, explicitly labelled as demonstrative |
| Rewrite preview | Shows where a Qwen-based rewrite and comparison would appear once a backend is connected |
| Responsive layout | Sidebar collapses on small screens |

## Question management (new)

Use the **Student demo / Admin demo** selector in the top-right header to switch between the two example interface roles. **This selector is only a way to preview the UI; it does not authenticate the user or protect admin actions.**

**Student demo → Question Bank (learner view)**
- Uses the same question table, detail panel, filtering, pagination, status indicators and IELTS-red styling as the admin bank.
- Shows only **Active** (published) questions. Drafts and archived questions remain invisible to learners.
- **View** opens the full read-only question and its Task 1 visual. **Use in Practice** switches to the appropriate task and pre-fills the question and any visual in the existing Practice Writing editor, preserving its essay draft.
- Access from the sidebar, or from **Practice Writing → View Question Bank**. The top-right **Suggest a Question** action opens the existing UC-21 submission form.
- For backend integration, pass the selected bank question ID along with submitted essay data. Editing the question text converts it into a custom question, clearing the bank association.

**Student demo → Suggest a Question (UC-21)**
- Task 1 / Task 2 selector, question text, optional topic/source metadata, and Task 1 image upload or visual notes.
- Client-side field validation and an approximate similarity warning against the existing bank. Identical bank questions are blocked in this demo.
- New suggestions get **Pending Review**, and a status list lets you see what happened later.

**Admin demo → Question Bank (UC-22)**
- Search, filter by task/topic/status, paginate, open a question, create/edit, and publish/unpublish.
- Add Task 1 visuals with image preview. Images are resized/compressed in the browser for demo storage.
- **Archive** rather than permanently delete questions; active questions alone feed the practice question picker and mock test assignment. Existing essay submissions retain their question text.

**Admin demo → Review Suggestions (UC-26)**
- Pending/Approved/Rejected queues, selected suggestion inspection, visual preview, approximate duplicate warning, and required-material checks.
- Approving creates a **Draft** bank question and records a demo decision. Publishing it requires a second action in Question Bank.
- Rejecting records an optional reason. Review decisions show demo reviewer and date.

The learner Question Bank can be browsed before submitting a new suggestion, helping avoid duplicates. The queue starts with **two explicitly labelled sample suggestions** so the moderation UI is easy to preview. Enter and submit a new suggestion to test the learner-to-admin flow. Question management data is saved in `localStorage` under `ielts-aes-questions-demo-v1` when browser storage permits; large images may exceed browser storage quotas. A full refresh returns the role selector to Student, but normally keeps question-management changes in the same browser.

## IMPORTANT: what is NOT connected

This is a **frontend-only prototype**. There is **no ASP.NET API, Supabase database, authentication, ModernBERT scoring, or Qwen3-14B feedback/rewrite service** in this package.

Assessment cards show a fixed *example* overall band of 6.5 and sample criterion scores, clearly flagged as UI demonstration data. These are **not essay-dependent or official IELTS scores**.

Session history and editable drafts are stored **only in your current browser**, not securely uploaded to Supabase. Therefore, they are **not suitable for production or sensitive learner submissions**. The temporary OCR image stays in the browser; image attachment is not reliably persisted between page reloads. Clearing browser storage deletes the demo history.

**OCR** is performed with `tesseract.js` in the user's browser. On first use it may download English recognition data, so internet access is required. Results are imperfect, especially with handwritten responses or diagrams; always review the extracted text. The question-image button extracts **visible text**, not a semantic description of a graph.

**Question bank** questions and displayed Task 1 SVG charts are entirely illustrative. The new client-side moderation and role switch are also illustrative; server-side permissions, authoritative duplicate validation, persistent storage, and atomic approval/publication workflows still need implementation.

## Integrating with ASP.NET Core Web API + Python

Start with these backend endpoints (examples, not implemented):

```text
POST   /api/submissions            -> persist practice or completed test attempt
GET    /api/submissions/{id}       -> owned submission and status
GET    /api/submissions            -> submission history
POST   /api/submissions/{id}/revisions -> persist a linked revision
GET    /api/assessments/{id}       -> final/pending/failed scores and feedback
POST   /api/submissions/{id}/improvement -> request illustrative higher-band rewrite
POST   /api/ocr                   -> optional server-side OCR if preferred
GET    /api/questions?task=1      -> learner read-only listing of active standardized questions
GET    /api/questions/{id}         -> learner read-only question details and Task 1 visual
POST   /api/question-suggestions  -> submit learner proposal as pending
GET    /api/admin/questions       -> admin bank with search and status filtering
POST   /api/admin/questions       -> create standardized question
PATCH  /api/admin/questions/{id}  -> edit, publish or archive a question
GET    /api/admin/suggestions     -> review queue
POST   /api/admin/suggestions/{id}/decision -> approve-to-draft or reject
```

Replace the localStorage `history`/`drafts` handling and `mockScores()` in `src/App.vue` with real authenticated REST calls. Use real assessment status responses (`pending`, `complete`, `failed`), and never silently fall back to example scores in production.

Recommended ownership: ASP.NET Core manages business logic and persistence in Supabase PostgreSQL; an internal FastAPI inference service handles model requests. The Vue frontend should communicate with ASP.NET Core, not directly with a private Python model host.

## Project map

```text
src/
  App.vue                         Main navigation, timers, mock flows, local demo history
  style.css                       Shared layout and IELTS-inspired theme
  data/questions.js               Example questions and utility functions
  components/
    ModalShell.vue                 Reusable accessible modal wrapper
    ImageImportModal.vue           OCR and text correction experience
    QuestionChart.vue              Example Task 1 SVG charts
    ProgressDashboard.vue          Progress metrics, chart and goal editor
    ResultsFeedback.vue            Redesigned single-submission assessment view
    QuestionSuggestion.vue         Learner suggestion form and suggestion history
    QuestionBankAdmin.vue          Admin bank list, details, add/edit, archive
    SuggestionReviewAdmin.vue      Admin moderation queue and decisions
    QuestionEditorForm.vue         Shared question form, upload and validation
  data/questionManagement.js       Seeded bank metadata and duplicate heuristics
  question-management.css          New shared admin/learner screen styling
```

This app is an original educational UI concept and is **not affiliated with IELTS, IDP, Cambridge, or the British Council**.

## Earlier improvements retained in this release

- Added **Progress Dashboard** to the left navigation without removing the existing welcome Dashboard.
- Replaced the original result page layout with the newer sketch while preserving pending and empty-attempt states.
- Added an optional one-click **sample result** from **My Results** for UI review; all displayed feedback and band scores remain demo-only.
- Implemented a dependency-free SVG chart in Vue (no charting-library install needed).
- The progress screen shows an **empty state by default** if there is no scored attempt for that task. Use **Preview sample data** explicitly to inspect the layout; never confuse the simulated trend with user performance.
- Current submissions saved by the existing prototype update the chart, filters, averages and criterion figures; since model inference is not connected, the results are still labelled demonstration data.

## GitHub Pages

GitHub displays the repository source files, while **GitHub Pages** serves the actual compiled Vue website. Follow [Vite's GitHub Pages guide](https://vite.dev/guide/static-deploy.html#github-pages), set the `base` in `vite.config.js` to your repository path (e.g. `/ielts-aes/`), and publish the generated `dist/` through GitHub Actions. The default config uses `/` for local development.
