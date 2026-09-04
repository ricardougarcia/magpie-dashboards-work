# Timeline item details: Magpie Dashboards (Jan-Sep 2026)

Companion to `magpie-dashboards-timeline-handover.md`. One entry per inventory item. Fields: Description, Placement, Value, Lane, Relates to, Guiding Light.

**Placement caveat:** The source diagram is coarse-grained. Placements below are inferred from diagram position and the narrative phases, rounded to whole or mid months. The owner must validate all placements before rendering. Placement is for presentation, not planning.

**Guiding Light key:** Learn, Fix, Stabilize, Govern, Grow.

---

## Lane: Eng Build

### Infra: New Data Lake Layers Marts, Analytics, Staging, Prod
- **Description:** Built the V2 data lake foundation: layered marts, analytics, staging, and prod environments with dbt.
- **Placement:** Jan - Mar
- **Value:** Replaced a monolithic, fragmented ETL with a version-controlled, testable, observable architecture that can scale to K-8 and projected user growth.
- **Lane:** Eng Build
- **Relates to:**
  - V2 Migration Phases 1/3 Completion Dashboard: provided the pipeline Completion re-launched on.
  - Data Lake for FE failure — read up: the failed experiment shaped this architecture (transform in the lake, serve from Postgres).
  - BI Tool Stood up for I&L: the governed marts are what the BI tool reads.
- **Guiding Light:** Stabilize, Grow

### Deltas & Delights
- **Description:** Workstream shoring up prior-year promises: bug fixes, small enhancements, and unblocked commitments.
- **Placement:** Jan - Feb
- **Value:** Restored credibility with partners on existing commitments while the V2 rebuild proceeded in parallel.
- **Lane:** Eng Build
- **Relates to:**
  - High volume of Bugs & ETL Failures: this workstream absorbed and burned down that volume.
  - Quality & Testing Improvements to V1 ETL and some V2: successor workstream that hardened what Deltas & Delights patched.
- **Guiding Light:** Fix

### Data Lineage data dictionary for UI and DBT documentation for Data Lake
- **Description:** First frontend data dictionary explaining every dashboard's data lineage and calculations, plus dbt docs for the lake.
- **Placement:** Feb - Mar
- **Value:** Converted knowledge held by individuals into shared documentation; educators' numbers became explainable end to end.
- **Lane:** Eng Build
- **Relates to:**
  - Infra: New Data Lake Layers Marts, Analytics, Staging, Prod: documents the models this infrastructure introduced.
  - Data Crosswalk series: the dictionary is the reference the crosswalk aligned against.
- **Guiding Light:** Learn, Govern

### Quality & Testing Improvements to V1 ETL and some V2
- **Description:** Testing epic hardening the legacy V1 pipeline (and early V2) while V2 was under construction.
- **Placement:** Feb - Apr
- **Value:** Kept the live product reliable during the migration; customers never lost the nightly refresh.
- **Lane:** Eng Build
- **Relates to:**
  - Deltas & Delights: turned its reactive fixes into durable test coverage.
  - V2 Migration Phases 1/3 Completion Dashboard: protected V1 stability while the first migration ran.
- **Guiding Light:** Stabilize

### V2 Migration Phases 1/3 Completion Dashboard
- **Description:** The Completion Dashboard blackout and rebuild: taken offline deliberately, rebuilt on the V2 pipeline, relaunched with V1/V2 parity validation.
- **Placement:** Mar - May
- **Value:** Relaunched with zero reported bugs and became the proof-of-concept migration model, so Usage and ROAR migrate without blackouts.
- **Lane:** Eng Build
- **Relates to:**
  - Infra: New Data Lake Layers Marts, Analytics, Staging, Prod: the pipeline it re-launched on.
  - V2 Connection Phases 2/3 (Usage): follows the model this phase proved.
  - V2 Connection Phases 3/3 (ROAR): follows the model this phase proved.
  - High volume of Bugs & ETL Failures: inflated Completion data was the trigger for rebuild over repair.
  - K-2 Content Expansion: upcoming curriculum changes meant patches would break again, strengthening the rebuild case.
- **Guiding Light:** Fix, Stabilize

