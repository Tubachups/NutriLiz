w# AGENTS.md

Purpose: provide agents with a reliable project map before making code changes.

## Read-First Workflow (Required)

Before any agentic coding task:
1. Read this file first.
2. Read `README.md` for product context, stack, and runtime notes.
3. Confirm target app/folder before editing.
4. Prefer minimal, scoped edits in the selected app only.
5. Run relevant checks/tests for only the edited area when possible.

## Workspace Map

Root project: NutriLiz

Primary folders:
- `backend/`: Flask API, barcode integration, food recognition, recommendations, risk assessment.
- `fe-web/`: main React + Vite web app (TanStack Router).
- `fe-mob/`: main Expo React Native mobile app.

Additional folders in repo:
- `nutriliz-be/`: backend variant/copy. Treat as separate from `backend/`.
- `fe-web-comp/`: web variant (separate from `fe-web/`).
- `fe_web_reset_pass/`: focused reset-password web frontend variant.

## Folder Selection Rules

- Backend/API work: default to `backend/` unless the user explicitly asks for `nutriliz-be/`.
- Web app features/fixes: default to `fe-web/` unless the user explicitly asks for another web folder.
- Mobile features/fixes: use `fe-mob/`.
- Do not mirror the same change across variant folders unless requested.

## Common Entry Points

Backend:
- `backend/app.py`
- `backend/barcode.py`
- `backend/food_recognition.py`
- `backend/recommend.py`
- `backend/risk_assessment.py`

Web (main):
- `fe-web/src/main.jsx`
- `fe-web/src/routes/`
- `fe-web/src/components/`
- `fe-web/src/hooks/`

Mobile:
- `fe-mob/app/_layout.jsx`
- `fe-mob/app/(tabs)/`
- `fe-mob/app/(admin-tabs)/`
- `fe-mob/app/components/`
- `fe-mob/hooks/`

## Environment and Dependencies

Backend:
- Python dependencies in `backend/requirements.txt`
- Local virtual environment often at `backend/.venv`

Frontend:
- Each frontend has its own `package.json` and dependencies
- Install and run commands from the specific frontend folder

## Agent Safety Notes

- Keep edits localized to the chosen target folder.
- Avoid broad refactors across multiple app variants.
- If request is ambiguous about target folder, ask first.
- Preserve existing API contracts unless change request requires contract updates.

## Quick Task Routing

- Auth/UI issue on mobile screens: `fe-mob/`
- Router/pages/components issue on web dashboard: `fe-web/`
- Barcode scan/API/data response issue: `backend/`
- Admin endpoint logic issue: `backend/admin.py`

## Definition of Done

For any change:
1. Correct folder targeted.
2. Code compiles/lints/tests for the changed area when feasible.
3. No unrelated files modified.
4. Brief summary includes changed files and verification done.
