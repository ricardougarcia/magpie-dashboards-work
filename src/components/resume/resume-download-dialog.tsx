"use client";

import { useLayoutEffect, useRef } from "react";
import { RegisterText } from "./register-text";
import styles from "./resume-download-dialog.module.css";

function RegisterSurface() {
  return <span className={styles.surface} aria-hidden="true">{[0, 1, 2, 3].map((part) => <span key={part} />)}</span>;
}

export function ResumeDownloadDialog({ onDismiss }: { onDismiss: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const dismiss = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    const element = dialog.current!;
    const trigger = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    element.showModal();
    dismiss.current?.focus({ preventScroll: true });
    document.body.style.overflow = "hidden";
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus({ preventScroll: true });
    };
  }, []);

  return (
    <dialog ref={dialog} className={styles.dialog} aria-labelledby="resume-download-question" onClose={() => {
      // Ignore the stale close event from React's development effect replay.
      if (!dialog.current?.open) onDismiss();
    }}>
      <RegisterSurface />
      <div className={styles.content}>
        <h2 id="resume-download-question"><RegisterText delay={90}>Download the PDF?</RegisterText></h2>
        <div className={styles.actions}>
          <a className={styles.yes} href="/resume-assets/Rico_Garcia_Resume.pdf" download onClick={() => dialog.current?.close()}>
            <RegisterSurface /><RegisterText delay={260}>Yes</RegisterText>
          </a>
          <button ref={dismiss} type="button" onClick={() => dialog.current?.close()}>
            <RegisterSurface /><RegisterText delay={310}>Not Yet</RegisterText>
          </button>
        </div>
      </div>
    </dialog>
  );
}