### SLI/SLO [refined] ability, definitions, and creation
- **Description:** Defined and created service level indicators and objectives for the dashboards and backend, where none existed.
- **Placement:** Mar - Apr
- **Value:** Gave the team measurable reliability targets, enabling alerting, enablement claims, and go-to-market confidence.
- **Lane:** Eng Build
- **Relates to:**
  - DataDog Reports & Alerts: direct output; the SLI/SLOs are what the alerts measure (explicit arrow in source diagram).
  - App Usage Visibility Report build: shares the DataDog instrumentation foundation.
- **Guiding Light:** Govern, Stabilize

### DataDog Reports & Alerts
- **Description:** Reports and alerting built on the SLI/SLO definitions and DataDog instrumentation.
- **Placement:** Apr - May
- **Value:** The team now detects degradation before customers report it; stability became observable rather than assumed.
- **Lane:** Eng Build
- **Relates to:**
  - SLI/SLO [refined] ability, definitions, and creation: implements those definitions (explicit arrow in source diagram).
- **Guiding Light:** Stabilize

### Expanded Student Analytics
- **Description:** Expanded educator-facing analytics to show individual student performance against peers.
- **Placement:** Mar - Apr
- **Value:** Gave educators the context to interpret an individual student's numbers, deepening the dashboards' instructional value.
- **Lane:** Eng Build
- **Relates to:**
  - Customer Discovery Competitor Analysis: discovery findings informed which context educators needed.
- **Guiding Light:** Grow

### Quality & Testing Improvements for V2
- **Description:** Test automation and expanded synthetic and edge-case data for the V2 pipeline.
- **Placement:** May - Jun
- **Value:** Baked the post-mortem lessons from V1's bug era into the new pipeline so old failure modes can't silently return.
- **Lane:** Eng Build
- **Relates to:**
  - V2 Migration Phases 1/3 Completion Dashboard: post-mortem findings from the blackout drove this work.
  - V2 Connection Phases 2/3 (Usage): protected by this coverage.
  - V2 Connection Phases 3/3 (ROAR): protected by this coverage.
- **Guiding Light:** Stabilize

### V2 Connection Phases 2/3 (Usage)
- **Description:** Migration of the Usage Dashboard onto the V2 pipeline using the model proven by Completion.
- **Placement:** May - Jul
- **Value:** Second dashboard onto the scalable foundation, with no blackout required.
- **Lane:** Eng Build
- **Relates to:**
  - V2 Migration Phases 1/3 Completion Dashboard: applies its migration model.
  - ROAR K-8 expansion caused a rework of agg metrics in Usage & Completion: absorbed this rework mid-migration.
- **Guiding Light:** Stabilize, Grow

### V2 Connection Phases 3/3 (ROAR)
- **Description:** Migration of the ROAR Assessments Dashboard onto the V2 pipeline, completing the three-phase plan.
- **Placement:** Jul - Sep
- **Value:** Completes the V2 migration, clearing the path to decommission V1 entirely.
- **Lane:** Eng Build
- **Relates to:**
  - V2 Migration Phases 1/3 Completion Dashboard: applies its migration model.
  - ROAR Expansion to K-8: shares the ROAR surface; sequencing coordinated between them.
- **Guiding Light:** Stabilize, Grow

### ROAR Phoneme Rework
- **Description:** Scoring change from percentile to % Correct after Stanford deprecated the norming tables, shipped against a hard back-to-school deadline.
- **Placement:** Jun - Aug
- **Value:** Preserved assessment scoring for educators despite a vanished external dependency; a deliberate scope cut (reusing the Letter pattern) reduced the work by roughly a third and protected the deadline.
- **Lane:** Eng Build (also appears in Challenges Planned / Unplanned; intentional duplicate)
- **Relates to:**
  - Manual ROAR stuck student reporting, and Phoneme reporting and analysis: manual reporting bridged the gap this rework created.
  - ROAR Learner Overview table for Admins: part of the same ROAR reporting improvement arc.
- **Guiding Light:** Fix

### ROAR Expansion to K-8
- **Description:** K-8 ROAR Dashboard build toward a fall beta as the company expands beyond K-2.
- **Placement:** Jun - Sep
- **Value:** Extends the product to the company's new market; aggregation suppression for grades 3-8 treated as load-bearing correctness work ahead of August rostering.
- **Lane:** Eng Build
- **Relates to:**
  - ROAR K-8 expansion caused a rework of agg metrics in Usage & Completion: the expansion is the cause of that rework.
  - K-8 expansion of Usage: future work this seeds.
  - K-8 expansion of ROAR: future work this seeds.
