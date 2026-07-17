import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);
  const bangla = request.nextUrl.pathname === "/bn" || request.nextUrl.pathname.startsWith("/bn/");
  requestHeaders.set("x-khelaghor-locale", bangla ? "bn" : "en");
  let response: NextResponse;
  if (bangla) {
    const url = request.nextUrl.clone();
    url.pathname = request.nextUrl.pathname.slice(3) || "/";
    response = NextResponse.rewrite(url, { request: { headers: requestHeaders } });
    response.cookies.set("KG_LOCALE", "bn", { sameSite: "lax", path: "/", maxAge: 31536000 });
  } else {
    response = NextResponse.next({ request: { headers: requestHeaders } });
    if (request.nextUrl.searchParams.get("locale") === "en")
      response.cookies.set("KG_LOCALE", "en", { sameSite: "lax", path: "/", maxAge: 31536000 });
  }
  response.headers.set("x-request-id", requestId);
  return response;
}

export const config = {
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico|uploads/).*)"],
};
