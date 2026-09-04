# Handover: Magpie Dashboards work timeline (Jan-Sep 2026)

## Purpose of this document

This document hands off a project timeline to an LLM or collaborator for rendering, design, or copywriting work. It contains (1) product and role context, (2) the chronological flow, (3) a verbatim inventory of work items organized into lanes, and (4) rules for interpreting the data. The inventory in Section 4 is source data transcribed from the owner's diagram. Do not rename, merge, recategorize, or omit items without the owner's direction. Contextual annotations are clearly separated from source data.

## 1. Context

**Product.** Magpie Literacy is a K-8 reading application. Embedded in it are the Magpie Dashboards: Usage, Completion, and ROAR Assessments reporting for teachers, school admins, and district admins. Educators use them to monitor engagement, track curriculum progress, and act on assessment results.

**Role.** Rico Garcia joined Magpie in January 2026 as Principal Product Manager, owning the Platform Data (PDAT) team: the data infrastructure behind internal analytics and the customer-facing dashboards. He is the sole Principal PM at the helm of this work.

**Situation at start.** The dashboards had launched months earlier on a brittle foundation: a monolithic, fragmented ETL, data accuracy problems eroding partner trust, and the research team (Impact & Learning, abbreviated I&L) compensating with manual reports. The PDAT team was only weeks old, documentation was sparse, and knowledge was held by individuals. The company was simultaneously expanding from K-2 to K-8.

**Audience for the final output.** Recruiters, hiring managers, and portfolio reviewers who spend minimal time per page. The timeline must be scannable and must make Rico's personal contributions and leadership visible.

## 2. Chronological flow

The timeline spans January through September 2026 and reads left to right. It is coarse-grained: item positions indicate approximate sequence, not exact dates. The narrative arc, as used on the portfolio page, has four phases:

1. **Learn fast, stabilize faster (Jan-Feb).** Discovery ran in parallel with delivery. The team shored up prior-year promises (Deltas & Delights) while new data lake infrastructure began.
2. **Choose rebuild over repair (Feb-Mar).** The Completion Dashboard was taken offline in a deliberate, controlled, time-boxed blackout rather than patched. Foundations (dbt, dimensional layer, test data) went in behind the blackout. A data-lake-to-frontend experiment failed on cost and performance, and that failure informed the shipped architecture (transform in the lake, serve from Postgres).
3. **Relaunch and govern (Mar-May).** Completion re-released from the V2 pipeline with no reported bugs. Its learnings became the migration model for Usage and ROAR, which will not need blackouts. Governance, SLI/SLOs, and intake processes stood up in parallel.
4. **Prepare for scale (Jun-Aug).** V2 migration phases 2 and 3 (Usage, ROAR), the first published Platform roadmap, the educator enablement video series, and the K-8 ROAR Dashboard toward a fall beta.

Unplanned work ("curve balls") landed throughout all phases and was absorbed into planned capacity rather than derailing it. See the Challenges lane.

## 3. Lane definitions

The inventory uses six lanes from the owner's diagram:

- **Eng Build**: engineering-delivered workstreams under Rico's roadmap.
- **Product Build**: product artifacts and tools, largely built hands-on by Rico.
- **Product Discovery**: research and go-to-market discovery work (surveys, interviews, observations, competitor analysis), designed and conducted by Rico.
- **Processes**: operational processes and norms Rico created and facilitated.
- **Challenges Planned / Unplanned**: challenges encountered, both anticipated and curve balls.
- **In-Flight / Future**: groundwork laid for already-planned 2026 Q4 work.

Ownership context (from the owner, not encoded in the diagram): the Product Build, Product Discovery, and Processes lanes are largely Rico's own doing or spearheading. Specifics worth preserving in any rendering: he built the A11y scraper and the Replica Site himself; scripted, recorded, and edited the enablement videos; built the app usage reports (engineering stood up the instrumentation); designed and conducted all discovery; created and facilitated the intake board; and performs dashboard QA himself.

## 4. Work item inventory (verbatim source data)

Items are listed in left-to-right order within each lane as they appear in the source diagram. Left-to-right approximates chronology.

### Eng Build

- V2 Migration Phases 1/3 Completion Dashboard
- ROAR Phoneme Rework
- Data Lineage data dictionary for UI and DBT documentation for Data Lake
- SLI/SLO [refined] ability, definitions, and creation (arrow to: DataDog Reports & Alerts)
- DataDog Reports & Alerts
- Quality & Testing Improvements for V2
- Deltas & Delights
- Quality & Testing Improvements to V1 ETL and some V2
- V2 Connection Phases 2/3 (Usage)
- V2 Connection Phases 3/3 (ROAR)
- Infra: New Data Lake Layers Marts, Analytics, Staging, Prod
- Expanded Student Analytics
- ROAR Expansion to K-8
- BI Tool Stood up for I&L
- ROAR Learner Overview table for Admins

### Product Build