- **Guiding Light:** Grow

### BI Tool Stood up for I&L
- **Description:** Business intelligence tool stood up on the shared, governed marts for the research team.
- **Placement:** Jun - Jul
- **Value:** Research pulls the same governed metrics the product reports, retiring manual report production and returning that capacity to efficacy research.
- **Lane:** Eng Build
- **Relates to:**
  - Infra: New Data Lake Layers Marts, Analytics, Staging, Prod: reads the governed marts this created.
  - Data Crosswalk series: the shared definitions that make the tool trustworthy.
  - Data Lake Content Expansion for I&L: future work extending what I&L can reach.
- **Guiding Light:** Govern, Grow

### ROAR Learner Overview table for Admins
- **Description:** New admin-facing table summarizing ROAR learner status.
- **Placement:** Jul - Aug
- **Value:** Gave admins an at-a-glance assessment view they previously lacked, supporting the back-to-school motion.
- **Lane:** Eng Build
- **Relates to:**
  - ROAR Phoneme Rework: part of the same ROAR reporting improvement arc.
  - ROAR Progress Page for all roles: future work this points toward.
- **Guiding Light:** Grow

---

## Lane: Product Build

### App Usage Visibility Report build
- **Description:** Usage reports built by Rico on DataDog instrumentation engineering stood up, showing how educators actually use the dashboards.
- **Placement:** Feb - Mar
- **Value:** Ended flying blind: the team could finally see customer behavior, which fed adoption insight, instrumentation gap findings, and the fidelity problem discovery.
- **Lane:** Product Build
- **Relates to:**
  - App Usage Visibility analysis: the analysis performed on these reports.
  - SLI/SLO [refined] ability, definitions, and creation: shares the DataDog foundation.
  - Enablement Resources. Videos: usage findings (low fidelity of use) motivated the series.
- **Guiding Light:** Learn

### A11y scraper
- **Description:** WCAG 2.2 accessibility scanner built by Rico to check dashboard pages for compliance.
- **Placement:** Feb - Mar
- **Value:** Established accessibility parity with the student side as a measurable, repeatable check; a11y is woven incrementally into UI work rather than run as one initiative.
- **Lane:** Product Build
- **Relates to:**
  - V2 Migration Phases 1/3 Completion Dashboard: the incremental a11y program began with the Completion relaunch.
- **Guiding Light:** Fix, Govern

### Replica Site
- **Description:** Exact, data-rich copy of the dashboard UI and functionality (six months of data, design schema parity) built by Rico.
- **Placement:** Mar - Apr
- **Value:** Prototyping and design environment that covers the committed-designer gap; used to produce research and product feature designs without engineering time.
- **Lane:** Product Build
- **Relates to:**
  - All research & prototype designs: the environment those designs are produced in.
  - Customer Discovery ROAR Progress Validation: prototypes validated with customers came from here.
- **Guiding Light:** Learn, Grow

### Manual ROAR stuck student reporting, and Phoneme reporting and analysis
- **Description:** Manual production reporting covering ROAR Phoneme scoring and stuck-student detection during the dashboard coverage gap.
- **Placement:** Jul - Aug
- **Value:** Surfaced 601 students silently stuck on incomplete subtests (phoneme driving about 59%), gave educators interim visibility, and feeds the future ROAR Progress Page.
- **Lane:** Product Build
- **Relates to:**
  - ROAR Phoneme Rework: bridges the reporting gap during the scoring transition.
  - ROAR Progress Page for all roles: this work is its direct precursor.
- **Guiding Light:** Fix, Learn

### All research & prototype designs
- **Description:** Ongoing production of research artifacts and product feature designs, spanning the entire period.
- **Placement:** Jan - Sep (ongoing)
- **Value:** Continuous design output despite no committed designer; kept discovery findings flowing into buildable specifications.
- **Lane:** Product Build
- **Relates to:**
  - Replica Site: the environment these designs are produced in.
  - Customer Discovery Competitor Analysis: findings feed these designs.
- **Guiding Light:** Learn, Grow

---

