# Phase 0: Content Discovery Status

**Started**: 2026-11-08  
**Status**: IN PROGRESS

## Objective
Collect authentic, verifiable information to replace ALL placeholder content in the v12 prototype. No invented facts, metrics, or biographical details.

---

## Information Sources

### 1. V12 Prototype Analysis
**File**: `portfolio-demo-v12-voice.html`

**Placeholder Information Found** (ALL NEEDS VERIFICATION):
- Name: "Aarav Sharma"
- Age: 21
- Location: Ludhiana
- Title: "AI systems founder"
- Zodiac symbol: ♑︎ (Capricorn)

**Products Mentioned** (ALL PLACEHOLDER):
- Orbit - "agents that write cited research briefs in 2 minutes"
- Autopilot - "gives small business owners about 8 hours back every week"
- Plantly - "12,000 monthly users"
- KhataKit - "runs in 800 shops"
- NotesNest - "finished third on Product Hunt"
- Sage (mentioned but no details)
- Lens (mentioned but no details)
- Dispatch (mentioned but no details)

**Metrics Mentioned** (ALL PLACEHOLDER - NEEDS VERIFICATION):
- 12,000 monthly users (Plantly)
- ₹18L revenue in first year
- 99.9% uptime
- 312 automated tests
- Team of 6
- Pre-seed funding at 19

**Technical Skills Claimed** (NEEDS VERIFICATION):
- Fine-tuning models (62% cost reduction claimed)
- Retrieval over private documents
- 14 agents in production
- Full stack from data to deployment

**Contact** (PLACEHOLDER):
- Email: hello@aarav.dev

---

## Research Strategy

### Step 1: Identify Real Subject ✅ IN PROGRESS
Since all information in the prototype appears to be placeholder/fictional:
1. **USER INPUT REQUIRED**: Who is this portfolio actually for?
   - Real name?
   - Real background?
   - Real projects and achievements?

### Step 2: Gather Authentic Information ⏳ BLOCKED
Cannot proceed without knowing the real subject of the portfolio.

**Options**:
- **Option A**: This is a demo portfolio (no real person)
  - Mark all content as `NEEDS INPUT`
  - Create template structure for real data
  - Provide clear guidance on what information to gather

- **Option B**: Portfolio is for a real person (user or client)
  - Need access to: resume, LinkedIn, project repositories, company records
  - Verify all metrics with documentation
  - Interview subject for personal details

- **Option C**: User IS "Aarav Sharma" (or similar profile)
  - Need user to provide authentic details
  - Verify each claim with evidence
  - Replace placeholder metrics with real numbers

---

## Questions for User

### Critical Questions (MUST ANSWER BEFORE PROCEEDING):

1. **Who is this portfolio for?**
   - [ ] A real person (name: _________)
   - [ ] It's a demo/template (fictional persona)
   - [ ] To be determined later

2. **If for a real person, what information is available?**
   - [ ] Resume/CV
   - [ ] LinkedIn profile
   - [ ] GitHub profile
   - [ ] Company/product websites
   - [ ] Analytics dashboards (for metrics)
   - [ ] Press coverage or awards
   - [ ] Other: __________

3. **What content should be gathered now vs. marked as NEEDS INPUT?**
   - [ ] Gather all available information immediately
   - [ ] Create template structure with NEEDS INPUT placeholders
   - [ ] Mixed approach (gather what's available, mark rest)

---

## Information Needed (Template)

### Personal Background
- [ ] **Full name**: NEEDS INPUT
- [ ] **Age/Birth year**: NEEDS INPUT
- [ ] **Current location**: NEEDS INPUT
- [ ] **Professional title**: NEEDS INPUT (e.g., "AI Engineer", "Founder", "Developer")
- [ ] **Background story**: NEEDS INPUT
  - When started coding?
  - Educational background?
  - Career milestones?

### Products/Projects
For EACH product, need:
- [ ] **Name**: NEEDS INPUT
- [ ] **What it does** (1 sentence): NEEDS INPUT
- [ ] **Technology used**: NEEDS INPUT
- [ ] **Verifiable results**:
  - Users: NEEDS INPUT (with source)
  - Revenue: NEEDS INPUT (with source)
  - Awards/recognition: NEEDS INPUT (with source)
- [ ] **Link**: NEEDS INPUT
- [ ] **Status**: (live/archived/beta)

### Technical Skills
- [ ] **Programming languages**: NEEDS INPUT
- [ ] **AI/ML expertise**: NEEDS INPUT
  - Model training? Fine-tuning? RAG? Agents?
- [ ] **Infrastructure**: NEEDS INPUT
  - Cloud platforms? Deployment experience?
- [ ] **Testing practices**: NEEDS INPUT
  - Test coverage? CI/CD?

### Achievements & Metrics
- [ ] **User numbers**: NEEDS INPUT (source required)
- [ ] **Revenue figures**: NEEDS INPUT (source required)
- [ ] **Uptime/reliability**: NEEDS INPUT (source required)
- [ ] **Test coverage**: NEEDS INPUT (source required)
- [ ] **Team size**: NEEDS INPUT
- [ ] **Funding**: NEEDS INPUT (amount, stage, date)
- [ ] **Press/Awards**: NEEDS INPUT

### Contact & Social
- [ ] **Email**: NEEDS INPUT
- [ ] **LinkedIn**: NEEDS INPUT
- [ ] **GitHub**: NEEDS INPUT
- [ ] **Twitter/X**: NEEDS INPUT
- [ ] **Website**: NEEDS INPUT
- [ ] **Calendar link** (for booking calls): NEEDS INPUT

### Content Strategy
- [ ] **Voice persona**: NEEDS INPUT
  - First person ("I built...") or third person ("Aarav built...")?
- [ ] **Tone**: NEEDS INPUT
  - Professional? Casual? Technical?
- [ ] **Topics to avoid**: NEEDS INPUT
  - Salary expectations?
  - Confidential clients?
  - Unreleased products?

---

## Next Steps

**BLOCKED**: Waiting for user input on:
1. Identity of portfolio subject
2. Available information sources
3. Approach for content gathering

**Once unblocked**:
1. Create structured content files in `content/` directory
2. Populate with verified information OR mark as NEEDS INPUT
3. Write 30-50 realistic questions based on actual background
4. Develop voice persona based on real communication style
5. Complete Phase 0 acceptance criteria

---

## Notes

- Phase 0 CANNOT be completed with placeholder data (per CLAUDE.md rules)
- "No fake data or placeholders in completed features" - Quality Standard
- Every number must be backed by a source - Acceptance Criteria
- All answers must be read aloud and sound natural - Acceptance Criteria
