import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Drawer | Rico Garcia",
  description: "",
  robots: { index: false, follow: false },
};

export default function DrawerPage() {
  return <main aria-label="Drawer" style={{ minHeight: "100svh", background: "var(--paper)" }} />;
}