## Lane: Product Discovery

### Customer Discovery Competitor Analysis
- **Description:** Discovery program designed and conducted by Rico: surveys, virtual and in-person interviews, classroom observations, synthesized against competitor analysis.
- **Placement:** Jan - Feb
- **Value:** Grounded the roadmap in real educator pain rather than assumptions; findings informed development direction all year.
- **Lane:** Product Discovery
- **Relates to:**
  - Expanded Student Analytics: discovery findings shaped what context educators needed.
  - All research & prototype designs: findings feed the design output.
- **Guiding Light:** Learn

### Published Roadmap and GTM resources
- **Description:** Initial roadmap publication with go-to-market resources for new features and releases.
- **Placement:** Mar - Apr
- **Value:** Partners and internal teams could see what was coming for the first time; set up the later codified external roadmap.
- **Lane:** Product Discovery
- **Relates to:**
  - External Facing Roadmap & GTM Releases: the maturation of this initial publication.
- **Guiding Light:** Govern

### App Usage Visibility analysis
- **Description:** Analysis of the usage reports: adoption patterns, instrumentation gaps, and behavioral findings.
- **Placement:** Mar - Apr
- **Value:** Identified the dominant instrumentation gap (roughly 840 unlabeled clicks per month) and a silent analytics endpoint failure, and surfaced that educators were not using dashboards to fidelity.
- **Lane:** Product Discovery
- **Relates to:**
  - App Usage Visibility Report build: analyzes those reports.
  - Enablement Resources. Videos: the fidelity finding motivated the series.
- **Guiding Light:** Learn

### Customer Discovery ROAR Progress Validation
- **Description:** Customer validation of ROAR progress reporting concepts using prototypes.
- **Placement:** Apr - May
- **Value:** De-risked the ROAR progress direction with educator input before build investment.
- **Lane:** Product Discovery
- **Relates to:**
  - Replica Site: prototypes came from this environment.
  - ROAR Progress Page for all roles: validates the direction of that future work.
- **Guiding Light:** Learn

### External Facing Roadmap & GTM Releases
- **Description:** External-facing roadmap with go-to-market releases for all new features, created by Rico.
- **Placement:** May - Jun
- **Value:** First published roadmap across all Platform teams, and still the only one; partners gained forward visibility.
- **Lane:** Product Discovery
- **Relates to:**
  - External Facing Roadmap & GTM Releases norms and structures: the codified process this produced (explicit arrow in source diagram).
  - Published Roadmap and GTM resources: the initial publication this matured from.
- **Guiding Light:** Govern, Grow

### Enablement Resources. Videos
- **Description:** Nine-video educator demo series across all three dashboards and all three personas; scripted from academics and partnerships language, recorded, demoed, and edited by Rico.
- **Placement:** Jul - Aug
- **Value:** Supported the back-to-school motion and addressed the fidelity gap: resources to integrate dashboards as a tool that informs instruction.
- **Lane:** Product Discovery
- **Relates to:**
  - App Usage Visibility analysis: the fidelity finding this responds to.
  - ROAR Learner Overview table for Admins: back-to-school features the series showcases.
- **Guiding Light:** Grow, Learn

---

## Lane: Processes

### Data Crosswalk series
- **Description:** Cross-functional definition alignment series with Impact & Learning, reconciling metrics between research and product.
- **Placement:** Feb - Apr
- **Value:** Metrics mean one thing; research and product pull the same numbers, foundational to governance and the BI tool.
- **Lane:** Processes
- **Relates to:**
  - BI Tool Stood up for I&L: the shared definitions that make it trustworthy.
  - Data Lineage data dictionary for UI and DBT documentation for Data Lake: the documented reference the crosswalk aligned against.
- **Guiding Light:** Govern

### Intake Board & SOP
- **Description:** Intake board and standard operating procedures for non-engineering stakeholders to submit bugs and feature requests, created and facilitated by Rico as an experiment then codified.
- **Placement:** Mar - Apr
- **Value:** Replaced ad hoc requests with a structured, transparent pipeline; the team's front door now exists.
- **Lane:** Processes
- **Relates to:**
  - New Initiative Process across product & eng: sibling process work formalizing how work enters and moves.
- **Guiding Light:** Govern

