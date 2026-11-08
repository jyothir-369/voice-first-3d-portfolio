# Engineering Skill Matrix

This document maps the 8 installed skills to the 13 phases of the v12 Voice Portfolio implementation plan.

## Skill Overview

| Skill | Source | Purpose |
|-------|--------|---------|
| `frontend-design` | anthropics/skills | Visual design, typography, layout, color systems |
| `threejs-animation` | cloudai-x/threejs-skills | Three.js animations, keyframes, motion systems |
| `threejs-geometry` | cloudai-x/threejs-skills | Procedural geometry, Three.js fundamentals |
| `accessibility` | addyosmani/web-quality-skills | WCAG compliance, a11y audits, screen readers |
| `playwright-best-practices` | currents-dev | E2E testing patterns and best practices |
| `claude-api` | Built-in | Claude API integration, model selection, streaming |
| `test-driven-development` | Built-in | TDD workflow and testing patterns |
| `security-best-practices` | Built-in | Security patterns, input validation, API safety |

## Phase-to-Skill Mapping

### Phase 0: Discovery and Content (2-3 days)
**Skills**: None (content gathering phase)
- Collect real facts, write questions/answers
- Define voice persona
- No coding yet

### Phase 1: Foundation and Project Setup (2 days)
**Skills**: 
- `test-driven-development` - Set up test infrastructure
- `security-best-practices` - Configure environment variables, secret handling

**Tasks**:
- Initialize Vite + TypeScript project
- Port v12 prototype into modular structure
- Set up CI/CD pipeline
- Configure linting and formatting

### Phase 2: Voice Input and Output Layer (4-5 days)
**Skills**:
- `accessibility` - Voice fallbacks, captions, keyboard controls
- `test-driven-development` - Unit tests for voice components
- `security-best-practices` - Microphone permissions, input validation

**Tasks**:
- Build Recognizer, Speaker, Meter classes
- Implement error handling and fallback modes
- Add accessibility features (captions, keyboard shortcuts)

### Phase 3: 3D Scene - Dot-Wave Terrain (3 days)
**Skills**:
- `threejs-geometry` - Procedural dot generation, positioning
- `threejs-animation` - State-driven motion, amplitude control
- `frontend-design` - Color mapping, visual state differentiation
- `accessibility` - Reduce-motion support, context loss handling

**Tasks**:
- Build terrain module with configurable parameters
- Implement state-to-visual mapping (idle, listening, thinking, speaking)
- Add performance optimizations and adaptive quality
- Handle theme switching and reduce-motion

### Phase 4: 3D Object Stage (4-5 days)
**Skills**:
- `threejs-geometry` - Wireframe object builders
- `threejs-animation` - Object entrance/exit animations, cue timing
- `frontend-design` - Visual language consistency, object design
- `test-driven-development` - Unit tests for cue engine

**Tasks**:
- Build 16+ procedural 3D objects
- Implement cue timing system
- Create object gallery page
- Add memory management and disposal

### Phase 5: Conversation Engine (Rules Layer) (2-3 days)
**Skills**:
- `test-driven-development` - Intent router tests, knowledge base tests
- `security-best-practices` - Input sanitization, injection prevention

**Tasks**:
- Build intent router with ordered rules
- Create knowledge base from content files
- Implement conversation memory
- Add confidence scoring and variety

### Phase 6: AI Backend (Real Answers) (5-6 days)
**Skills**:
- `claude-api` - Model selection, streaming, system prompts
- `security-best-practices` - API key management, rate limiting, prompt injection defense
- `test-driven-development` - 80-question evaluation set

**Tasks**:
- Build `/api/ask` serverless endpoint
- Write system prompt with guardrails
- Implement streaming responses
- Add rate limiting and cost controls

### Phase 7: Content, UI Polish and Branding (3 days)
**Skills**:
- `frontend-design` - Typography, color, layout, visual hierarchy
- `accessibility` - Color contrast, readable text, clear states

**Tasks**:
- Load real content from Phase 0
- Design start screen and controls
- Create branding assets
- Verify both light and dark themes

### Phase 8: Accessibility, Privacy and Legal (2-3 days)
**Skills**:
- `accessibility` - WCAG AA compliance, keyboard navigation, screen reader support
- `security-best-practices` - Privacy controls, data handling

**Tasks**:
- Complete accessibility audit (keyboard, screen readers, contrast)
- Write privacy page and consent notices
- Add typed input alternative
- Document third-party data flows

### Phase 9: Performance and Cross-Browser (3 days)
**Skills**:
- `threejs-animation` - Frame rate optimization
- `threejs-geometry` - Adaptive quality, memory management
- `frontend-design` - Load performance, asset optimization

**Tasks**:
- Tree-shake Three.js imports
- Implement adaptive quality based on device
- Test on browser support matrix
- Meet performance budgets

### Phase 10: Testing and Quality Assurance (3-4 days)
**Skills**:
- `test-driven-development` - Test strategy, coverage
- `playwright-best-practices` - E2E test patterns
- `accessibility` - Automated and manual a11y testing
- `security-best-practices` - Security testing

**Tasks**:
- Write unit tests (Vitest)
- Write E2E tests (Playwright)
- Run manual voice checklist
- Complete accessibility audit
- Triage bugs by severity

### Phase 11: Deployment, Analytics and Launch (2 days)
**Skills**:
- `security-best-practices` - Security headers, environment configuration
- `claude-api` - Production API setup

**Tasks**:
- Configure domain and HTTPS
- Set security headers
- Set up analytics and error reporting
- Soft launch and gather feedback

### Phase 12: Post-Launch Operation and Roadmap (Ongoing)
**Skills**:
- `claude-api` - Monitor API usage and costs
- `security-best-practices` - Monitor security issues

**Tasks**:
- Weekly content updates
- Monthly dependency updates
- Monitor analytics and errors
- Prioritize improvement roadmap

## Using This Matrix

1. **Before starting a phase**: Identify relevant skills from this matrix
2. **Load skill instructions**: Read the full SKILL.md for each relevant skill
3. **Apply throughout**: Keep skill guidelines active during implementation
4. **Multi-skill tasks**: Use all relevant skills when a task spans multiple areas
5. **Update progress**: Track which skills were used in `IMPLEMENTATION_PROGRESS.md`

## Skill Loading Pattern

```
# Example for Phase 3 (3D Scene)
1. Skill(skill="threejs-geometry")  # Load first
2. Skill(skill="threejs-animation")
3. Skill(skill="frontend-design")
4. Skill(skill="accessibility")
5. Read implementation plan Phase 3 section
6. Begin implementation following all skill guidelines
```
