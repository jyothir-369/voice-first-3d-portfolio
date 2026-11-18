# Phase 0 Source-of-Truth Audit

**Date**: 2026-11-16
**Scope**: Verify what Phase 7 needs before implementation starts.
**Rule applied**: Every claim classified as VERIFIED, USER-CONFIRMED, NEEDS SOURCE, or NEEDS INPUT. No fabrication.

## Classification key

- **VERIFIED** — found in repository evidence (GitHub-derived files, build-time validator output, committed tests)
- **USER-CONFIRMED** — stated by the owner in this session or recorded as user-provided in Phase 0 reports
- **NEEDS SOURCE** — claim exists in content/ but no repository evidence can back it
- **NEEDS INPUT** — field literally contains "NEEDS INPUT" or equivalent placeholder

---

## 1. Identity and contact (Phase 7 task 1, 6)

| Claim | Value | Classification | Evidence |
|---|---|---|---|
| Full name | Jyothir Raghavalu Bhogi | USER-CONFIRMED | This session; content/profile.json; api/prompt.ts persona line |
| Location | Hyderabad, Telangana, India | USER-CONFIRMED | profile.json; faq.json q15 |
| Email | jyothirraghavalu369@gmail.com | USER-CONFIRMED | profile.json; faq.json q8 spoken/caption |
| GitHub | https://github.com/jyothir-369 | VERIFIED | profile.json githubStats; 8 project URLs point at this org |
| LinkedIn | https://www.linkedin.com/in/bhogi-jyothir-raghavalu/ | USER-CONFIRMED | This session + profile.json (URL without trailing slash) |
| Portfolio | https://jyothir-369.github.io/BJR/ | VERIFIED | profile.json |
| Twitter/X | https://twitter.com/BhogiJyothir | VERIFIED | profile.json (self-reported; not independently checked) |
| LeetCode | https://leetcode.com/u/jyothir-369 | VERIFIED | profile.json (self-reported) |

**Note**: `api/prompt.ts:91` still references `hello@aarav.dev` — stale placeholder from the v12 demo persona. Must be replaced with the real email before Phase 7 ships.

## 2. Education (Phase 7 task 1)

| Claim | Value | Classification | Evidence |
|---|---|---|---|
| Degree | B.Tech, Computer Science & Engineering | USER-CONFIRMED | profile.json; faq.json q7; Phase 0 report |
| Institution | Lovely Professional University (LPU) | USER-CONFIRMED | profile.json; faq.json q7 |
| Dates | July 2022 – May 2026 | USER-CONFIRMED | profile.json startDate/graduationDate |
| Status | completed | USER-CONFIRMED | profile.json education.status |

No age, birth year, or personal-journey facts are recorded, and the plan's Phase 0 exclusion list bans inventing them. The "tell me about yourself" answer (faq.json q6) is an honest professional summary, not a personal story — acceptable per Phase 5 report decision.

## 3. Experience (Phase 7 task 1)

| Claim | Value | Classification | Evidence |
|---|---|---|---|
| flickDone role | Data Engineer Intern | USER-CONFIRMED | profile.json; results.json; faq.json q4/q11 |
| flickDone dates | June–August 2025 | USER-CONFIRMED | profile.json; results.json |
| flickDone records | 50,000+ records processed | USER-CONFIRMED | results.json metrics.flickdone; faq.json q5 |
| flickDone verification cut | 70% reduction in manual verification | USER-CONFIRMED | results.json; faq.json q5 |
| flickDone speed | 25% pipeline speed improvement | USER-CONFIRMED | results.json; faq.json q5 |
| Know AI role | AI Intern | USER-CONFIRMED | profile.json; faq.json q4 |
| Know AI dates | June–August 2026 | USER-CONFIRMED | profile.json; faq.json q4 |
| Know AI responsibilities | — | NEEDS INPUT | profile.json lines 31-33; results.json lines 31-32 |
| Braille pipeline location | "Built during my flick Done internship" | USER-CONFIRMED | faq.json q12 spoken |

## 4. Projects (Phase 7 task 1)

All 13 projects in projects.json carry GitHub URLs under jyothir-369 and descriptive copy derived from repo inspection (Phase 0 report, "GitHub repositories analysis"). Star counts are self-reported GitHub API data (VERIFIED as data, not as achievement).

| Claim | Classification | Note |
|---|---|---|
| 8 featured + 5 other project descriptions | VERIFIED | projects.json, sourced from repo inspection |
| All per-project metrics (accuracy, users, latency, fps, IoU, documents, tickets) | NEEDS INPUT | literally "NEEDS INPUT" in projects.json |
| Ledgerly "174 tests across 21 suites" | NEEDS SOURCE | results.json line 69: repo cannot be located; do not ship this number |
| "Ledgerly" as a project name | NEEDS SOURCE | not in projects.json; only appears in results.json notes |

## 5. Achievements and recognition (Phase 7 task 1)

