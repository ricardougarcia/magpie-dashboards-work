import { NextResponse, type NextRequest } from "next/server";
import { isIndexablePortfolioPage, portfolioRedirect } from "@/lib/portfolio-release";

export function proxy(request: NextRequest) {
  const host = request.headers.get("host");
  const pathname = request.nextUrl.pathname;
  const redirect = request.method === "GET" || request.method === "HEAD"
    ? portfolioRedirect(host, pathname)
    : null;
  if (redirect) {
    const destination = redirect.canonicalOrigin
      ? new URL(redirect.pathname, redirect.canonicalOrigin)
      : request.nextUrl.clone();
    destination.pathname = redirect.pathname;
    destination.search = request.nextUrl.search;
    // No fragment is supplied: browsers retain the original link's fragment.
    const response = NextResponse.redirect(destination, 308);
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }

  const response = NextResponse.next();
  response.headers.set("X-Robots-Tag", isIndexablePortfolioPage(host, pathname)
    ? "index, follow"
    : "noindex, nofollow");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
