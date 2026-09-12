// The Board owns placement and numbering. Case-study URLs and section numbers
// remain independent; reorder these entries to author the reading sequence.
export type BoardEntry = {
  id: string;
  number: string;
  title: string;
  kind: "magpie" | "ccp" | "reserved";
  signature: "timeline" | "catalog" | "register" | "bridge" | "portal" | "workflow";
};

export const boardEntries = [
  { id: "magpie", number: "01", title: "Magpie", kind: "magpie", signature: "timeline" },
  { id: "marketplace", number: "02", title: "EdTech Marketplace", kind: "reserved", signature: "catalog" },
  { id: "gcm", number: "03", title: "GCM", kind: "reserved", signature: "register" },
  { id: "lti", number: "04", title: "LTI", kind: "reserved", signature: "bridge" },
  { id: "partner-portal", number: "05", title: "Partner Portal", kind: "reserved", signature: "portal" },
  { id: "learnplatform-ccp", number: "06", title: "Customer Created Products", kind: "ccp", signature: "workflow" },
] as const satisfies readonly BoardEntry[];