| Claim | Value | Classification | Evidence |
|---|---|---|---|
| Hackathon 2025, 1st place | win confirmed | USER-CONFIRMED | results.json; GitHub bio per Phase 0 report |
| Hackathon event name, project, team | - | NEEDS INPUT | results.json lines 9-11 |
| Driver Fatigue Detection, 96.8%, IEEE manuscript | exists in skills.json | NEEDS SOURCE | skills.json lines 122-129; status "Published/In-Progress" unresolved; exclusion rules ban research content |
| Certifications, speaking, testimonials | - | NEEDS INPUT | results.json lines 99-102 |

Exclusion rules still in force (owner request, Phase 0 reports): no research papers/manuscripts, no CAT AI project, no Kiddo AI project, no age/birth year. The skills.json publication entry conflicts with the "no research" exclusion - flag for owner decision; do not surface it in Phase 7 UI.

## 6. Stale demo-persona leaks found in code (must fix in Phase 7)

These reference the fictional "Aarav Sharma" prototype persona, not the owner:

| File:line | Content | Severity |
|---|---|---|
| index.html:14 | `<b class="dot">AARAV SHARMA<span>♑︎</span></b>` | BLOCKER - visible name on every page |
| index.html:44 | "Ask me out loud about Aarav's AI products..." | BLOCKER - visible copy |
| src/main.ts:266 | chip label 'Tell me about Aarav' | BLOCKER - visible chip |
| src/engine/knowledge.ts:7,43,49,50,56,57 | fallback answers say "Aarav builds...", "Aarav is twenty one...", "hello@aarav.dev", "Aarav builds around all five" | BLOCKER - spoken fallback content |
| src/engine/knowledge.ts:42 | keyword `who about aarav yourself...` | HIGH - routes "tell me about yourself" via stale name |
| src/stage/cues.ts:19,20 | `hello@aarav.dev` cue, `AARAV` person label | HIGH - 3D stage labels |
| api/prompt.ts:91 | system prompt offers `hello@aarav.dev` as contact route | BLOCKER - AI will state a wrong email |

The `portfolio-demo-v12-voice.html` file also contains the old persona, but it is the preserved prototype reference, not shipped code; leave it untouched.

## 7. Phase 0 acceptance criteria status (from the plan, section Phase 0)

| Criterion | Status | Evidence |
|---|---|---|
| Every number on the site can be backed by a source you can show | PARTIAL | flickDone metrics USER-CONFIRMED; GitHub stats VERIFIED; per-project metrics NEEDS INPUT; Ledgerly 174-tests claim NEEDS SOURCE and must not ship |
| No placeholder text remains in the content files | FAIL | "NEEDS INPUT" markers remain in profile.json (Know AI), projects.json (all metrics), results.json (hackathon details, Know AI, Ledgerly, certifications), skills.json (Kubernetes, Airflow/Spark, Tailwind, editors, collaboration, IEEE notes), VOICE_PERSONA_GUIDE.md (persona decision, personal story) |
| You have read every spoken answer out loud and none feels awkward | UNVERIFIED | Never performed; Phase 0 report called it CONDITIONAL PASS pending Phase 2 voice implementation |

## 8. Verdict for Phase 7 prerequisites

Phase 7 (Content, UI polish and branding) has three hard prerequisites from its own acceptance criteria:
1. "No placeholder or lorem text anywhere" - currently FALSE (section 7).
2. "The email address can be copied, tapped and opened by every route" - the real email exists in content/ (USER-CONFIRMED), but stale `hello@aarav.dev` strings in index.html, knowledge.ts, cues.ts and api/prompt.ts must be replaced first (section 6).
3. "Both themes pass a visual review on desktop and phone" - requires the persona leaks fixed before screenshots are meaningful.

Remaining gaps that are genuinely needed for Phase 7 AC1 (no placeholders):
- Know AI responsibilities/tech/achievements (profile.json, results.json)
- Per-project metrics in projects.json (optional metrics may be OMITTED rather than fabricated - the validator only rejects placeholder strings, absent optional fields are fine if schema allows; confirm during implementation)
- Hackathon event name/project/team (results.json)
- IEEE manuscript decision: keep excluded (recommended, matches exclusion rules) or document status
- skills.json NEEDS INPUT entries: Kubernetes, Airflow/Spark, CI/CD tool, Tailwind, editors, collaboration tools

None of these block Phase 7 if the owner confirms they should be omitted rather than invented; the exclusion rules and "no fake data" standard make omission the only safe default.

## 9. Legacy knowledge module (src/engine/knowledge.ts)

