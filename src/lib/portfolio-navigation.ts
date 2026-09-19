export const BOARD_POSITION = "portfolio-board-position";

export type PortfolioRouteFamily = "legacy" | "public";

const publicPaths: Record<string, string> = {
  "/": "/theboard/magpie",
  "/drawer": "/theboard",
  ...Object.fromEntries(["magpie", "gcm", "marketplace", "ccp", "portal", "lti", "pmf"].map((slug) => [`/work/${slug}`, `/theboard/${slug}`])),
};

// Resolve only the portfolio's internal document links. Assets, external URLs,
// same-page fragments, and unsupported routes retain their original meaning.
export function portfolioHref(href: string | undefined, family: PortfolioRouteFamily) {
  if (!href?.startsWith("/") || href.startsWith("//")) return href;
  const boundary = href.search(/[?#]/);
  const path = boundary < 0 ? href : href.slice(0, boundary);
  const suffix = boundary < 0 ? "" : href.slice(boundary);
  if (family === "public") return `${publicPaths[path] ?? path}${suffix}`;
  if (path === "/resume") {
    const url = new URL(href, "https://portfolio.invalid");
    url.searchParams.set("board", "drawer");
    return `${url.pathname}${url.search}${url.hash}`;
  }
  return href;
}

export function isBoardPath(path: string) {
  return path === "/drawer" || path === "/theboard";
}

export function isBoardDestination(board: string, path: string) {
  return path === "/resume" || (board === "/theboard"
    ? Object.values(publicPaths).includes(path) && path !== "/theboard"
    : path === "/" || /^\/work\/(magpie|gcm|marketplace|ccp|portal|lti|pmf)$/.test(path));
}

// Runs before the Board paints, including a full document return on browsers
// without BFCache. Only restores framing for the Project the visitor just left.
export const boardRestorationScript = `(function(){try{
  var from=sessionStorage.getItem('portfolio-return');
  sessionStorage.removeItem('portfolio-return');
  var saved=JSON.parse(sessionStorage.getItem('${BOARD_POSITION}')||'null');
  if(location.hash||!from||!saved||saved.project!==from||!Number.isFinite(saved.y))return;
  if(saved.board&&saved.board!==location.pathname)return;
  var restore=function(){window.scrollTo({top:saved.y,behavior:'instant'});};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',restore,{once:true});else restore();
}catch(e){}})();`;
