import { CoordinateCursor } from "@/components/coordinate-cursor";
import { ltiAssets, ltiInspections, ltiRecord } from "@/data/lti";
import { PortfolioShell } from "./portfolio-shell";
import { LtiArtifact } from "./lti-artifact";
import { LtiMotion, LtiWorkstreams } from "./lti-motion";
import styles from "./lti.module.css";

const cx = (...names: string[]) => names.map((name) => styles[name]).join(" ");

function RelayTitle({ title, id, contact = false }: { title: string; id: string; contact?: boolean }) {
  return <>
    {contact && <span className={styles["relay-contact"]} aria-hidden="true"><i /></span>}
    <div className={styles["relay-title-line"]}>
      <h2 id={id}>{title}<span>.</span></h2>
      <span className={styles["relay-rule"]} aria-hidden="true" />
    </div>
  </>;
}

export function LtiPage() {
  return <PortfolioShell project={ltiRecord}>
    <main id="portfolio-main" className={styles.page} data-lti-page data-gantt-region>
      <CoordinateCursor />
      <LtiMotion>
        <article className={styles.relay} aria-label="LTI case study">
          <section className={cx("beat", "relay-opening", "graphite")} data-lti-beat aria-labelledby="lti-title">
            <h1 id="lti-title">An integration is also a release.</h1>
            <div className={styles["relay-introduction"]}>
              <p className={styles.copy}>A configuration change travels through provider tools, institutional workflows, and a public marketplace. The work was to make those dependencies visible—and sequence them.</p>
              <LtiArtifact artifact={ltiAssets.planning} views={ltiInspections.planning} inspectionHint="Explore the plan and three workflows" compact priority className={styles["relay-preview"]} />
            </div>
            <LtiWorkstreams />
            <div className={styles["relay-decision"]}>
              <h2>Wait for LTI 1.3.<br />Include it in the <em>provider launch.</em></h2>
              <p className={styles.caption}>Documented planning decision, recorded in the original process map. The artifact shows the decision and its dependencies. It does not establish the final shipped date.</p>
              <span className={styles["relay-decision-rule"]} aria-hidden="true" />
            </div>
          </section>
          <div className={styles["relay-body"]}>
            <div className={styles["relay-body-intro"]}>
              <h2>Make the integration usable.</h2>
              <p className={styles.copy}>Connecting systems was only part of the work. People also needed to discover integrations, manage product information, and configure their tools.</p>
            </div>
            <div className={styles.beat} data-lti-beat>
              <section id="discoverable" className={cx("relay-box", "relay-discover", "paper")} aria-labelledby="discoverable-title">
                <RelayTitle title="Discoverable" id="discoverable-title" />
                <div className={styles["relay-discover-spread"]}>
                  <div className={styles["relay-copy-block"]}>
                    <h3>Find a useful<br /> starting point.</h3>
                    <p className={styles.copy}>Show LTI support where educators evaluate a tool, with available versions and a path into configuration.</p>
                    <p className={styles["relay-margin-note"]}>The entry point is part<br />of the product.</p>
                  </div>
                  <LtiArtifact artifact={ltiAssets.discover} views={ltiInspections.discover} inspectionHint="Inspect placements, services, and setup guidance" className={styles["relay-evidence"]} />
                </div>
              </section>
            </div>
            <div className={styles.beat} data-lti-beat>
              <section id="controllable" className={cx("relay-box", "relay-control", "graphite")} aria-labelledby="controllable-title">
                <RelayTitle title="Controllable" id="controllable-title" contact />
                <LtiArtifact artifact={ltiAssets.control} views={ltiInspections.control} inspectionHint="Follow the provider’s create, save, and publish workflow" className={cx("relay-evidence", "relay-control-source")} />
                <div className={styles["relay-control-footer"]}>
                  <h3>A connection needs<br /> clear controls.</h3>
                  <p className={styles.copy}>Bring Tool IDs, libraries, interoperability, and badges into the provider’s product-management view.</p>
                  <span className={styles["relay-control-mark"]} aria-hidden="true"><i /><i /><i /></span>
                </div>
              </section>
            </div>
            <div className={styles.beat} data-lti-beat>
              <section id="configurable" className={cx("relay-box", "relay-configure", "paper")} aria-labelledby="configurable-title">
                <RelayTitle title="Configurable" id="configurable-title" contact />
                <div className={styles["relay-configure-intro"]}>
                  <h3>Support the setup.</h3>
                  <p className={styles.copy}>Plan URL, manual, and JSON configuration paths, including validation, permissions, placements, and review.</p>
                </div>
                <LtiArtifact artifact={ltiAssets.configure} views={ltiInspections.configure} inspectionHint="Explore URL, manual, and JSON setup paths" className={cx("relay-evidence", "relay-configure-source")} />
                <span className={cx("relay-register", "mono")} aria-hidden="true">SETUP / CONTEXT / CONNECTION</span>
              </section>
            </div>
          </div>
          <section className={cx("beat", "relay-delivery", "graphite")} data-lti-beat aria-labelledby="delivery-title">
            <h2 id="delivery-title">Different methods.<br />One coordinated effort.</h2>
            <p className={styles.copy}>I used Agile with engineering, Kanban for contractor tagging and uploads, and critical-path planning to coordinate dependencies and launch targets.</p>
            <div className={styles["relay-delivery-note"]}><p>More than 900 tools made onboarding, review, and data hygiene a substantial part of the work.</p><span className={styles.caption}>Reported project scope</span></div>
          </section>
        </article>
      </LtiMotion>
    </main>
  </PortfolioShell>;
}