### External Facing Roadmap & GTM Releases norms and structures
- **Description:** Codified norms and structures for maintaining the external roadmap and GTM release process.
- **Placement:** May - Jun
- **Value:** Made the roadmap a repeatable practice rather than a one-time artifact.
- **Lane:** Processes
- **Relates to:**
  - External Facing Roadmap & GTM Releases: codifies that work (explicit arrow in source diagram).
- **Guiding Light:** Govern

### Platform Data Deletion + Future Initiative crafting
- **Description:** Cross-team data deletion project (Platform Data, Platform Services, Commercial) led by Rico, plus crafting of the future data disposition initiative.
- **Placement:** May - Jul
- **Value:** Compliant deletion aligned to FERPA, COPPA, GDPR, and NY2D, and a mapped arc for student profile disposition, longitudinal learning, and auditability.
- **Lane:** Processes
- **Relates to:**
  - Data Deletion project: the same effort viewed from the Challenges lane (intentional duplicate).
- **Guiding Light:** Govern

---

## Lane: Challenges Planned / Unplanned

### High volume of Bugs & ETL Failures
- **Description:** Early-period bug volume and ETL failures inherited from the brittle V1 pipeline.
- **Placement:** Jan - Mar
- **Value:** The pain that justified the rebuild; burned down through Deltas & Delights and the V1 testing epic while V2 provided the permanent fix.
- **Lane:** Challenges Planned / Unplanned
- **Relates to:**
  - Deltas & Delights: the workstream that absorbed this volume.
  - V2 Migration Phases 1/3 Completion Dashboard: the permanent answer to this pattern.
- **Guiding Light:** Fix

### EEDI
- **Description:** Preparation for a potential AI partnership, documenting backend structure, event flow, current and future state; the partnership fell through.
- **Placement:** Jan - Feb
- **Value:** The documentation and architectural articulation informed the path forward despite the partnership not materializing.
- **Lane:** Challenges Planned / Unplanned
- **Relates to:**
  - Data Lineage data dictionary for UI and DBT documentation for Data Lake: the articulation work overlapped with documentation needs.
- **Guiding Light:** Learn

### Data Lake for FE failure — read up
- **Description:** Structured experiment testing whether the frontend could be served directly from the data lake; failed on cost and performance.
- **Placement:** Feb - Mar
- **Value:** Because it was framed as an experiment, the failure was cheap and decisive; it drove the shipped architecture (transform in the lake, serve from Postgres).
- **Lane:** Challenges Planned / Unplanned
- **Relates to:**
  - Infra: New Data Lake Layers Marts, Analytics, Staging, Prod: the failure shaped this design.
- **Guiding Light:** Learn

### K-2 Content Expansion
- **Description:** New K-2 curriculum content and structure changes from other product teams, with PDAT as a dependency for accurate reporting.
- **Placement:** Apr - May
- **Value:** Absorbed without breaking reporting; also strengthened the case for rebuild over repair, since patches would not have survived it.
- **Lane:** Challenges Planned / Unplanned
- **Relates to:**
  - V2 Migration Phases 1/3 Completion Dashboard: upcoming content changes were part of the rebuild rationale.
- **Guiding Light:** Stabilize

### New Initiative Process across product & eng
- **Description:** A new cross-org initiative process introduced across product and engineering that PDAT had to adopt mid-flight.
- **Placement:** Apr - May
- **Value:** Adopted without losing delivery momentum; complemented PDAT's own intake and roadmap process work.
- **Lane:** Challenges Planned / Unplanned
- **Relates to:**
  - Intake Board & SOP: sibling process work on how work enters and moves.
- **Guiding Light:** Govern

### ROAR K-8 expansion caused a rework of agg metrics in Usage & Completion
- **Description:** The K-8 expansion forced a rework of aggregation metrics in the Usage and Completion dashboards.
- **Placement:** Jun - Jul
- **Value:** Reframed as load-bearing correctness work ahead of August rostering rather than a distraction; K-8 numbers will be right on day one.
- **Lane:** Challenges Planned / Unplanned
- **Relates to:**
  - ROAR Expansion to K-8: the expansion driving the rework.
  - V2 Connection Phases 2/3 (Usage): absorbed the rework mid-migration.
- **Guiding Light:** Stabilize, Grow

