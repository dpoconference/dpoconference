# DPO Conference — Remaining E2E wiring

Track each phase with ✅ when **frontend + backend** are wired and verified.  
**Rule:** do not start the next phase until the current one is ✅ in this file.

| Status | Meaning |
| --- | --- |
| ⬜ | Not started |
| 🔄 | In progress |
| ✅ | Done and verified |

---

## Phase 1 — Admin CMS (news / resources / threats) ✅

**Gap:** create/update only via API; no admin screens.

**Fixes**
- [x] Admin list endpoints for unpublished + published news, resources, threats
- [x] Admin UI: create/edit/publish news, resources, threat alerts
- [x] Nav link under Delivery / Content

---

## Phase 2 — Admin events create/edit ✅

**Gap:** conference / packages / seminars upsert is API-only.

**Fixes**
- [x] Admin UI to create/edit conference + packages
- [x] Admin UI to create/edit seminars
- [x] Keep existing registration tables

---

## Phase 3 — Conference attendance ✅

**Gap:** seminar “Mark attended” exists; conference regs have no UI button.

**Fixes**
- [x] Mark conference registration attended from admin events UI

---

## Phase 4 — Mentorship matching ✅

**Gap:** apply works; admin match API has no UI.

**Fixes**
- [x] Admin mentorship page: list profiles + match mentor/mentee

---

## Phase 5 — Staff users ✅

**Gap:** `POST /admin/users` has no UI.

**Fixes**
- [x] Admin users page: create ADMIN/STAFF accounts (permission-gated)

---

## Phase 6 — Job publish ✅

**Gap:** employers post jobs; admin publish API has no UI.

**Fixes**
- [x] Admin list unpublished/published jobs + publish/unpublish toggle

---

## Phase 7 — Support ticket threads ✅

**Gap:** open ticket works; no reply thread; admin inbox is contact forms only.

**Fixes**
- [x] Member: view ticket + replies + reply
- [x] Admin: tickets inbox + reply (keep contact messages)
- [x] Staff reply emails member when possible

---

## Phase 8 — Certificates PDF ✅

**Gap:** certificates list only; no download.

**Fixes**
- [x] `GET /portal/certificates/:id.pdf` (or similar)
- [x] Download button on portal certificates page

---

## Phase 9 — Learning materials ✅

**Gap:** `TrainingMaterial` in DB; portal learning only shows enrolment status.

**Fixes**
- [x] Admin attach materials to seminars (or API + UI)
- [x] Portal learning shows materials for enrolled seminars

---

## Phase 10 — Digital card PDF ✅

**Gap:** browser print only; no real downloadable card PDF.

**Fixes**
- [x] Backend PDF for membership card
- [x] Portal card “Download PDF” button

---

## Phase 11 — NDPA data export / delete ✅

**Gap:** `/me/export` and delete-request not in API.

**Fixes**
- [x] `GET /auth/me/export` (JSON download of member data)
- [x] `POST /auth/me/delete-request` (flag + notify admin)
- [x] Portal settings / privacy UI to trigger both

---

## Exit criteria

All phases above are ✅. Core member money flows remain intact. Builds pass on frontend and backend.
