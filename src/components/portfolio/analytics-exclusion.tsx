"use client";

import Link from "next/link";
import { useState } from "react";
import { excludeBrowserFromAnalytics } from "@/lib/portfolio-analytics";
import styles from "./analytics-exclusion.module.css";

export function AnalyticsExclusion() {
  const [status, setStatus] = useState<"idle" | "saved" | "failed">("idle");
  const [hostname, setHostname] = useState("");

  function exclude() {
    setHostname(window.location.hostname);
    setStatus(excludeBrowserFromAnalytics() ? "saved" : "failed");
  }

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="exclusion-title">
        <p className={styles.index}>VISITOR ANALYTICS</p>
        <h1 id="exclusion-title">Exclude your visits</h1>
        <p>Keep visits from this browser out of the portfolio’s visitor statistics.</p>
        <button className={styles.button} onClick={exclude}>
          {status === "saved" ? "Confirm exclusion" : "Exclude this browser"}
        </button>
        <div aria-live="polite" className={styles.status}>
          {status === "saved" && <p>Your visits from this browser are excluded on <strong>{hostname}</strong>.</p>}
          {status === "failed" && <p>The exclusion could not be saved. Allow this site to save browser data, then try again. This settings page is never counted.</p>}
        </div>
        <p className={styles.note}>Repeat this on each browser and device you use. Private browsing, clearing site data, or using a different site address requires a new exclusion. Earlier visits are unaffected.</p>
        <Link className={styles.back} href="/theboard">Return to The Board</Link>
      </section>
    </main>
  );
}
