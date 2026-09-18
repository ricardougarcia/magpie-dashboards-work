import styles from "./scroll-progress.module.css";

type ScrollProgressProps = {
  labels: readonly string[];
  nextLabel: string;
  nextHref: string;
  className?: string;
};

/** A quiet native-scroll cue shared by the catalog and delivery sequences. */
export function ScrollProgress({ labels, nextLabel, nextHref, className = "" }: ScrollProgressProps) {
  return <div className={`${styles.progress} ${className}`} data-scroll-progress data-scroll-complete="false">
    <div className={styles.track} aria-hidden="true">
      <span className={styles.fill} />
      {labels.map((label, index) => <span key={label} className={styles.stop} data-scroll-stop data-current={index === 0 ? "true" : "false"} data-passed="false"><i />{label}</span>)}
    </div>
    <p className={styles.cue} data-scroll-invitation>Scroll to explore <svg viewBox="0 0 12 16" aria-hidden="true"><path d="M6 1v13M1 9l5 5 5-5" /></svg></p>
    <a className={styles.next} href={nextHref} data-scroll-next hidden>{nextLabel} <svg viewBox="0 0 12 16" aria-hidden="true"><path d="M6 1v13M1 9l5 5 5-5" /></svg></a>
  </div>;
}

/** Scope to the current sequence so painting Catalogs never changes Delivery. */
export function paintScrollProgress(root: HTMLElement, progress: number, selected: number) {
  const cue = root.matches("[data-scroll-progress]") ? root : root.querySelector<HTMLElement>("[data-scroll-progress]");
  if (!cue) return;
  const stops = [...cue.querySelectorAll<HTMLElement>("[data-scroll-stop]")];
  const value = Math.max(0, Math.min(1, progress));
  const complete = selected === stops.length - 1;
  cue.style.setProperty("--scroll-progress", String(value));
  cue.dataset.scrollComplete = String(complete);
  stops.forEach((stop, index) => {
    stop.dataset.current = String(index === selected);
    stop.dataset.passed = String(index < selected);
  });
  const invitation = cue.querySelector<HTMLElement>("[data-scroll-invitation]");
  const next = cue.querySelector<HTMLElement>("[data-scroll-next]");
  if (invitation) invitation.hidden = complete;
  if (next) next.hidden = !complete;
}
