# RCF-Web Repair Log

## Meta
- Project: `rcf-web`
- Source baseline: `AUDIT.md` (dated 2026-02-25)
- Log initialized: 2026-02-25
- Current phase: Implementation wave #1

## Status Legend
- `done`: Implemented in code
- `in_progress`: Partially implemented, follow-up needed
- `todo`: Not implemented yet
- `blocked`: Cannot verify due environment/runtime limitation

## Task Ledger

| ID | Priority | Item | Status | Notes | Updated |
|---|---|---|---|---|---|
| H1 | High | Restrict CORS origins | done | `main.py` now reads `CORS_ALLOWED_ORIGINS`; default localhost allowlist | 2026-02-25 |
| H2 | High | Async task TTL cleanup | done | Added task metadata + expiry + background cleanup loop | 2026-02-25 |
| H3 | High | WebSocket auth | done | Async endpoints return `ws_token`; WS endpoint validates token | 2026-02-25 |
| H4 | High | Material upload persistence | done | Uploads persisted to `backend/data/uploaded_materials` + `materials_index.json` | 2026-02-25 |
| M1 | Medium | Stack schema validation | done | Positive thickness + `Literal` thickness type + material name validator | 2026-02-25 |
| M2 | Medium | Compute request range validation | done | Added model validators for energy/search bounds | 2026-02-25 |
| M3 | Medium | Remove detector cutoff magic numbers | done | Replaced hardcoded `29/7` with `config.py` constants | 2026-02-25 |
| M4 | Medium | Linear design search optimization | done | Two-stage coarse/fine search replaces pure brute-force path | 2026-02-25 |
| M5 | Medium | Event-driven WS updates | done | `asyncio.Event` update signaling, timeout fallback | 2026-02-25 |
| M6 | Medium | Frontend WS error feedback | done | Added `ElMessage` error/warning messaging | 2026-02-25 |
| M7 | Medium | Stable cutoff mapping on reorder | done | Added `layer_id` in models/results and frontend mapping fallback | 2026-02-25 |
| M8 | Medium | Split oversized linear design component | done | Split into `LinearDesignParams/Detectors/Results` components | 2026-02-25 |
| M9 | Medium | Nginx compression/TLS readiness | in_progress | Added gzip + TLS template comments; no certificate pipeline yet | 2026-02-25 |
| M10 | Medium | Backend container hardening | done | Dockerfile now non-root + healthcheck | 2026-02-25 |
| L1 | Low | Test deps/version improvements | in_progress | Added `pytest` to requirements; full dependency pinning pending | 2026-02-25 |
| L2 | Low | Plotly TS typing | done | Added `@types/plotly.js` dev dependency | 2026-02-25 |
| L3 | Low | Extend backend tests | done | Expanded API tests for async/ws/validation/material upload/linear design | 2026-02-25 |
| L4 | Low | CSV precheck in upload UI | done | File extension + basic content precheck before upload | 2026-02-25 |
| L5 | Low | Configurable WS URL | done | Added `VITE_WS_BASE_URL` support | 2026-02-25 |
| L6 | Low | i18n type safety | done | Locale map now const-typed in `useLocale.ts` | 2026-02-25 |
| L7 | Low | Compose resource/logging config | done | Added logging limits + resource stanza + backend data volume | 2026-02-25 |
| L8 | Low | WS reconnect strategy | done | Exponential backoff reconnect (max 5 retries) | 2026-02-25 |

## Interface Changes
- `POST /api/v1/compute/energy-scan/async` and `.../linear-design/async` now return:
  - `task_id`
  - `ws_token`
  - `expires_at`
- `WS /api/v1/ws/compute/{task_id}` now requires query token:
  - `?token=<ws_token>`
- `StackLayer` and `RCFResult` now support `layer_id`.
- `POST /api/v1/materials/upload-pstar` now accepts `replace` form field.

## Validation Notes
- Syntax check: `python -m compileall backend` passed.
- Backend tests: `python -m pytest tests/test_api.py -q` passed (`14 passed`).
- Frontend build: `npm run build` passed (with bundle size warnings only).

## Follow-up Checklist
1. Decide certificate management strategy for production TLS (M9 remaining piece).
2. Optional: reduce frontend bundle size via chunk splitting (build warning).
3. Optional: suppress low-energy physics warnings in CI test output if needed.

## Incremental Fixes (Post-Review)
- 2026-02-25:
  - Fixed unhandled mounted error path in `MaterialButtons.refreshMaterials` (added error handling + UI message).
  - Fixed async cancel/reconnect race in `useComputation.cancelComputation` by stopping computation before closing websocket.
  - Re-verified frontend build: `npm run build` passed.
