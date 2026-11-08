# Voice Portfolio Project Instructions

## Project Overview
This is the v12 Voice Portfolio implementation - a voice-first 3D portfolio application built with Three.js, Web Speech API, and Claude AI backend.

## Implementation Requirements

### Core Principles
1. **Follow the 13-phase implementation plan** defined in `v12-voice-portfolio-implementation-plan.md`
2. **Never skip phases** - each phase must pass its acceptance criteria before moving to the next
3. **Load relevant skills before implementation** - identify and read the appropriate skill instructions for each task
4. **Test-driven development** - write tests, implement features, run tests, verify results
5. **Production quality only** - never claim completion without actual verification

### Phase-Based Development
- Current phase must be tracked in `docs/IMPLEMENTATION_PROGRESS.md`
- Acceptance criteria from the plan must be checked and verified
- No phase is complete until all its acceptance criteria genuinely pass
- Report work status honestly: `COMPLETE`, `PARTIAL`, `BLOCKED`, or `NOT_TESTED`

### Skill Usage Rules
Before starting any implementation task:
1. Identify which installed skills are relevant (see `docs/ENGINEERING_SKILL_MATRIX.md`)
2. Read the full SKILL.md content for each relevant skill
3. Apply skill guidelines throughout the implementation
4. Use multiple skills when a task spans different areas

### Quality Standards
- **No fake data or placeholders** in completed features
- **No placeholder functionality** - features must work end-to-end
- **Evidence required** - provide actual test output, not claims
- **Security first** - follow security best practices for API keys, user input, data handling
- **Accessibility mandatory** - WCAG AA compliance, keyboard navigation, screen readers
- **Performance targets** - 60fps desktop, 30fps minimum on mid-range phones

### Technology Stack
- **Frontend**: TypeScript, Vite, Three.js (exact version pinned)
- **3D Graphics**: Three.js for dot-wave terrain and 3D object stage
- **Voice**: Web Speech API (recognition + synthesis)
- **AI Backend**: Claude API (Haiku for fast responses, Sonnet for complex queries)
- **Testing**: Vitest (unit), Playwright (E2E)
- **Hosting**: Vercel/Netlify/Cloudflare Pages with serverless functions

### Installed Skills
The following skills are available and should be loaded when relevant:
- `frontend-design` - Visual design, typography, layout decisions
- `threejs-animation` - Three.js animations and motion systems
- `threejs-geometry` - Procedural geometry and Three.js fundamentals
- `accessibility` - WCAG compliance and a11y audits
- `playwright-best-practices` - E2E testing with Playwright
- `claude-api` - Claude API integration (built-in skill)
- `test-driven-development` - TDD workflow (built-in skill)
- `security-best-practices` - Security patterns (built-in skill)

### Forbidden Actions
- Do NOT skip acceptance criteria verification
- Do NOT claim features work without running actual tests
- Do NOT introduce fake data as "completed" features
- Do NOT move to the next phase until current phase gates pass
- Do NOT commit secrets or API keys
- Do NOT disable security checks or tests

### Progress Tracking
- Update `docs/IMPLEMENTATION_PROGRESS.md` after completing each task
- Track blockers and dependencies
- Document test results and verification evidence
- Maintain honest status reporting

### Verification Requirements
Every completed task must include:
1. Description of what was implemented
2. Test results showing it works
3. Edge cases handled
4. Acceptance criteria verification
5. Any known limitations or technical debt

## Current Status
Project is in **SETUP PHASE** - skills installed, documentation structure being created.
