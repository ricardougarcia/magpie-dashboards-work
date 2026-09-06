export const contentType = "image/svg+xml";

export default function Icon() {
  const color = process.env.VERCEL_TARGET_ENV === "uat" ? "#FFFFFF" : "#D6452F";

  return new Response(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <path d="M13 2h6v11h11v6H19v11h-6V19H2v-6h11V2Z" fill="${color}" shape-rendering="crispEdges"/>
</svg>`,
    { headers: { "Content-Type": contentType } },
  );
}
