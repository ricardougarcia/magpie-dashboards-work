import Image from "next/image";
import { preload } from "react-dom";
import resumeText from "@/data/resume-text.json";
import { ResumePlayer } from "./resume-player";
import styles from "./resume.module.css";

export function ResumePage() {
  preload("/resume-assets/resume-vectors.json", { as: "fetch", crossOrigin: "anonymous" });
  return (
    <ResumePlayer>
      <div className={styles.transcript}>
        <h1>Rico Garcia — Resume</h1>
        {resumeText.map((page) => (
          <section key={page.page} aria-label={`Resume page ${page.page}`}>
            {page.lines.map((text, index) => <p key={index}>{text}</p>)}
          </section>
        ))}
        <a href="mailto:ricardougarcia@gmail.com">Email Rico Garcia</a>
        <a href="tel:+17577179517">Call Rico Garcia</a>
        <a href="https://www.linkedin.com/in/ricardougarcia">LinkedIn</a>
      </div>
      {[1, 2].map((page) => (
        <div key={page} className={styles.sheet} data-resume-sheet={page}>
          <Image
            className={styles.source}
            src={`/resume-assets/page-${page}.svg`}
            alt=""
            aria-hidden="true"
            width={612}
            height={792}
            unoptimized
            preload
            draggable={false}
          />
          <canvas className={styles.canvas} data-resume-canvas={page} aria-hidden="true" />
        </div>
      ))}
    </ResumePlayer>
  );
}