### Data Deletion project
- **Description:** Compliance-driven data deletion project arriving as unplanned cross-team work.
- **Placement:** May - Jul
- **Value:** Turned a compliance scramble into a coherent, led initiative and seeded the future data stewardship roadmap.
- **Lane:** Challenges Planned / Unplanned (also appears in Processes as Platform Data Deletion + Future Initiative crafting; intentional duplicate)
- **Relates to:**
  - Platform Data Deletion + Future Initiative crafting: the same effort viewed from the Processes lane.
- **Guiding Light:** Govern

### ROAR Phoneme Rework
- **Description:** Unplanned scoring change forced by Stanford deprecating the norming tables; a curve ball woven into planned work.
- **Placement:** Jun - Aug
- **Value:** Absorbed into planned capacity through deliberate scope cuts and sequencing; shipped against the hard back-to-school deadline.
- **Lane:** Challenges Planned / Unplanned (also appears in Eng Build; intentional duplicate)
- **Relates to:**
  - ROAR Phoneme Rework (Eng Build): the delivery view of the same work.
  - Manual ROAR stuck student reporting, and Phoneme reporting and analysis: the reporting bridge during the transition.
- **Guiding Light:** Fix

---

## Lane: In-Flight / Future

Source header: "This lays the groundwork for already planned work for 2026 Q4." These are planned items, not timeline bars. Placement for all: Oct - Dec (planned).

### Increase dashboard refresh frequency
- **Description:** Increase how often dashboard data refreshes.
- **Placement:** Oct - Dec (planned)
- **Value:** Fresher data for instructional decisions; enabled by the V2 pipeline's efficiency.
- **Lane:** In-Flight / Future
- **Relates to:**
  - Infra: New Data Lake Layers Marts, Analytics, Staging, Prod: the foundation that makes higher frequency feasible.
- **Guiding Light:** Grow

### ROAR Progress Page for all roles
- **Description:** In-dashboard ROAR progress page for every persona, including subtest-level completion and stuck-student visibility.
- **Placement:** Oct - Dec (planned)
- **Value:** Moves stuck-student detection from manual analysis into the product for the educators who can act on it.
- **Lane:** In-Flight / Future
- **Relates to:**
  - Manual ROAR stuck student reporting, and Phoneme reporting and analysis: direct precursor.
  - Customer Discovery ROAR Progress Validation: validated the direction.
- **Guiding Light:** Grow

### CSV Export
- **Description:** Export dashboard data to CSV.
- **Placement:** Oct - Dec (planned)
- **Value:** Lets educators and admins take data into their own workflows.
- **Lane:** In-Flight / Future
- **Relates to:**
  - Customer Discovery Competitor Analysis: a commonly requested capability surfaced through discovery.
- **Guiding Light:** Grow

### Lesson Completion Recency
- **Description:** Surface how recently students completed lessons.
- **Placement:** Oct - Dec (planned)
- **Value:** Sharper instructional signal than completion counts alone.
- **Lane:** In-Flight / Future
- **Relates to:**
  - V2 Connection Phases 2/3 (Usage): builds on the migrated Usage and Completion foundation.
- **Guiding Light:** Grow

### Data Lake Content Expansion for I&L
- **Description:** Expand data lake content available to Impact & Learning.
- **Placement:** Oct - Dec (planned)
- **Value:** Extends research's self-serve reach on governed data.
- **Lane:** In-Flight / Future
- **Relates to:**
  - BI Tool Stood up for I&L: extends what that tool can reach.
- **Guiding Light:** Grow, Govern

### K-8 expansion of Usage
- **Description:** Extend the Usage Dashboard to grades K-8.
- **Placement:** Oct - Dec (planned)
- **Value:** Full-product coverage of the company's expanded market.
- **Lane:** In-Flight / Future
- **Relates to:**
  - ROAR Expansion to K-8: seeded by that work and its aggregation rework.
- **Guiding Light:** Grow

### K-8 expansion of ROAR
- **Description:** Extend ROAR reporting fully to grades K-8 beyond the fall beta.
- **Placement:** Oct - Dec (planned)
- **Value:** Completes the assessment story for the expanded market.
- **Lane:** In-Flight / Future
- **Relates to:**
  - ROAR Expansion to K-8: the beta this generalizes.
- **Guiding Light:** Grow