- Imported by conversation.ts line 2 and re-exported at line 101 ("legacy exports for existing tests"), but respond() never calls scoreQuestion/getTopic/getNextTopicIndex - the live path is routeIntent -> knowledge-base.ts -> content/faq.json.
- tests/unit/knowledge.test.ts tests only structure/scoring, not answer text, so no test asserts the fictional content.
- The 9 TOPICS answers are fabricated demo data (Orbit, Autopilot, Plantly, KhataKit, NotesNest, 12k users, Rs 18L, 99.9% uptime, 312 tests, pre-seed at 19, team of six, "Aarav is twenty one"). Every one violates the "no fake data" standard.
- Classification: DEMO PLACEHOLDER DATA, must be removed or fully replaced in Phase 7. It is not reachable via respond(), so removal is low-risk; the knowledge.test.ts assertions only exercise scoring/structure and will be updated to match.

## 10. Audit conclusion

Phase 7 is NOT unblocked yet. Blocking items, in priority order:
1. Remove or replace the 9 fictional TOPICS answers in src/engine/knowledge.ts (plus the persona-name keywords on line 42).
2. Replace every stale "Aarav Sharma" / "hello@aarav.dev" string in index.html, src/main.ts, src/engine/knowledge.ts, src/stage/cues.ts, api/prompt.ts with the owner's real name and email (section 6 list).
3. Decide the fate of every NEEDS INPUT marker in content/profile.json, projects.json, results.json, skills.json, VOICE_PERSONA_GUIDE.md: OMIT the field (safe default) or supply a real value. Fabrication is not an option.
4. The Ledgerly "174 tests" claim and the IEEE manuscript entry must not ship without a source.

Owner-provided facts from this session that ARE safe to use now: name, education (B.Tech CSE LPU Jul 2022-May 2026), flickDone and Know AI internships with dates, flickDone metrics (50k+ records, 70% verification reduction, 25% speed improvement), GitHub/LinkedIn URLs, and the project names Ledgerly, Marketplace Order Fulfillment, Support-Ticket Triage Agent. Ledgerly and Marketplace Order Fulfillment are NOT in projects.json - they need repo URLs before they can be featured; Support-Ticket Triage Agent already exists as ticket-triage-agent.

## 11. Resolution (owner instruction 2026-11-16): OMIT ALL UNVERIFIED

Applied changes:

1. content/profile.json - Know AI responsibilities/tech/achievements set to empty arrays (title, org, dates kept).
2. content/results.json - hackathon entry REMOVED; IEEE manuscript REMOVED (research exclusion); Ledgerly 174-tests claim REMOVED; all unverified metrics replaced with 'Omitted at owner request'; metadata lastUpdated and notes updated.
3. content/projects.json - all 18 NEEDS INPUT metric values replaced with 'Omitted at owner request'; Ledgerly name applied to the multi-tenant-saas-invoicing-billing entry; Marketplace Order Fulfillment URL confirmed; lastUpdated bumped.
4. content/skills.json - Kubernetes/Airflow/Spark/CI-CD/editors/collaboration/Tailwind unknowns removed; publications array emptied (research exclusion).
5. content/VOICE_PERSONA_GUIDE.md - persona decision recorded as CONFIRMED first person; personal-story NEEDS INPUT replaced with documented omission; trending-topics note updated to NOT CLAIMED; approval checklist updated.
6. content/CONTENT_DISCOVERY_STATUS.md - status set to RESOLVED with pointer to this audit; historical notes preserved as process record.
7. src/engine/knowledge.ts - all 9 fabricated demo TOPICS removed (array now empty); scoring functions preserved for tests; removal comment added.
8. src/main.ts - question chips replaced with the 15 verified FAQ questions.
9. src/stage/cues.ts - cue table rewritten to verified FAQ vocabulary; demo product names, fabricated metrics (312 tests, pre-seed), Ludhiana-only person label and hello@aarav.dev removed.
10. src/engine/knowledge.ts greeting copy and content/faq.json greeting - third-person 'his' fixed to first-person 'my/me'.
11. index.html - AARAV SHARMA -> JYOTHIR RAGHAVALU BHOGI; 'Aarav's AI products' -> 'my AI projects'.
12. api/prompt.ts - contact email hello@aarav.dev -> jyothirraghavalu369@gmail.com.
13. tests/unit/knowledge.test.ts, tests/unit/stage/cues.test.ts - updated for empty TOPICS and new cue table; both now assert the banned demo strings are absent.

Verification evidence (this session):
- node scripts/validate-content.mjs -> PASSED, 15 FAQ entries valid.
- All 5 content JSON files parse.
- npx vitest run -> 11 files, 240/240 tests passed.
- npm run type-check -> 0 errors.
- npm run lint -> 0 errors, 5 pre-existing warnings (recognizer.ts Web Speech API any).
- npm run build -> SUCCESS (content validation + tsc + vite build); dist/ sweep shows zero 'aarav' matches.
- Sweep of index.html, src/, api/, content/ for Aarav/Orbit/Autopilot/Plantly/KhataKit/NotesNest/pre-seed/312/18L: zero matches in shipped code (only the tests' own banned-string assertions and historical status-doc notes remain).
Phase 0 prerequisites for Phase 7: SATISFIED (verified facts only, no placeholders, real identity, first-person voice, correct contact email, no fabricated demo content in any shipped file).