- App Usage Visibility Report build
- A11y scraper
- Replica Site
- Manual ROAR stuck student reporting, and Phoneme reporting and analysis
- All research & prototype designs (rendered as a bar spanning the full lane width, indicating ongoing work across the timeline)

### Product Discovery (Survey, Interview, Observations, Competitors)

- Published Roadmap and GTM resources
- Customer Discovery Competitor Analysis
- App Usage Visibility analysis
- Customer Discovery ROAR Progress Validation
- External Facing Roadmap & GTM Releases (arrow down to the Processes lane item "External Facing Roadmap & GTM Releases norms and structures")
- Enablement Resources. Videos

### Processes

- Data Crosswalk series
- Intake Board & SOP
- External Facing Roadmap & GTM Releases norms and structures
- Platform Data Deletion + Future Initiative crafting

### Challenges Planned / Unplanned

- High volume of Bugs & ETL Failures
- EEDI
- Data Lake for FE failure — read up
- K-2 Content Expansion
- New Initiative Process across product & eng
- ROAR K-8 expansion caused a rework of agg metrics in Usage & Completion
- Data Deletion project
- ROAR Phoneme Rework

### In-Flight / Future

Header text from source: "This lays the groundwork for already planned work for 2026 Q4:"

- Increase dashboard refresh frequency
- ROAR Progress Page for all roles
- CSV Export
- Lesson Completion Recency
- Data Lake Content Expansion for I&L
- K-8 expansion of Usage
- K-8 expansion of ROAR

## 5. Cross-lane relationships

Two explicit arrows exist in the source diagram:

1. Eng Build: "SLI/SLO [refined] ability, definitions, and creation" → "DataDog Reports & Alerts". The SLI/SLO work produced the reports and alerts.
2. Product Discovery: "External Facing Roadmap & GTM Releases" → Processes: "External Facing Roadmap & GTM Releases norms and structures". The discovery work produced the codified process.

Implicit relationships worth knowing (context, not source data):

- "ROAR Phoneme Rework" appears in both Eng Build and Challenges. It was unplanned work (Stanford deprecated the norming tables behind percentile scoring) woven into the roadmap, not a large standalone project.
- "Data Deletion project" appears in Challenges and corresponds to "Platform Data Deletion + Future Initiative crafting" in Processes. Rico led it across Platform Data, Platform Services, and Commercial teams, aligned to FERPA, COPPA, GDPR, and NY2D.
- "Data Lake for FE failure" was a deliberately structured experiment: serving the frontend directly from the data lake failed on cost and performance, which drove the shipped architecture (dbt + Athena transforms, curated marts materialized into Postgres).
- "V2 Migration Phases 1/3 Completion Dashboard" is the Completion blackout and relaunch described in Section 2, phase 2-3. It is the proof-of-concept model for phases 2/3 and 3/3.
- "Manual ROAR stuck student reporting" surfaced 601 students silently stuck on incomplete subtests and feeds the future ROAR Progress Page listed under In-Flight / Future.
- "BI Tool Stood up for I&L" plus the Data Crosswalk series replaced I&L's manual report production, returning research capacity to efficacy work.

## 6. Terminology

- **PDAT**: Platform Data team (Rico's team). Also the Jira project prefix.
- **I&L**: Impact & Learning, the research team.
- **ROAR**: the assessment suite; Phoneme and Letter are subtests.
- **V1 / V2**: the legacy monolithic ETL pipeline vs. the new data lake architecture (dbt, layered marts, Postgres serving).
- **Deltas & Delights**: workstream shoring up prior-year promises, bug fixes, and small enhancements.
- **Blackout**: the deliberate temporary shutdown of the Completion Dashboard during its rebuild.
- **EEDI**: a potential AI partnership that fell through; the preparation work informed the path forward.
- **GTM**: go-to-market.
- **A11y**: accessibility. The scraper checks WCAG 2.2 compliance; a11y work is woven incrementally into dashboard UI work rather than run as one initiative.
- **Curve balls**: unplanned work absorbed into planned capacity (Phoneme rework, data deletion, curriculum and Entitlements changes, new I&L reporting needs).

## 7. Rules for the receiving LLM

1. Treat Section 4 as source data. Reproduce item names verbatim unless the owner approves edits.
2. Do not invent dates. The timeline is approximate; left-to-right order within a lane is the only sequencing the source guarantees. Confirm exact dates with the owner before rendering a dated axis.
3. Do not assign ownership colors, groupings, or emphasis without the owner's direction. When ownership is shown, use Section 3's ownership context.
4. Duplicated items across lanes (ROAR Phoneme Rework, Data Deletion) are intentional; do not deduplicate without asking.
5. The portfolio audience skims. Any rendering must stay scannable; detail belongs in hover states, click-throughs, or accompanying prose, not in the boxes.
6. Writing style for any accompanying copy: plain, direct, active voice, sentence case, no em-dashes, per the Google Developer Documentation Style Guide.
