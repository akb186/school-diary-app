import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  sessionCookieName,
  verifySessionToken,
} from "@/lib/session";

const protectedRoutes = [
  {
    prefix: "/admin",
    role: "ADMIN",
  },
  {
    prefix: "/api/users",
    role: "ADMIN",
  },
  {
    prefix: "/api/classes",
    role: "ADMIN",
  },
  {
    prefix: "/teacher",
    role: "TEACHER",
  },
  {
    prefix: "/student",
    role: "STUDENT",
  },
];

export async function middleware(
  request: NextRequest
) {
  const protectedRoute =
    protectedRoutes.find((route) =>
      request.nextUrl.pathname.startsWith(
        route.prefix
      )
    );

  if (!protectedRoute) {
    return NextResponse.next();
  }

  const session =
    await verifySessionToken(
      request.cookies.get(
        sessionCookieName
      )?.value
    );

  if (
    !session ||
    session.role !== protectedRoute.role
  ) {
    return NextResponse.redirect(
      new URL("/", request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/teacher",
    "/teacher/:path*",
    "/student",
    "/student/:path*",
    "/api/users",
    "/api/users/:path*",
    "/api/classes",
    "/api/classes/:path*",
  ],
};
